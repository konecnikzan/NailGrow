import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import { db } from './client';
import migrations from './migrations/bundle';

/**
 * Runs any pending migrations against the on-device database and reports state.
 * Call from the root layout and hold rendering until `success` is true — every
 * query below assumes the schema exists.
 *
 * `migrations` is the generated bundle (src/db/migrations/migrations.js), not the
 * raw .sql files; drizzle-kit inlines those at generate time.
 */
export function useDatabaseMigrations() {
  return useMigrations(db, migrations);
}
