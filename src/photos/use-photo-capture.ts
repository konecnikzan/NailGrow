import type { CameraView } from 'expo-camera';
import { useCameraPermissions } from 'expo-camera';
import { useCallback, useState } from 'react';

import type { Hand, Photo } from '@/db/schema';

import { capturePhoto } from './index';

export interface PhotoCaptureController {
  permissionGranted: boolean;
  requestPermission: () => void;
  /** Take a picture with `camera` and run it through the pipeline. Returns the row, or null on any failure. */
  capture: (camera: CameraView | null, hand: Hand) => Promise<Photo | null>;
  busy: boolean;
  /** Human-readable text for the last failure (typed error code + message), or null. */
  lastError: string | null;
}

/**
 * Bridges `expo-camera` to the photo pipeline for the test harness.
 *
 * NOTE (Android dev): `takePictureAsync` writes a TEMP file into the cache
 * directory and returns its `uri`. That file is not durable — the pipeline reads
 * it, normalises it, and writes the real copy into the document directory. We
 * pass `exif: true` so the pipeline can record the source frame's EXIF
 * orientation before baking it into the pixels.
 */
export function usePhotoCapture(): PhotoCaptureController {
  const [permission, requestPermissionAsync] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const capture = useCallback<PhotoCaptureController['capture']>(async (camera, hand) => {
    if (!camera) {
      setLastError('camera not ready');
      return null;
    }
    setBusy(true);
    setLastError(null);
    try {
      const shot = await camera.takePictureAsync({ exif: true, quality: 1 });
      if (!shot?.uri) {
        setLastError('camera returned no image');
        return null;
      }

      const orientation = shot.exif?.Orientation;
      const result = await capturePhoto({
        sourceUri: shot.uri,
        hand,
        sourceOrientation: typeof orientation === 'number' ? orientation : undefined,
      });

      if (!result.ok) {
        setLastError(`${result.error.code}: ${result.error.message}`);
        return null;
      }
      return result.value;
    } catch (error) {
      setLastError(String(error));
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    permissionGranted: permission?.granted ?? false,
    requestPermission: () => void requestPermissionAsync(),
    capture,
    busy,
    lastError,
  };
}
