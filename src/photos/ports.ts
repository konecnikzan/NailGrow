import type { Database } from '@/db/types';

/**
 * The pipeline talks to the filesystem and the image processor only through these
 * two ports. Real implementations live in `./adapters`; tests pass in-memory
 * fakes. This is why the "does a failed write leave an orphan row" test can run
 * with no native modules and no real files.
 */

export interface DecodedSize {
  width: number;
  height: number;
}

export interface WrittenImage extends DecodedSize {
  /** file:// URI of the produced file. */
  uri: string;
}

export interface FsPort {
  /** Absolute file:// URI of the app's document directory (survives OS cache eviction). May have a trailing slash. */
  readonly documentDirectory: string;
  /** Create a directory and any missing parents. Must not throw if it already exists. */
  ensureDirectory(uri: string): void;
  /** True if a readable file exists at `uri`. */
  exists(uri: string): boolean;
  /** Size in bytes; 0 if missing or unreadable. */
  size(uri: string): number;
  /** Move `srcUri` onto `destUri`, replacing any existing file. Parent of `destUri` must exist. */
  move(srcUri: string, destUri: string): void;
  /** Delete the file at `uri`. No-op if it is already gone. */
  remove(uri: string): void;
}

export interface ImagePort {
  /**
   * Decode `sourceUri`, bake its EXIF orientation into the pixels, downscale so
   * the longest edge is at most `maxDimension`, and re-encode as JPEG. Returns a
   * NEW file and its true (post-orientation) dimensions.
   */
  normalise(
    sourceUri: string,
    opts: { maxDimension: number; quality: number },
  ): Promise<WrittenImage>;

  /** As `normalise`, but produces a small thumbnail whose longest edge is `size`. */
  thumbnail(
    sourceUri: string,
    opts: { size: number; quality: number },
  ): Promise<WrittenImage>;

  /**
   * Decode a file just far enough to read its dimensions. Rejects if the file is
   * missing or will not decode — this is the "reads back" half of write
   * verification.
   */
  probe(uri: string): Promise<DecodedSize>;
}

export interface PipelineDeps {
  fs: FsPort;
  image: ImagePort;
  db: Database;
  /** Primary-key generator. Injected so tests get deterministic ids. */
  newId: () => string;
  /** Wall clock. Injected so tests get deterministic capture times. */
  now: () => Date;
}
