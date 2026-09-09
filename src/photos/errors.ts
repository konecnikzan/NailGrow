/**
 * Every failure in the photo pipeline surfaces as one of these. No pipeline
 * function ever swallows an error or returns a bare null — the caller always gets
 * a typed `PhotoError` (via `Result`) it can branch on.
 */
export type PhotoErrorCode =
  // capture
  | 'SOURCE_MISSING'
  | 'DIRECTORY_CREATE_FAILED'
  | 'NORMALISE_FAILED'
  | 'THUMBNAIL_FAILED'
  | 'WRITE_FAILED'
  // verification (run before any DB write)
  | 'VERIFY_FILE_MISSING'
  | 'VERIFY_FILE_EMPTY'
  | 'VERIFY_UNREADABLE'
  | 'VERIFY_ZERO_DIMENSIONS'
  // persistence
  | 'DB_INSERT_FAILED'
  // delete
  | 'NOT_FOUND'
  | 'DELETE_ROW_FAILED'
  | 'DELETE_FILES_INCOMPLETE'
  // integrity
  | 'INTEGRITY_QUERY_FAILED';

export interface PhotoErrorOptions {
  cause?: unknown;
  context?: Record<string, unknown>;
}

export class PhotoError extends Error {
  readonly code: PhotoErrorCode;
  /** Extra diagnostics — e.g. `strandedFiles` a rollback could not delete. Mutable so a caller can annotate before rethrowing/returning. */
  context?: Record<string, unknown>;

  constructor(code: PhotoErrorCode, message: string, options?: PhotoErrorOptions) {
    // `cause` is ES2022; supported by Hermes on RN 0.86 and by Node.
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'PhotoError';
    this.code = code;
    this.context = options?.context;
  }

  addContext(extra: Record<string, unknown>): this {
    this.context = { ...this.context, ...extra };
    return this;
  }
}
