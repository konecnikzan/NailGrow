import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'nailgrow.db';

/**
 * `openDatabaseSync` opens (and creates on first run) the DB file in the app's
 * private SQLite directory. No path handling needed — expo-sqlite manages it.
 */
const sqlite = openDatabaseSync(DATABASE_NAME);

// NOTE (Android dev): SQLite ships with foreign key enforcement OFF. Room turns it
// on for you; expo-sqlite does not. Without this, `onDelete` clauses in the schema
// are inert. Must be run per-connection, before any statement.
sqlite.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });

export { schema };
export { sqlite };
