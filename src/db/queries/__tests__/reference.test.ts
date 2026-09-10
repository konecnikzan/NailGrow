import { eq } from 'drizzle-orm';

import { createPhoto, getReferencePhoto, pinReference, unpinReference } from '@/db/queries';
import { photos, type NewPhoto } from '@/db/schema';
// Reused from the photo-pipeline tests — a real in-memory SQLite DB with
// migrations applied, not a mock.
import { createTestDb } from '@/photos/__tests__/support/test-db';

function photo(id: string, hand: 'left' | 'right'): NewPhoto {
  return {
    id,
    capturedAt: new Date('2026-09-10T00:00:00.000Z'),
    fileUri: `file:///doc/photos/${id}.jpg`,
    thumbUri: `file:///doc/photos/thumbs/${id}.jpg`,
    hand,
    width: 100,
    height: 100,
    normalisedOrientation: 1,
    referencePhotoId: null,
  };
}

describe('reference photo pinning', () => {
  it('a fresh photo defaults to not being a reference', () => {
    const { db, close } = createTestDb();
    try {
      const row = createPhoto(db, photo('a', 'left'));
      expect(row.isReference).toBe(false);
      expect(getReferencePhoto(db, 'left')).toBeUndefined();
    } finally {
      close();
    }
  });

  it('pinning sets isReference and getReferencePhoto finds it', () => {
    const { db, close } = createTestDb();
    try {
      createPhoto(db, photo('a', 'left'));
      const pinned = pinReference(db, 'a');
      expect(pinned.isReference).toBe(true);
      expect(getReferencePhoto(db, 'left')?.id).toBe('a');
    } finally {
      close();
    }
  });

  it('pinning a new photo unpins the previous one for the same hand', () => {
    const { db, close } = createTestDb();
    try {
      createPhoto(db, photo('a', 'left'));
      createPhoto(db, photo('b', 'left'));

      pinReference(db, 'a');
      expect(getReferencePhoto(db, 'left')?.id).toBe('a');

      pinReference(db, 'b');
      expect(getReferencePhoto(db, 'left')?.id).toBe('b'); // <-- only one at a time
    } finally {
      close();
    }
  });

  it('the two hands have independent reference photos', () => {
    const { db, close } = createTestDb();
    try {
      createPhoto(db, photo('l', 'left'));
      createPhoto(db, photo('r', 'right'));

      pinReference(db, 'l');
      pinReference(db, 'r');

      expect(getReferencePhoto(db, 'left')?.id).toBe('l');
      expect(getReferencePhoto(db, 'right')?.id).toBe('r');
    } finally {
      close();
    }
  });

  it('unpinReference clears it, and capture still works with no reference pinned', () => {
    const { db, close } = createTestDb();
    try {
      createPhoto(db, photo('a', 'left'));
      pinReference(db, 'a');

      unpinReference(db, 'left');

      expect(getReferencePhoto(db, 'left')).toBeUndefined();
      // unpinning again is a no-op, not an error
      expect(() => unpinReference(db, 'left')).not.toThrow();
    } finally {
      close();
    }
  });

  it('pinning an already-pinned photo is a no-op, not a self-unpin', () => {
    const { db, close } = createTestDb();
    try {
      createPhoto(db, photo('a', 'left'));
      pinReference(db, 'a');
      pinReference(db, 'a');
      expect(getReferencePhoto(db, 'left')?.id).toBe('a');
    } finally {
      close();
    }
  });

  it('pinning an unknown id throws and leaves the existing pin untouched', () => {
    const { db, close } = createTestDb();
    try {
      createPhoto(db, photo('a', 'left'));
      pinReference(db, 'a');

      expect(() => pinReference(db, 'ghost')).toThrow();
      expect(getReferencePhoto(db, 'left')?.id).toBe('a');
    } finally {
      close();
    }
  });

  it('the DB itself refuses two reference photos for the same hand', () => {
    const { db, close } = createTestDb();
    try {
      createPhoto(db, photo('a', 'left'));
      createPhoto(db, photo('b', 'left'));
      pinReference(db, 'a');

      // Bypass pinReference's unpin-first logic and try to force a second
      // reference directly — the partial unique index is the real backstop.
      expect(() =>
        db.update(photos).set({ isReference: true }).where(eq(photos.id, 'b')).run(),
      ).toThrow(/UNIQUE constraint failed/);

      expect(getReferencePhoto(db, 'left')?.id).toBe('a');
    } finally {
      close();
    }
  });
});
