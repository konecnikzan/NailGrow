import { createPhoto } from '@/db/queries';
import type { Database } from '@/db/types';
import { runIntegrityCheck } from '@/photos/integrity';

import { FakeFs, FakeImage } from './support/fakes';
import { createTestDb } from './support/test-db';

function seedRow(
  db: Database,
  fs: FakeFs,
  id: string,
  present: { photo: number | null; thumb: number | null },
) {
  const fileUri = `file:///doc/photos/${id}.jpg`;
  const thumbUri = `file:///doc/photos/thumbs/${id}.jpg`;
  createPhoto(db, {
    id,
    capturedAt: new Date('2026-09-01T00:00:00.000Z'),
    fileUri,
    thumbUri,
    hand: 'left',
    width: 2048,
    height: 1536,
    normalisedOrientation: 1,
    referencePhotoId: null,
  });
  if (present.photo !== null) fs.put(fileUri, present.photo);
  if (present.thumb !== null) fs.put(thumbUri, present.thumb);
}

describe('runIntegrityCheck', () => {
  it('reports healthy when every file is present and non-empty', async () => {
    const { db, close } = createTestDb();
    const fs = new FakeFs();
    const image = new FakeImage(fs);
    try {
      seedRow(db, fs, 'a', { photo: 1000, thumb: 100 });
      seedRow(db, fs, 'b', { photo: 2000, thumb: 200 });

      const result = await runIntegrityCheck({ db, fs, image });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({ checked: 2, issues: [], healthy: true });
      }
    } finally {
      close();
    }
  });

  it('flags missing and empty files — one issue each — and keeps scanning every row', async () => {
    const { db, close } = createTestDb();
    const fs = new FakeFs();
    const image = new FakeImage(fs);
    try {
      seedRow(db, fs, 'ok', { photo: 1000, thumb: 100 });
      seedRow(db, fs, 'gone', { photo: null, thumb: 100 }); // full-res file never on disk
      seedRow(db, fs, 'empty', { photo: 1000, thumb: 0 }); // thumb is a zero-byte stub

      const result = await runIntegrityCheck({ db, fs, image });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.checked).toBe(3);
        expect(result.value.healthy).toBe(false);
        expect(result.value.issues).toHaveLength(2);
        expect(result.value.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ photoId: 'gone', kind: 'PHOTO_FILE_MISSING' }),
            expect.objectContaining({ photoId: 'empty', kind: 'THUMB_FILE_EMPTY' }),
          ]),
        );
      }
    } finally {
      close();
    }
  });

  it('the cheap pass does not decode files', async () => {
    const { db, close } = createTestDb();
    const fs = new FakeFs();
    const image = new FakeImage(fs);
    const probe = jest.spyOn(image, 'probe');
    try {
      seedRow(db, fs, 'a', { photo: 1000, thumb: 100 });

      await runIntegrityCheck({ db, fs, image });

      expect(probe).not.toHaveBeenCalled();
    } finally {
      close();
    }
  });

  it('with { decode: true } it flags a present, non-empty file that will not decode', async () => {
    const { db, close } = createTestDb();
    const fs = new FakeFs();
    const image = new FakeImage(fs);
    try {
      seedRow(db, fs, 'corrupt', { photo: 1000, thumb: 100 });
      image.probeOverrides.set('file:///doc/photos/corrupt.jpg', 'throw');

      const result = await runIntegrityCheck({ db, fs, image }, { decode: true });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.issues).toEqual([
          expect.objectContaining({ photoId: 'corrupt', kind: 'PHOTO_FILE_UNREADABLE' }),
        ]);
      }
    } finally {
      close();
    }
  });

  it('reports healthy on an empty database', async () => {
    const { db, close } = createTestDb();
    const fs = new FakeFs();
    const image = new FakeImage(fs);
    try {
      const result = await runIntegrityCheck({ db, fs, image });
      expect(result.ok && result.value).toEqual({ checked: 0, issues: [], healthy: true });
    } finally {
      close();
    }
  });
});
