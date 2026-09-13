import { db } from '@/db/client';
import { getReferencePhoto } from '@/db/queries';
import type { Hand, Photo } from '@/db/schema';

export interface ReferencePhotoState {
  /** The photo pinned as this hand's ghost-overlay reference, or null. */
  referencePhoto: Photo | null;
}

/**
 * Reads the pinned reference photo for `hand`. `expo-sqlite` reads are
 * synchronous and cheap, so this just reads fresh on every render — no cached
 * state, no effect, no "adjust state when a prop changes" bailout-render dance.
 *
 * That dance (calling `setState` mid-render when `hand` had changed) is what
 * this replaced: switching hand triggered it for the first time on whichever
 * hand wasn't the initial value, and it appears to be what was tipping some
 * other part of the tree (still being narrowed down) into losing React
 * context on the same render — e.g. the "Couldn't find a navigation context"
 * crash reported switching to the second hand. A plain per-render read has no
 * bailout-and-restart render to interact badly with anything.
 */
export function useReferencePhoto(hand: Hand): ReferencePhotoState {
  return { referencePhoto: getReferencePhoto(db, hand) ?? null };
}
