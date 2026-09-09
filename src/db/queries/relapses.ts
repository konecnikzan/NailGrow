import { desc, eq } from 'drizzle-orm';

import { newId } from '../ids';
import { type Relapse, type Streak, relapses, streaks } from '../schema';
import type { Database } from '../types';
import { getActiveStreak } from './streaks';

export interface LogRelapseResult {
  relapse: Relapse;
  /** The streak that was ended, or null if none was active. */
  endedStreak: Streak | null;
  /** The fresh streak that now starts from `occurredAt`. */
  newStreak: Streak;
}

/**
 * Record a relapse. This does EXACTLY three things, all in one transaction:
 *   1. end the active streak (set its `endedAt`),
 *   2. insert the relapse row,
 *   3. start a new streak from the same moment.
 *
 * It never deletes a photo, a nail crop, a trigger, or any history. A user with
 * seven relapses and visible regrowth is a success story and the data must keep
 * showing that. The counter reset is silent — no flag, no shame field.
 */
export function logRelapse(
  db: Database,
  input?: { occurredAt?: Date; note?: string | null },
): LogRelapseResult {
  const occurredAt = input?.occurredAt ?? new Date();
  const note = input?.note ?? null;

  return db.transaction((tx) => {
    const active = getActiveStreak(tx);

    let endedStreak: Streak | null = null;
    if (active) {
      endedStreak =
        tx
          .update(streaks)
          .set({ endedAt: occurredAt })
          .where(eq(streaks.id, active.id))
          .returning()
          .get() ?? null;
    }

    const relapse = tx
      .insert(relapses)
      .values({
        id: newId(),
        occurredAt,
        note,
        endedStreakId: endedStreak?.id ?? null,
      })
      .returning()
      .get();

    const newStreak = tx
      .insert(streaks)
      .values({ id: newId(), startedAt: occurredAt })
      .returning()
      .get();

    return { relapse, endedStreak, newStreak };
  });
}

/** All relapses, newest first. */
export function listRelapses(db: Database): Relapse[] {
  return db.select().from(relapses).orderBy(desc(relapses.occurredAt)).all();
}
