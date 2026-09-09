import { desc, eq, isNull } from 'drizzle-orm';

import { newId } from '../ids';
import { type Streak, streaks } from '../schema';
import type { Database } from '../types';

/** The current streak, or undefined if none is running. */
export function getActiveStreak(db: Database): Streak | undefined {
  return db.select().from(streaks).where(isNull(streaks.endedAt)).get();
}

/**
 * Start a streak. Idempotent: if one is already active it is returned unchanged,
 * so there is never more than one active streak.
 */
export function startStreak(db: Database, opts?: { startedAt?: Date }): Streak {
  const existing = getActiveStreak(db);
  if (existing) return existing;
  return db
    .insert(streaks)
    .values({ id: newId(), startedAt: opts?.startedAt ?? new Date() })
    .returning()
    .get();
}

/**
 * End the active streak without recording a relapse (e.g. the user stops
 * tracking). Returns the ended streak, or undefined if none was active. Does not
 * start a new one. Use `logRelapse` for the relapse flow.
 */
export function endActiveStreak(
  db: Database,
  opts?: { endedAt?: Date },
): Streak | undefined {
  const active = getActiveStreak(db);
  if (!active) return undefined;
  return db
    .update(streaks)
    .set({ endedAt: opts?.endedAt ?? new Date() })
    .where(eq(streaks.id, active.id))
    .returning()
    .get();
}

/** All streaks, newest first — the history view. */
export function listStreaks(db: Database): Streak[] {
  return db.select().from(streaks).orderBy(desc(streaks.startedAt)).all();
}
