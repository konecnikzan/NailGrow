import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import type * as schema from './schema';

/**
 * Accepted by every query function as the first argument. Typed structurally
 * (any synchronous SQLite driver + our schema) so tests can pass a different
 * driver — e.g. an in-memory one — without a cast, and so a transaction handle
 * is assignable too.
 */
export type Database = BaseSQLiteDatabase<'sync', unknown, typeof schema>;
