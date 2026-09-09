import { getDefaultDeps } from './deps';
import { runIntegrityCheck as runIntegrityCheckImpl } from './integrity';
import {
  capturePhoto as capturePhotoImpl,
  deletePhoto as deletePhotoImpl,
  type CaptureInput,
} from './pipeline';

/**
 * Public photo-pipeline API, bound to the real expo + SQLite implementations.
 * Screens and hooks call these; nothing else in the app should reach into the
 * modules below directly.
 */

export function capturePhoto(input: CaptureInput) {
  return capturePhotoImpl(getDefaultDeps(), input);
}

export function deletePhoto(id: string) {
  return deletePhotoImpl(getDefaultDeps(), id);
}

export function runIntegrityCheck(opts?: { decode?: boolean }) {
  return runIntegrityCheckImpl(getDefaultDeps(), opts);
}

export { PhotoError } from './errors';
export type { PhotoErrorCode } from './errors';
export type { Result } from './result';
export type { CaptureInput, DeletedPhoto } from './pipeline';
export type {
  IntegrityIssue,
  IntegrityIssueKind,
  IntegrityReport,
} from './integrity';
export type { DecodedSize } from './ports';
