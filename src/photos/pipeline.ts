import {
  createPhoto,
  deletePhotoRow,
  getPhotoWithNails,
} from '@/db/queries';
import type { Hand, Photo } from '@/db/schema';

import type { FsPort, PipelineDeps, WrittenImage } from './ports';
import { photoFileUri, photosDir, thumbFileUri, thumbsDir } from './paths';
import { errorResult, failure, ok, type Result } from './result';
import { verifyImageFile } from './verification';

// Full-res is capped so a six-month timeline does not balloon on disk; the
// timeline itself scrolls thumbnails, never these.
const MAX_PHOTO_DIMENSION = 2048;
const PHOTO_JPEG_QUALITY = 0.9;
const THUMB_DIMENSION = 320;
const THUMB_JPEG_QUALITY = 0.7;

export interface CaptureInput {
  /**
   * file:// URI from `expo-camera`'s `takePictureAsync` — usually a temp file in
   * the cache directory. The pipeline reads it but does not delete it; the camera
   * and OS own that file.
   */
  sourceUri: string;
  hand: Hand;
  /**
   * EXIF `Orientation` (1-8) the camera reported for the source frame. Recorded
   * as `normalisedOrientation`; the stored file is always upright regardless.
   * Defaults to 1 when the camera does not report it.
   */
  sourceOrientation?: number;
  /** The photo this capture was aligned against. */
  referencePhotoId?: string | null;
  /** Override the capture timestamp (tests). Defaults to `deps.now()`. */
  capturedAt?: Date;
}

/**
 * Capture flow, in strict order:
 *
 *   1. confirm the camera source still exists
 *   2. ensure the target directories exist
 *   3. normalise orientation + downscale  -> temp file
 *   4. render a thumbnail                  -> temp file
 *   5. move both temp files into <document>/photos/... under the stable name
 *   6. VERIFY both written files (exists / non-empty / decodes / dimensions)
 *   7. only now insert the database row
 *
 * If any step 3-7 fails, every file this call wrote is deleted before returning,
 * so a failure never leaves an orphan file and — because the insert is dead last
 * — never an orphan row.
 */
export async function capturePhoto(
  deps: PipelineDeps,
  input: CaptureInput,
): Promise<Result<Photo>> {
  const { fs, image, db } = deps;
  const id = deps.newId();
  const capturedAt = input.capturedAt ?? deps.now();
  const documentDirectory = fs.documentDirectory;

  // 1. source present?
  if (!fs.exists(input.sourceUri)) {
    return failure('SOURCE_MISSING', `Camera source file no longer exists: ${input.sourceUri}`);
  }

  // 2. directories
  try {
    fs.ensureDirectory(photosDir(documentDirectory));
    fs.ensureDirectory(thumbsDir(documentDirectory));
  } catch (cause) {
    return failure('DIRECTORY_CREATE_FAILED', 'Could not create the photos directory', { cause });
  }

  const destPhoto = photoFileUri(documentDirectory, id);
  const destThumb = thumbFileUri(documentDirectory, id);
  // Every file this call has put on disk, for rollback.
  const written: string[] = [];

  // 3. normalise (bakes EXIF orientation into the pixels — see adapter)
  let normalised: WrittenImage;
  try {
    normalised = await image.normalise(input.sourceUri, {
      maxDimension: MAX_PHOTO_DIMENSION,
      quality: PHOTO_JPEG_QUALITY,
    });
  } catch (cause) {
    return failure('NORMALISE_FAILED', 'Failed to normalise the captured image', { cause });
  }
  written.push(normalised.uri);

  // 4. thumbnail, from the already-upright normalised file
  let thumbnail: WrittenImage;
  try {
    thumbnail = await image.thumbnail(normalised.uri, {
      size: THUMB_DIMENSION,
      quality: THUMB_JPEG_QUALITY,
    });
  } catch (cause) {
    return withRollback(fs, written, failure('THUMBNAIL_FAILED', 'Failed to render the thumbnail', { cause }));
  }
  written.push(thumbnail.uri);

  // 5. relocate both into the document directory under the stable name
  try {
    fs.move(normalised.uri, destPhoto);
    replace(written, normalised.uri, destPhoto);
    fs.move(thumbnail.uri, destThumb);
    replace(written, thumbnail.uri, destThumb);
  } catch (cause) {
    return withRollback(
      fs,
      written,
      failure('WRITE_FAILED', 'Failed to move processed files into the document directory', { cause }),
    );
  }

  // 6. verify — nothing hits the database until both files pass
  const photoCheck = await verifyImageFile(deps, destPhoto);
  if (!photoCheck.ok) return withRollback(fs, written, errorResult(photoCheck.error));

  const thumbCheck = await verifyImageFile(deps, destThumb);
  if (!thumbCheck.ok) return withRollback(fs, written, errorResult(thumbCheck.error));

  // 7. persist
  try {
    const photo = createPhoto(db, {
      id,
      capturedAt,
      fileUri: destPhoto,
      thumbUri: destThumb,
      hand: input.hand,
      width: photoCheck.value.width,
      height: photoCheck.value.height,
      normalisedOrientation: input.sourceOrientation ?? 1,
      referencePhotoId: input.referencePhotoId ?? null,
    });
    return ok(photo);
  } catch (cause) {
    return withRollback(
      fs,
      written,
      failure(
        'DB_INSERT_FAILED',
        'Files were written and verified but the database insert failed; files rolled back',
        { cause },
      ),
    );
  }
}

export interface DeletedPhoto {
  id: string;
  removedFiles: string[];
}

/**
 * Remove a photo: its row (nail rows cascade) and every file it owns.
 *
 * Row first. If the row delete throws, no file has been touched. If it succeeds,
 * the files are removed next; a file left behind is harmless (the integrity pass
 * ignores unreferenced files and a future sweep can GC them), whereas a row
 * pointing at a deleted file is precisely the bug this app exists to avoid — so
 * row-first is the safe ordering. A file that will not delete is reported, not
 * swallowed.
 */
export async function deletePhoto(deps: PipelineDeps, id: string): Promise<Result<DeletedPhoto>> {
  const { fs, db } = deps;

  const found = getPhotoWithNails(db, id);
  if (!found) return failure('NOT_FOUND', `No photo row with id ${id}`);

  const files = [
    found.photo.fileUri,
    found.photo.thumbUri,
    ...found.nails.map((nail) => nail.cropUri),
  ];

  try {
    deletePhotoRow(db, id);
  } catch (cause) {
    return failure('DELETE_ROW_FAILED', `Could not delete photo row ${id}`, { cause });
  }

  const stranded = removeAll(fs, files);
  if (stranded.length > 0) {
    return failure(
      'DELETE_FILES_INCOMPLETE',
      `Row ${id} was deleted but ${stranded.length} file(s) could not be removed`,
      { context: { strandedFiles: stranded } },
    );
  }

  return ok({ id, removedFiles: files });
}

// --- internals ---

/** Best-effort delete of every uri; returns the ones that could not be removed. */
function removeAll(fs: FsPort, uris: string[]): string[] {
  const stranded: string[] = [];
  for (const uri of uris) {
    try {
      fs.remove(uri);
    } catch {
      stranded.push(uri);
    }
  }
  return stranded;
}

/**
 * Roll back the files a failed capture wrote, then return the failure — annotated
 * with any files the rollback itself could not delete (surfaced, never hidden).
 */
function withRollback(
  fs: FsPort,
  written: string[],
  result: Result<never>,
): Result<never> {
  const stranded = removeAll(fs, written);
  if (stranded.length > 0 && !result.ok) {
    result.error.addContext({ strandedFiles: stranded });
  }
  return result;
}

function replace(list: string[], from: string, to: string): void {
  const index = list.indexOf(from);
  if (index !== -1) list[index] = to;
}
