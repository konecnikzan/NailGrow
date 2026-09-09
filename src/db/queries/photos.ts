import { and, asc, eq, gte, lte } from 'drizzle-orm';

import { newId } from '../ids';
import {
  type FingerId,
  type Nail,
  type NewNail,
  type NewPhoto,
  type Photo,
  nails,
  photos,
} from '../schema';
import type { Database } from '../types';

/**
 * Insert a verified photo row. Call this ONLY after the photo pipeline has
 * confirmed the file is on disk, readable, and has non-zero dimensions — a row
 * that points at a missing file is the exact bug this app exists to avoid.
 */
export function createPhoto(db: Database, photo: NewPhoto): Photo {
  return db.insert(photos).values(photo).returning().get();
}

/**
 * Insert a photo and its per-nail crop rows in one transaction, so a photo never
 * ends up half-recorded. `crops` may omit `id`; one is generated per row.
 */
export function createPhotoWithNails(
  db: Database,
  photo: NewPhoto,
  crops: Omit<NewNail, 'id' | 'photoId'>[],
): { photo: Photo; nails: Nail[] } {
  return db.transaction((tx) => {
    const insertedPhoto = tx.insert(photos).values(photo).returning().get();
    const insertedNails = crops.length
      ? tx
          .insert(nails)
          .values(
            crops.map((crop) => ({
              ...crop,
              id: newId(),
              photoId: insertedPhoto.id,
            })),
          )
          .returning()
          .all()
      : [];
    return { photo: insertedPhoto, nails: insertedNails };
  });
}

export function getPhoto(db: Database, id: string): Photo | undefined {
  return db.select().from(photos).where(eq(photos.id, id)).get();
}

export function getPhotoWithNails(
  db: Database,
  id: string,
): { photo: Photo; nails: Nail[] } | undefined {
  const photo = getPhoto(db, id);
  if (!photo) return undefined;
  const crops = db.select().from(nails).where(eq(nails.photoId, id)).all();
  return { photo, nails: crops };
}

/** Every photo row, oldest first. Used by the startup integrity pass. */
export function listAllPhotos(db: Database): Photo[] {
  return db.select().from(photos).orderBy(asc(photos.capturedAt)).all();
}

/**
 * Photos captured within `[from, to]` inclusive, oldest first. Bounds are
 * `Date`s; the caller decides day boundaries.
 */
export function listPhotosByDateRange(
  db: Database,
  from: Date,
  to: Date,
): Photo[] {
  return db
    .select()
    .from(photos)
    .where(and(gte(photos.capturedAt, from), lte(photos.capturedAt, to)))
    .orderBy(asc(photos.capturedAt))
    .all();
}

export interface PhotoWithCrop {
  photo: Photo;
  nailId: string;
  cropUri: string;
}

/**
 * The per-finger timeline: every photo that has a crop for `fingerId`, paired
 * with that crop, oldest first.
 */
export function listPhotosForFinger(
  db: Database,
  fingerId: FingerId,
): PhotoWithCrop[] {
  return db
    .select({ photo: photos, nailId: nails.id, cropUri: nails.cropUri })
    .from(nails)
    .innerJoin(photos, eq(nails.photoId, photos.id))
    .where(eq(nails.fingerId, fingerId))
    .orderBy(asc(photos.capturedAt))
    .all();
}

/**
 * Delete a photo row (and its nail rows, via `ON DELETE cascade`). This removes
 * only the database rows — the pipeline's delete is responsible for removing the
 * files first, since it needs the crop URIs before the cascade drops them.
 *
 * Foreign-key cascade only fires when `PRAGMA foreign_keys = ON` (set in
 * client.ts). Tests that use a bare connection must set it too.
 */
export function deletePhotoRow(db: Database, id: string): void {
  db.delete(photos).where(eq(photos.id, id)).run();
}
