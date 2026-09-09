import { listAllPhotos } from '@/db/queries';
import type { Photo } from '@/db/schema';

import type { FsPort, ImagePort, PipelineDeps } from './ports';
import { failure, ok, type Result } from './result';

export type IntegrityIssueKind =
  | 'PHOTO_FILE_MISSING'
  | 'PHOTO_FILE_EMPTY'
  | 'PHOTO_FILE_UNREADABLE'
  | 'THUMB_FILE_MISSING'
  | 'THUMB_FILE_EMPTY'
  | 'THUMB_FILE_UNREADABLE';

export interface IntegrityIssue {
  photoId: string;
  capturedAt: Date;
  kind: IntegrityIssueKind;
  uri: string;
  detail: string;
}

export interface IntegrityReport {
  /** Number of photo rows scanned. */
  checked: number;
  issues: IntegrityIssue[];
  /** True when `issues` is empty. */
  healthy: boolean;
}

/**
 * Walk every photo row and check that its file and thumbnail are still on disk
 * and non-empty. Read-only — it never deletes or repairs anything; the UI flags
 * the offending rows instead of silently rendering blank tiles.
 *
 * By default this is the cheap pass (exists + size) meant for app startup. Pass
 * `{ decode: true }` for a thorough sweep that also confirms each file decodes.
 */
export async function runIntegrityCheck(
  deps: Pick<PipelineDeps, 'db' | 'fs' | 'image'>,
  opts: { decode?: boolean } = {},
): Promise<Result<IntegrityReport>> {
  const { db, fs, image } = deps;

  let rows: Photo[];
  try {
    rows = listAllPhotos(db);
  } catch (cause) {
    return failure('INTEGRITY_QUERY_FAILED', 'Could not read photo rows for the integrity pass', {
      cause,
    });
  }

  const issues: IntegrityIssue[] = [];
  for (const row of rows) {
    await inspect(fs, image, opts.decode ?? false, issues, row, 'PHOTO', row.fileUri);
    await inspect(fs, image, opts.decode ?? false, issues, row, 'THUMB', row.thumbUri);
  }

  return ok({ checked: rows.length, issues, healthy: issues.length === 0 });
}

async function inspect(
  fs: FsPort,
  image: ImagePort,
  decode: boolean,
  issues: IntegrityIssue[],
  row: Photo,
  which: 'PHOTO' | 'THUMB',
  uri: string,
): Promise<void> {
  const record = (kind: IntegrityIssueKind, detail: string) => {
    issues.push({ photoId: row.id, capturedAt: row.capturedAt, kind, uri, detail });
  };

  if (!fs.exists(uri)) {
    record(`${which}_FILE_MISSING`, 'file not found on disk');
    return;
  }
  if (fs.size(uri) <= 0) {
    record(`${which}_FILE_EMPTY`, 'file is zero bytes');
    return;
  }
  if (!decode) return;

  try {
    const dimensions = await image.probe(uri);
    if (dimensions.width <= 0 || dimensions.height <= 0) {
      record(`${which}_FILE_UNREADABLE`, `decoded to ${dimensions.width}x${dimensions.height}`);
    }
  } catch (cause) {
    record(`${which}_FILE_UNREADABLE`, `file will not decode: ${String(cause)}`);
  }
}
