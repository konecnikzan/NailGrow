import { verifyImageFile } from '@/photos/verification';

import { FakeFs, FakeImage } from './support/fakes';

const URI = 'file:///doc/photos/x.jpg';

function setup() {
  const fs = new FakeFs();
  const image = new FakeImage(fs);
  return { fs, image, deps: { fs, image } };
}

describe('verifyImageFile', () => {
  it('passes for a real, non-empty, decodable file and returns its dimensions', async () => {
    const { fs, deps } = setup();
    fs.put(URI, 1234);

    const result = await verifyImageFile(deps, URI);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ width: 2048, height: 1536 });
  });

  it('flags a file that is not on disk', async () => {
    const { deps } = setup();

    const result = await verifyImageFile(deps, URI);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VERIFY_FILE_MISSING');
  });

  it('flags a zero-byte file', async () => {
    const { fs, deps } = setup();
    fs.put(URI, 0);

    const result = await verifyImageFile(deps, URI);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VERIFY_FILE_EMPTY');
  });

  it('flags a file that exists but will not decode, keeping the cause', async () => {
    const { fs, image, deps } = setup();
    fs.put(URI, 500);
    image.probeOverrides.set(URI, 'throw');

    const result = await verifyImageFile(deps, URI);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VERIFY_UNREADABLE');
      expect(result.error.cause).toBeInstanceOf(Error);
    }
  });

  it('flags a file that decodes to zero dimensions', async () => {
    const { fs, image, deps } = setup();
    fs.put(URI, 500);
    image.probeOverrides.set(URI, { width: 0, height: 0 });

    const result = await verifyImageFile(deps, URI);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VERIFY_ZERO_DIMENSIONS');
  });
});
