import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { join } from 'node:path';

import * as schema from '@/db/schema';
import type { Database } from '@/db/types';

const MIGRATIONS_DIR = join(__dirname, '../../../db/migrations');

/**
 * A real in-memory SQLite database with the app's migrations applied, for query
 * and pipeline tests. `better-sqlite3` is a synchronous driver, so it matches the
 * `expo-sqlite` sync contract the query layer is written against — the same
 * `@/db/queries` functions run here unchanged.
 *
 * `better-sqlite3` ships prebuilt binaries for every common platform, so this
 * needs no build toolchain. Dev-only.
 */
export function createTestDb(): { db: Database; close: () => void } {
  const sqlite = new BetterSqlite3(':memory:');
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_DIR });

  return {
    db: db as unknown as Database,
    close: () => sqlite.close(),
  };
}
