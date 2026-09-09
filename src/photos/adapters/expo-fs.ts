import { Directory, File, Paths } from 'expo-file-system';

import type { FsPort } from '../ports';

/**
 * `FsPort` over `expo-file-system`'s SDK 54+ object API.
 *
 * NOTE (Android dev): `new File(uri)` is NOT `java.io.File` and is NOT an open
 * handle — it is a lightweight reference that touches disk only when you call a
 * method. Also note the API has BOTH async (`move`, `copy`) and sync (`moveSync`,
 * `copySync`, `delete`, `create`) variants of the mutating methods. This port is
 * synchronous, so it must use the `*Sync` ones — calling the async `move` here
 * and returning before it settles is what caused capture verification to race.
 *
 * `Paths.document` is the app's private documents directory; files there survive
 * the OS cache eviction that clears `Paths.cache`.
 */
export function createExpoFsPort(): FsPort {
  return {
    documentDirectory: Paths.document.uri,

    ensureDirectory(uri) {
      // idempotent: succeed silently if it exists. intermediates: create parents.
      new Directory(uri).create({ intermediates: true, idempotent: true });
    },

    exists(uri) {
      return new File(uri).exists;
    },

    size(uri) {
      const file = new File(uri);
      return file.exists ? file.size : 0;
    },

    move(srcUri, destUri) {
      // Synchronous move. `overwrite` because a retake reuses the same id/path.
      new File(srcUri).moveSync(new File(destUri), { overwrite: true });
    },

    remove(uri) {
      const file = new File(uri);
      if (file.exists) file.delete();
    },
  };
}
