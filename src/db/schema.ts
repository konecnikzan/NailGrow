import { sql } from 'drizzle-orm';
import {
  type AnySQLiteColumn,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

/**
 * All timestamps are stored as integer Unix milliseconds (`{ mode: 'timestamp_ms' }`),
 * so the query layer deals in JS `Date` objects. On disk they are plain integers, which
 * keeps the phone-to-phone archive export trivial.
 *
 * Primary keys are client-generated UUID v4 strings (see `src/db/ids.ts`). The photo
 * pipeline needs a photo's id *before* the row is inserted (it names files after it), so
 * autoincrement integers are not an option. UUIDs are used everywhere for consistency.
 */

export const HANDS = ['left', 'right'] as const;
export type Hand = (typeof HANDS)[number];

export const FINGER_IDS = [
  'left_thumb',
  'left_index',
  'left_middle',
  'left_ring',
  'left_pinky',
  'right_thumb',
  'right_index',
  'right_middle',
  'right_ring',
  'right_pinky',
] as const;
export type FingerId = (typeof FINGER_IDS)[number];

export const photos = sqliteTable(
  'photos',
  {
    id: text('id').primaryKey(),
    capturedAt: integer('captured_at', { mode: 'timestamp_ms' }).notNull(),
    /** Absolute `file://` URI in the document directory. Never the cache directory. */
    fileUri: text('file_uri').notNull(),
    thumbUri: text('thumb_uri').notNull(),
    hand: text('hand', { enum: HANDS }).notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    /**
     * The EXIF orientation value (1-8) the original camera frame carried before the
     * pipeline baked it into the pixels. After processing the stored file is always
     * upright, so a non-null value here is also proof the normalisation pass ran.
     */
    normalisedOrientation: integer('normalised_orientation').notNull(),
    /**
     * The photo this one was aligned against (the user's first photo, or a pinned one).
     * If that reference photo is deleted, this is set to null rather than cascading —
     * we never delete a user's photo as a side effect of deleting another.
     */
    referencePhotoId: text('reference_photo_id').references(
      (): AnySQLiteColumn => photos.id,
      { onDelete: 'set null' },
    ),
    /**
     * True for the one photo pinned as the ghost-overlay reference for its hand.
     * Set only by an explicit user action (`pinReference`/`unpinReference`) — never
     * automatically on first capture. Unrelated to `referencePhotoId` above, which
     * records what a given photo was aligned against at capture time; this instead
     * marks which single photo IS the current reference for its hand.
     */
    isReference: integer('is_reference', { mode: 'boolean' }).notNull().default(false),
  },
  (t) => [
    index('photos_captured_at_idx').on(t.capturedAt),
    index('photos_hand_idx').on(t.hand),
    index('photos_reference_photo_id_idx').on(t.referencePhotoId),
    // Guardrail, same pattern as streaks_single_active_unq: at most one reference
    // photo per hand. The query layer also enforces this (pinReference unpins the
    // old one in the same transaction), but the DB is the backstop.
    uniqueIndex('photos_reference_per_hand_unq')
      .on(t.hand)
      .where(sql`${t.isReference} = 1`),
  ],
);

export const nails = sqliteTable(
  'nails',
  {
    id: text('id').primaryKey(),
    photoId: text('photo_id')
      .notNull()
      .references(() => photos.id, { onDelete: 'cascade' }),
    fingerId: text('finger_id', { enum: FINGER_IDS }).notNull(),
    /** Per-nail crop, also in the document directory. */
    cropUri: text('crop_uri').notNull(),
  },
  (t) => [
    index('nails_photo_id_idx').on(t.photoId),
    index('nails_finger_id_idx').on(t.fingerId),
    // One crop per finger per photo.
    uniqueIndex('nails_photo_finger_unq').on(t.photoId, t.fingerId),
  ],
);

export const streaks = sqliteTable(
  'streaks',
  {
    id: text('id').primaryKey(),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
    /** Null means this is the current, active streak. */
    endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
  },
  (t) => [
    index('streaks_started_at_idx').on(t.startedAt),
    // Guardrail: at most one active streak. Every row with ended_at IS NULL indexes to
    // the same constant key, so a second active streak collides. The query layer also
    // enforces this, but the DB is the backstop.
    uniqueIndex('streaks_single_active_unq')
      .on(sql`(1)`)
      .where(sql`${t.endedAt} is null`),
  ],
);

export const relapses = sqliteTable(
  'relapses',
  {
    id: text('id').primaryKey(),
    occurredAt: integer('occurred_at', { mode: 'timestamp_ms' }).notNull(),
    note: text('note'),
    /**
     * The streak this relapse ended. Not in the original data-model sketch, added so the
     * timeline can tie each relapse to a streak boundary without fragile timestamp
     * matching. Set to null if that streak row is later removed; the relapse itself is
     * never deleted.
     */
    endedStreakId: text('ended_streak_id').references(() => streaks.id, {
      onDelete: 'set null',
    }),
  },
  (t) => [index('relapses_occurred_at_idx').on(t.occurredAt)],
);

export const triggers = sqliteTable(
  'triggers',
  {
    id: text('id').primaryKey(),
    occurredAt: integer('occurred_at', { mode: 'timestamp_ms' }).notNull(),
    activity: text('activity'),
    mood: text('mood'),
  },
  (t) => [index('triggers_occurred_at_idx').on(t.occurredAt)],
);

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  /** Store non-string values as JSON and parse at the call site. */
  value: text('value').notNull(),
});

export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
export type Nail = typeof nails.$inferSelect;
export type NewNail = typeof nails.$inferInsert;
export type Streak = typeof streaks.$inferSelect;
export type Relapse = typeof relapses.$inferSelect;
export type Trigger = typeof triggers.$inferSelect;
export type Setting = typeof settings.$inferSelect;
