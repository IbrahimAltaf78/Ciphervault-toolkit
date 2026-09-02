/**
 * DES block cipher (FIPS 46-3), implemented from the specification.
 *
 * WebCrypto deliberately omits DES — it is broken, and a modern platform API has
 * no business offering it. It is here because the toolkit teaches the history of
 * the field, and a 56-bit key is the clearest possible illustration of why key
 * length matters. Nothing in this file should ever protect real data.
 *
 * Written against the published tables rather than pulled from a package: the
 * algorithm is fixed, small, and verifiable against the FIPS vectors, which the
 * test suite checks. The implementation works on bit arrays rather than packed
 * integers — slower, but it reads like the specification it came from, which
 * matters more for a tool whose job is to show the mechanism.
 */

/** Permuted Choice 1 — 64-bit key down to 56, dropping the parity bits. */
const PC1 = [
  57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18,
  10, 2, 59, 51, 43, 35, 27, 19, 11, 3, 60, 52, 44, 36,
  63, 55, 47, 39, 31, 23, 15, 7, 62, 54, 46, 38, 30, 22,
  14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 28, 20, 12, 4,
];

/** Permuted Choice 2 — 56-bit state down to each 48-bit round subkey. */
const PC2 = [
  14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10,
  23, 19, 12, 4, 26, 8, 16, 7, 27, 20, 13, 2,
  41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48,
  44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32,
];

/** Left-rotation applied to each key half, per round. */
const SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];

/** Initial permutation. */
const IP = [
  58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4,
  62, 54, 46, 38, 30, 22, 14, 6, 64, 56, 48, 40, 32, 24, 16, 8,
  57, 49, 41, 33, 25, 17, 9, 1, 59, 51, 43, 35, 27, 19, 11, 3,
  61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39, 31, 23, 15, 7,
];

/** Final permutation — the inverse of IP. */
const FP = [
  40, 8, 48, 16, 56, 24, 64, 32, 39, 7, 47, 15, 55, 23, 63, 31,
  38, 6, 46, 14, 54, 22, 62, 30, 37, 5, 45, 13, 53, 21, 61, 29,
  36, 4, 44, 12, 52, 20, 60, 28, 35, 3, 43, 11, 51, 19, 59, 27,
  34, 2, 42, 10, 50, 18, 58, 26, 33, 1, 41, 9, 49, 17, 57, 25,
];

/** Expansion — 32-bit half widened to 48 so it can meet the subkey. */
const E = [
  32, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9,
  8, 9, 10, 11, 12, 13, 12, 13, 14, 15, 16, 17,
  16, 17, 18, 19, 20, 21, 20, 21, 22, 23, 24, 25,
  24, 25, 26, 27, 28, 29, 28, 29, 30, 31, 32, 1,
];

/** Permutation applied to the S-box output. */
const P = [
  16, 7, 20, 21, 29, 12, 28, 17, 1, 15, 23, 26, 5, 18, 31, 10,
  2, 8, 24, 14, 32, 27, 3, 9, 19, 13, 30, 6, 22, 11, 4, 25,
];

/**
 * The eight substitution boxes — the only non-linear part of DES, and the
 * reason it resists linear cryptanalysis as well as it does.
 */
const S_BOXES = [
  [
    [14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7],
    [0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8],
    [4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0],
    [15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13],
  ],
  [
    [15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10],
    [3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5],
    [0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15],
    [13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9],
  ],
  [
    [10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8],
    [13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1],
    [13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7],
    [1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12],
  ],
  [
    [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
    [13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9],
    [10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4],
    [3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14],
  ],
  [
    [2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9],
    [14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
    [4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14],
    [11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3],
  ],
  [
    [12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11],
    [10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8],
    [9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6],
    [4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13],
  ],
  [
    [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
    [13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
    [1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2],
    [6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12],
  ],
  [
    [13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7],
    [1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2],
    [7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8],
    [2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11],
  ],
];

export const BLOCK_BYTES = 8;

type Bits = Uint8Array<ArrayBuffer>;

function bytesToBits(bytes: Uint8Array): Bits {
  const bits = new Uint8Array(bytes.length * 8);
  for (let i = 0; i < bytes.length; i += 1) {
    for (let j = 0; j < 8; j += 1) {
      bits[i * 8 + j] = (bytes[i] >> (7 - j)) & 1;
    }
  }
  return bits;
}

function bitsToBytes(bits: Bits): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(bits.length / 8);
  for (let i = 0; i < bytes.length; i += 1) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits[i * 8 + j];
    bytes[i] = byte;
  }
  return bytes;
}

/** Applies a permutation table. Tables are 1-indexed, as printed in the spec. */
function permute(bits: Bits, table: readonly number[]): Bits {
  const out = new Uint8Array(table.length);
  for (let i = 0; i < table.length; i += 1) out[i] = bits[table[i] - 1];
  return out;
}

function rotateLeft(bits: Bits, count: number): Bits {
  const out = new Uint8Array(bits.length);
  for (let i = 0; i < bits.length; i += 1) out[i] = bits[(i + count) % bits.length];
  return out;
}

function xor(a: Bits, b: Bits): Bits {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i += 1) out[i] = a[i] ^ b[i];
  return out;
}

/** Expands an 8-byte key into the sixteen 48-bit round subkeys. */
export function keySchedule(key: Uint8Array): Bits[] {
  const permuted = permute(bytesToBits(key), PC1);
  let left = permuted.slice(0, 28);
  let right = permuted.slice(28, 56);

  const subkeys: Bits[] = [];
  for (const shift of SHIFTS) {
    left = rotateLeft(left, shift);
    right = rotateLeft(right, shift);
    const combined = new Uint8Array(56);
    combined.set(left, 0);
    combined.set(right, 28);
    subkeys.push(permute(combined, PC2));
  }
  return subkeys;
}

/** The round function: expand, mix with the subkey, substitute, permute. */
function feistel(right: Bits, subkey: Bits): Bits {
  const mixed = xor(permute(right, E), subkey);
  const substituted = new Uint8Array(32);

  for (let box = 0; box < 8; box += 1) {
    const chunk = mixed.subarray(box * 6, box * 6 + 6);
    // Outer bits pick the row, the middle four pick the column.
    const row = (chunk[0] << 1) | chunk[5];
    const column = (chunk[1] << 3) | (chunk[2] << 2) | (chunk[3] << 1) | chunk[4];
    const value = S_BOXES[box][row][column];
    for (let bit = 0; bit < 4; bit += 1) {
      substituted[box * 4 + bit] = (value >> (3 - bit)) & 1;
    }
  }

  return permute(substituted, P);
}

/**
 * Runs one 8-byte block through all sixteen rounds. Decryption is the same
 * network with the subkeys reversed — the property that makes a Feistel
 * construction attractive in hardware.
 */
export function processBlock(
  block: Uint8Array,
  subkeys: Bits[],
  decrypt: boolean,
): Uint8Array<ArrayBuffer> {
  const permuted = permute(bytesToBits(block), IP);
  let left = permuted.slice(0, 32);
  let right = permuted.slice(32, 64);

  for (let round = 0; round < 16; round += 1) {
    const subkey = subkeys[decrypt ? 15 - round : round];
    const previousRight = right;
    right = xor(left, feistel(right, subkey));
    left = previousRight;
  }

  // The halves are swapped once more before the final permutation.
  const preOutput = new Uint8Array(64);
  preOutput.set(right, 0);
  preOutput.set(left, 32);
  return bitsToBytes(permute(preOutput, FP));
}

/** Convenience wrapper for a single block with a single key. */
export function encryptBlock(block: Uint8Array, key: Uint8Array): Uint8Array<ArrayBuffer> {
  return processBlock(block, keySchedule(key), false);
}

export function decryptBlock(block: Uint8Array, key: Uint8Array): Uint8Array<ArrayBuffer> {
  return processBlock(block, keySchedule(key), true);
}
