import { useCallback, useState } from 'react';

import { db } from '@/db/client';
import { getActiveStreak, startStreak } from '@/db/queries';
import type { Streak } from '@/db/schema';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface StreakState {
  streak: Streak;
  /** Days since the streak started, inclusive of today (day one shows "1"). */
  dayCount: number;
  /** Re-read the active streak — call after logging a relapse elsewhere. */
  reload: () => void;
}

/**
 * The Home screen's streak card needs an active streak to exist. There is no
 * user-facing "start tracking" action anywhere in the app — `startStreak` is
 * idempotent (returns the existing one if it's already running), so calling it
 * here just ensures one always exists rather than showing a fake "0".
 */
export function useStreak(): StreakState {
  const [streak, setStreak] = useState<Streak>(() => startStreak(db));
  // Snapshot "now" once per mount via useState's lazy initializer rather than
  // calling Date.now() during render (React Compiler requires render to stay
  // pure — a `useMemo` factory doesn't get the same exemption); day-granularity
  // doesn't need anything fresher.
  const [now, setNow] = useState(() => Date.now());

  // logRelapse (elsewhere) ends this streak and starts a new one; nothing
  // subscribes to that automatically, so the caller reloads explicitly.
  const reload = useCallback(() => {
    setStreak(getActiveStreak(db) ?? startStreak(db));
    setNow(Date.now());
  }, []);

  const elapsedDays = Math.floor((now - streak.startedAt.getTime()) / MS_PER_DAY);
  return { streak, dayCount: elapsedDays + 1, reload };
}
