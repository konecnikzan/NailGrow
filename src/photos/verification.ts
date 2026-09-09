import type { DecodedSize, FsPort, ImagePort } from './ports';
import { failure, ok, type Result } from './result';

/**
 * The write-verification gate. A database row is only ever inserted after this
 * returns `ok` for BOTH the photo and its thumbnail. It answers the three
 * questions the incumbent gets wrong:
 *
 *   1. is the file actually on disk?        (exists)
 *   2. is it more than an empty stub?       (size > 0)
 *   3. does it decode to real pixels?       (probe succeeds, dimensions > 0)
 *
 * A `false` here means we must NOT touch the database and must roll back any
 * files already written.
 */
export async function verifyImageFile(
  deps: { fs: FsPort; image: ImagePort },
  uri: string,
): Promise<Result<DecodedSize>> {
  const { fs, image } = deps;

  if (!fs.exists(uri)) {
    return failure('VERIFY_FILE_MISSING', `Expected file is not on disk after write: ${uri}`);
  }

  const size = fs.size(uri);
  if (size <= 0) {
    return failure('VERIFY_FILE_EMPTY', `File is present but ${size} bytes: ${uri}`, {
      context: { size },
    });
  }

  let dimensions: DecodedSize;
  try {
    dimensions = await image.probe(uri);
  } catch (cause) {
    return failure('VERIFY_UNREADABLE', `File is present but will not decode: ${uri}`, { cause });
  }

  if (dimensions.width <= 0 || dimensions.height <= 0) {
    return failure(
      'VERIFY_ZERO_DIMENSIONS',
      `File decoded to ${dimensions.width}x${dimensions.height}: ${uri}`,
      { context: { dimensions } },
    );
  }

  return ok(dimensions);
}
