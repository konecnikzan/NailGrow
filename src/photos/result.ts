import { PhotoError, type PhotoErrorCode, type PhotoErrorOptions } from './errors';

/**
 * The pipeline returns results, it does not throw. `ok` carries the value; the
 * failure branch always carries a typed `PhotoError`. Callers must check `.ok`
 * before reading `.value`, which keeps every failure path visible at the call
 * site.
 */
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: PhotoError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function failure(
  code: PhotoErrorCode,
  message: string,
  options?: PhotoErrorOptions,
): Result<never> {
  return { ok: false, error: new PhotoError(code, message, options) };
}

export function errorResult(error: PhotoError): Result<never> {
  return { ok: false, error };
}
