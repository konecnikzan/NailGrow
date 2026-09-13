import { useState } from 'react';

import { db } from '@/db/client';
import { getSetting, setSetting } from '@/db/queries';

const TRIAL_LENGTH_DAYS = 14;
const TRIAL_STARTED_AT_KEY = 'trial_started_at';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface TrialStatus {
  daysRemaining: number; // clamped to 0, never negative
  isActive: boolean;
}

/**
 * The 14-day free trial from CLAUDE.md's monetisation section: starts the
 * first time this hook ever runs (stored in `settings`, never reset) and
 * counts down. This only tracks and displays the countdown — it does not gate
 * capture or anything else. That gate is `react-native-purchases` wiring,
 * which isn't built this session; until it exists there is nothing to
 * "expire" into, so `isActive` is exposed but unused for now.
 */
export function useTrialStatus(): TrialStatus {
  const [startedAt] = useState<number>(() => {
    const existing = getSetting(db, TRIAL_STARTED_AT_KEY);
    if (existing) return Number(existing);
    const startedNow = Date.now();
    setSetting(db, TRIAL_STARTED_AT_KEY, String(startedNow));
    return startedNow;
  });
  // Snapshot "now" once per mount via useState's lazy initializer, not a bare
  // Date.now() call during render — see use-streak.ts for why.
  const [now] = useState(() => Date.now());

  const elapsedDays = Math.floor((now - startedAt) / MS_PER_DAY);
  const daysRemaining = Math.max(0, TRIAL_LENGTH_DAYS - elapsedDays);
  return { daysRemaining, isActive: daysRemaining > 0 };
}
