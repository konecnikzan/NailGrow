import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { DecodedSize, ImagePort, WrittenImage } from '../ports';

/**
 * `ImagePort` over `expo-image-manipulator`'s SDK 52+ context API
 * (`manipulate(uri).…​.renderAsync()` then `saveAsync()` — `manipulateAsync` is
 * deprecated).
 *
 * Why every operation decodes and re-encodes: doing so applies the source EXIF
 * orientation to the actual pixels and drops the orientation tag. After this,
 * the gallery, the time-lapse, the compare slider and the export path can all
 * treat the file as upright with zero rotation logic. Storing the raw camera URI
 * and hoping each renderer honours EXIF is how the incumbent ends up with
 * sideways and blank photos.
 *
 * NOTE (Android dev): `saveAsync` writes into the CACHE directory. That is fine —
 * the pipeline immediately moves the result into the document directory. These
 * adapter methods deliberately do not concern themselves with final placement.
 */
export function createExpoImagePort(): ImagePort {
  return {
    async normalise(sourceUri, { maxDimension, quality }): Promise<WrittenImage> {
      const source = await ImageManipulator.manipulate(sourceUri).renderAsync();
      const longestEdge = Math.max(source.width, source.height);

      const context = ImageManipulator.manipulate(sourceUri);
      if (longestEdge > maxDimension) {
        const scale = maxDimension / longestEdge;
        context.resize({
          width: Math.round(source.width * scale),
          height: Math.round(source.height * scale),
        });
      }

      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({ compress: quality, format: SaveFormat.JPEG });
      return { uri: saved.uri, width: saved.width, height: saved.height };
    },

    async thumbnail(sourceUri, { size, quality }): Promise<WrittenImage> {
      const source = await ImageManipulator.manipulate(sourceUri).renderAsync();
      const longestEdge = Math.max(source.width, source.height);
      // Never upscale a thumbnail.
      const scale = Math.min(1, size / longestEdge);

      const rendered = await ImageManipulator.manipulate(sourceUri)
        .resize({
          width: Math.round(source.width * scale),
          height: Math.round(source.height * scale),
        })
        .renderAsync();
      const saved = await rendered.saveAsync({ compress: quality, format: SaveFormat.JPEG });
      return { uri: saved.uri, width: saved.width, height: saved.height };
    },

    async probe(uri): Promise<DecodedSize> {
      // renderAsync rejects if the file is missing or will not decode — that
      // rejection is the signal verification and the deep integrity pass rely on.
      const rendered = await ImageManipulator.manipulate(uri).renderAsync();
      return { width: rendered.width, height: rendered.height };
    },
  };
}
