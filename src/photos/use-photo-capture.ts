import type { CameraView } from 'expo-camera';
import { useCameraPermissions } from 'expo-camera';
import { useCallback, useState } from 'react';

import { db } from '@/db/client';
import { pinReference } from '@/db/queries';
import type { Hand, Photo } from '@/db/schema';

import { capturePhoto } from './index';

/** A raw frame from the camera — written to the cache dir, not yet committed. */
export interface RawShot {
  uri: string;
  width: number;
  height: number;
  /** EXIF `Orientation` (1-8) the camera reported, if any. */
  orientation?: number;
}

export interface CommitOptions {
  hand: Hand;
  /** The reference photo this frame was aligned against, for the row's `referencePhotoId`. */
  referencePhotoId: string | null;
  /** Pin the saved photo as this hand's reference (only meaningful if the hand has none). */
  pinAsReference: boolean;
}

export type CommitResult =
  | { ok: true; photo: Photo }
  | { ok: false; message: string };

/**
 * Two-step capture for the capture screen: `takeShot` grabs a frame to preview,
 * `commit` runs it through the pipeline (and optionally pins it) once the user
 * confirms. Splitting them means a discarded/retaken frame never touches the
 * database or the document directory.
 *
 * NOTE (Android dev): `takePictureAsync` returns a TEMP file in the cache dir.
 * It's fine to sit on that URI through the confirm step; if it's somehow gone by
 * the time the user hits "Use photo", `capturePhoto` returns a typed
 * `SOURCE_MISSING` and we surface it.
 */
export function usePhotoCapture() {
  const [permission, requestPermissionAsync] = useCameraPermissions();
  const [busy, setBusy] = useState(false);

  const takeShot = useCallback(
    async (camera: CameraView | null): Promise<RawShot | null> => {
      if (!camera) return null;
      setBusy(true);
      try {
        const shot = await camera.takePictureAsync({ exif: true, quality: 1 });
        if (!shot?.uri) return null;
        const orientation = shot.exif?.Orientation;
        return {
          uri: shot.uri,
          width: shot.width,
          height: shot.height,
          orientation: typeof orientation === 'number' ? orientation : undefined,
        };
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const commit = useCallback(
    async (shot: RawShot, options: CommitOptions): Promise<CommitResult> => {
      setBusy(true);
      try {
        const result = await capturePhoto({
          sourceUri: shot.uri,
          hand: options.hand,
          sourceOrientation: shot.orientation,
          referencePhotoId: options.referencePhotoId,
        });
        if (!result.ok) {
          return { ok: false, message: `${result.error.code}: ${result.error.message}` };
        }
        if (options.pinAsReference) {
          try {
            pinReference(db, result.value.id);
          } catch (pinError) {
            // The photo is saved; only the pin failed. Don't fail the capture —
            // the user can pin from the timeline later.
            console.warn('pinReference after capture failed:', pinError);
          }
        }
        return { ok: true, photo: result.value };
      } catch (error) {
        return { ok: false, message: String(error) };
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return {
    permissionGranted: permission?.granted ?? false,
    requestPermission: () => void requestPermissionAsync(),
    takeShot,
    commit,
    busy,
  };
}
