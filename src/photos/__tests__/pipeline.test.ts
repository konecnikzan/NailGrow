import { listAllPhotos } from '@/db/queries';
import { capturePhoto, deletePhoto, type CaptureInput } from '@/photos/pipeline';
import type { PipelineDeps } from '@/photos/ports';

import { FakeFs, FakeImage } from './support/fakes';
import { createTestDb } from './support/test-db';

const SOURCE = 'file:///cache/DCIM_0001.jpg';
const DOC = 'file:///doc';

function makeDeps() {
  const { db, close } = createTestDb();
  const fs = new FakeFs();
  const image = new FakeImage(fs);
  let n = 0;
  const deps: PipelineDeps = {
    fs,
    image,
    db,
    newId: () => `id-${++n}`,
    now: () => new Date('2026-09-09T12:00:00.000Z'),
  };
  return { deps, fs, image, close };
}

function capture(deps: PipelineDeps, over: Partial<CaptureInput> = {}) {
  return capturePhoto(deps, { sourceUri: SOURCE, hand: 'left', ...over });
}

describe('capturePhoto — happy path', () => {
  it('writes both files under the stable name, verifies, then inserts exactly one row', async () => {
    const { deps, fs, close } = makeDeps();
    try {
      fs.put(SOURCE, 3_000_000);

      const result = await capture(deps, { hand: 'right', sourceOrientation: 6 });

      expect(result.ok).toBe(true);

      const rows = listAllPhotos(deps.db);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        id: 'id-1',
        hand: 'right',
        normalisedOrientation: 6,
        fileUri: 'file:///doc/photos/id-1.jpg',
        thumbUri: 'file:///doc/photos/thumbs/id-1.jpg',
        width: 2048,
        height: 1536,
      });
      expect(rows[0]?.capturedAt).toEqual(new Date('2026-09-09T12:00:00.000Z'));

      expect(fs.has('file:///doc/photos/id-1.jpg')).toBe(true);
      expect(fs.has('file:///doc/photos/thumbs/id-1.jpg')).toBe(true);
      // no processing temp files left behind
      expect(fs.listUnder('file:///cache/normalised')).toEqual([]);
      expect(fs.listUnder('file:///cache/thumb')).toEqual([]);
      // the camera's own source file is left alone
      expect(fs.has(SOURCE)).toBe(true);
    } finally {
      close();
    }
  });
});

describe('capturePhoto — a failure never leaves an orphan row', () => {
  it('file move fails after the photo moved: no row, and the moved file is rolled back', async () => {
    const { deps, fs, close } = makeDeps();
    try {
      fs.put(SOURCE, 3_000_000);
      fs.failMoveTo = (dest) => dest.includes('/thumbs/'); // 2nd move throws

      const result = await capture(deps);

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('WRITE_FAILED');

      expect(listAllPhotos(deps.db)).toEqual([]); // <-- the guarantee
      expect(fs.listUnder(DOC)).toEqual([]); // photo file that moved was rolled back
      expect(fs.listUnder('file:///cache/normalised')).toEqual([]);
    } finally {
      close();
    }
  });

  it('verification fails on the written photo: no row, all written files removed', async () => {
    const { deps, fs, image, close } = makeDeps();
    try {
      fs.put(SOURCE, 3_000_000);
      image.probeOverrides.set('file:///doc/photos/id-1.jpg', { width: 0, height: 0 });

      const result = await capture(deps);

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('VERIFY_ZERO_DIMENSIONS');

      expect(listAllPhotos(deps.db)).toEqual([]);
      expect(fs.listUnder(DOC)).toEqual([]);
    } finally {
      close();
    }
  });

  it('verification fails because the written file is unreadable: no row', async () => {
    const { deps, fs, image, close } = makeDeps();
    try {
      fs.put(SOURCE, 3_000_000);
      image.probeOverrides.set('file:///doc/photos/thumbs/id-1.jpg', 'throw');

      const result = await capture(deps);

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('VERIFY_UNREADABLE');
      expect(listAllPhotos(deps.db)).toEqual([]);
      expect(fs.listUnder(DOC)).toEqual([]);
    } finally {
      close();
    }
  });

  it('the DB insert itself fails: files are rolled back, nothing persists', async () => {
    const { deps, fs, close } = makeDeps();
    try {
      fs.put(SOURCE, 3_000_000);
      // A non-existent reference photo violates the FK, so createPhoto throws.
      const result = await capture(deps, { referencePhotoId: 'no-such-photo' });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('DB_INSERT_FAILED');

      expect(listAllPhotos(deps.db)).toEqual([]);
      expect(fs.listUnder(DOC)).toEqual([]);
    } finally {
      close();
    }
  });

  it('normalisation fails: no files written, no row', async () => {
    const { deps, fs, image, close } = makeDeps();
    try {
      fs.put(SOURCE, 3_000_000);
      jest.spyOn(image, 'normalise').mockRejectedValueOnce(new Error('decoder blew up'));

      const result = await capture(deps);

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('NORMALISE_FAILED');
      expect(listAllPhotos(deps.db)).toEqual([]);
      expect(fs.listUnder(DOC)).toEqual([]);
      // no processing temp files, and the camera source is untouched
      expect(fs.listUnder('file:///cache/normalised')).toEqual([]);
      expect(fs.listUnder('file:///cache/thumb')).toEqual([]);
      expect(fs.has(SOURCE)).toBe(true);
    } finally {
      close();
    }
  });

  it('the camera source has vanished by the time we run: no row', async () => {
    const { deps, close } = makeDeps();
    try {
      const result = await capture(deps); // SOURCE was never put()

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('SOURCE_MISSING');
      expect(listAllPhotos(deps.db)).toEqual([]);
    } finally {
      close();
    }
  });
});

describe('deletePhoto', () => {
  it('removes the row and every file', async () => {
    const { deps, fs, close } = makeDeps();
    try {
      fs.put(SOURCE, 3_000_000);
      await capture(deps);

      const result = await deletePhoto(deps, 'id-1');

      expect(result.ok).toBe(true);
      expect(listAllPhotos(deps.db)).toEqual([]);
      expect(fs.listUnder(DOC)).toEqual([]);
    } finally {
      close();
    }
  });

  it('still deletes the row when a file cannot be removed, and reports the stranded file', async () => {
    const { deps, fs, close } = makeDeps();
    try {
      fs.put(SOURCE, 3_000_000);
      await capture(deps);
      fs.failRemoveOf = (uri) => uri.endsWith('/thumbs/id-1.jpg');

      const result = await deletePhoto(deps, 'id-1');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('DELETE_FILES_INCOMPLETE');
        expect(result.error.context?.strandedFiles).toEqual([
          'file:///doc/photos/thumbs/id-1.jpg',
        ]);
      }
      // the important half still happened
      expect(listAllPhotos(deps.db)).toEqual([]);
    } finally {
      close();
    }
  });

  it('returns NOT_FOUND for an unknown id and touches nothing', async () => {
    const { deps, close } = makeDeps();
    try {
      const result = await deletePhoto(deps, 'ghost');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
    } finally {
      close();
    }
  });
});
