import type { DecodedSize, FsPort, ImagePort, WrittenImage } from '@/photos/ports';

/**
 * In-memory `FsPort`. Files are just byte counts keyed by URI. Test hooks
 * (`failEnsureDir`, `failMoveTo`, `failRemoveOf`) force specific failures.
 */
export class FakeFs implements FsPort {
  readonly documentDirectory = 'file:///doc';

  private readonly files = new Map<string, number>();
  readonly createdDirs = new Set<string>();

  failEnsureDir = false;
  failMoveTo?: (destUri: string) => boolean;
  failRemoveOf?: (uri: string) => boolean;

  // --- test helpers ---
  put(uri: string, bytes = 1024): void {
    this.files.set(uri, bytes);
  }
  has(uri: string): boolean {
    return this.files.has(uri);
  }
  list(): string[] {
    return [...this.files.keys()];
  }
  listUnder(prefix: string): string[] {
    return this.list().filter((uri) => uri.startsWith(prefix));
  }

  // --- FsPort ---
  ensureDirectory(uri: string): void {
    if (this.failEnsureDir) throw new Error(`ensureDirectory(${uri}) failed (test)`);
    this.createdDirs.add(uri);
  }

  exists(uri: string): boolean {
    return this.files.has(uri);
  }

  size(uri: string): number {
    return this.files.get(uri) ?? 0;
  }

  move(srcUri: string, destUri: string): void {
    if (this.failMoveTo?.(destUri)) throw new Error(`move -> ${destUri} failed (test)`);
    const bytes = this.files.get(srcUri);
    if (bytes === undefined) throw new Error(`move source missing: ${srcUri}`);
    this.files.delete(srcUri);
    this.files.set(destUri, bytes);
  }

  remove(uri: string): void {
    if (this.failRemoveOf?.(uri)) throw new Error(`remove(${uri}) failed (test)`);
    this.files.delete(uri);
  }
}

/**
 * In-memory `ImagePort`. `normalise`/`thumbnail` register a new file in the
 * shared `FakeFs`, mimicking `saveAsync` writing to cache. `probe` results are
 * configurable per-URI so verification failures can be simulated.
 */
export class FakeImage implements ImagePort {
  private counter = 0;
  probeDefault: DecodedSize | 'throw' = { width: 2048, height: 1536 };
  readonly probeOverrides = new Map<string, DecodedSize | 'throw'>();

  constructor(private readonly fs: FakeFs) {}

  async normalise(sourceUri: string): Promise<WrittenImage> {
    if (!this.fs.exists(sourceUri)) throw new Error(`normalise: source missing ${sourceUri}`);
    const uri = `file:///cache/normalised-${this.counter++}.jpg`;
    this.fs.put(uri, 900_000);
    return { uri, width: 2048, height: 1536 };
  }

  async thumbnail(sourceUri: string): Promise<WrittenImage> {
    if (!this.fs.exists(sourceUri)) throw new Error(`thumbnail: source missing ${sourceUri}`);
    const uri = `file:///cache/thumb-${this.counter++}.jpg`;
    this.fs.put(uri, 18_000);
    return { uri, width: 320, height: 240 };
  }

  async probe(uri: string): Promise<DecodedSize> {
    const result = this.probeOverrides.get(uri) ?? this.probeDefault;
    if (result === 'throw') throw new Error(`probe: cannot decode ${uri}`);
    return result;
  }
}
