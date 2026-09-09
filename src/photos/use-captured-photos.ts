import { useCallback, useEffect, useState } from 'react';

import { db } from '@/db/client';
import { listAllPhotos } from '@/db/queries';
import type { Photo } from '@/db/schema';

import { runIntegrityCheck } from './index';

export interface CapturedPhotosState {
  photos: Photo[];
  /** Row ids whose file or thumbnail failed the startup integrity pass. */
  flaggedIds: Set<string>;
  reload: () => void;
}

// listAllPhotos is oldest-first; the list shows newest-first.
function readPhotos(): Photo[] {
  return listAllPhotos(db).reverse();
}

/**
 * Harness-facing read model for the captured photos list. There is no live query
 * wired yet (the DB is opened without a change listener), so callers `reload()`
 * after a capture or delete. The first read happens synchronously in a lazy
 * initializer — `expo-sqlite` reads are synchronous, so there is no loading state.
 *
 * On mount and after every reload it runs the cheap integrity pass and exposes
 * the ids of any rows pointing at a missing/empty file, so the list can mark them
 * instead of rendering a blank tile.
 */
export function useCapturedPhotos(): CapturedPhotosState {
  const [photos, setPhotos] = useState<Photo[]>(readPhotos);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  const reload = useCallback(() => {
    setPhotos(readPhotos());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void runIntegrityCheck().then((result) => {
      if (cancelled || !result.ok) return;
      setFlaggedIds(new Set(result.value.issues.map((issue) => issue.photoId)));
    });
    return () => {
      cancelled = true;
    };
  }, [photos]);

  return { photos, flaggedIds, reload };
}
