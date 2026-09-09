/**
 * The stable on-disk naming scheme. A photo row's files are fully determined by
 * its id, so any row can be located, verified, or deleted without extra lookups:
 *
 *   <document>/photos/<id>.jpg          full-resolution, orientation-normalised
 *   <document>/photos/thumbs/<id>.jpg   thumbnail
 *
 * Everything is under the document directory — never the cache directory, which
 * the OS purges (the likeliest cause of NailKeeper's blank-white photos).
 */

export const PHOTOS_DIRNAME = 'photos';
export const THUMBS_DIRNAME = 'thumbs';

function stripTrailingSlash(uri: string): string {
  return uri.endsWith('/') ? uri.slice(0, -1) : uri;
}

export function photosDir(documentDirectory: string): string {
  return `${stripTrailingSlash(documentDirectory)}/${PHOTOS_DIRNAME}`;
}

export function thumbsDir(documentDirectory: string): string {
  return `${photosDir(documentDirectory)}/${THUMBS_DIRNAME}`;
}

export function photoFileUri(documentDirectory: string, id: string): string {
  return `${photosDir(documentDirectory)}/${id}.jpg`;
}

export function thumbFileUri(documentDirectory: string, id: string): string {
  return `${thumbsDir(documentDirectory)}/${id}.jpg`;
}
