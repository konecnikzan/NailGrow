import { db } from '@/db/client';
import { newId } from '@/db/ids';

import { createExpoFsPort } from './adapters/expo-fs';
import { createExpoImagePort } from './adapters/expo-image';
import type { PipelineDeps } from './ports';

/**
 * The real wiring: expo adapters + the app's SQLite connection. This is the only
 * module in `src/photos` that pulls in native modules, so tests import the
 * pipeline modules directly and never touch this file.
 */
let cached: PipelineDeps | null = null;

export function getDefaultDeps(): PipelineDeps {
  if (!cached) {
    cached = {
      fs: createExpoFsPort(),
      image: createExpoImagePort(),
      db,
      newId,
      now: () => new Date(),
    };
  }
  return cached;
}
