import { eq } from 'drizzle-orm';

import { settings } from '../schema';
import type { Database } from '../types';

/** Read a setting. `undefined` if never set — callers decide the default. */
export function getSetting(db: Database, key: string): string | undefined {
  return db.select().from(settings).where(eq(settings.key, key)).get()?.value;
}

/** Write a setting, creating or overwriting it. */
export function setSetting(db: Database, key: string, value: string): void {
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run();
}
