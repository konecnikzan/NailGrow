import * as Crypto from 'expo-crypto';

/**
 * Single source of primary keys. Wrapped in its own module so tests can mock it
 * (`jest.mock('@/db/ids')`) to get deterministic ids.
 *
 * `Crypto.randomUUID()` is synchronous and backed by the platform RNG.
 */
export function newId(): string {
  return Crypto.randomUUID();
}
