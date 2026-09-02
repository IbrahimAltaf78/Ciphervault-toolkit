/**
 * Digests across the SHA-2 and SHA-3 families.
 *
 * SHA-2 comes from WebCrypto. SHA-3 does not exist in WebCrypto — no browser
 * implements it — so it comes from @noble/hashes, which is audited and
 * dependency-free. That is the one place in this module where a library is used
 * instead of the platform, and only because the platform has nothing to offer.
 *
 * The two families are not related by descent. SHA-2 is Merkle-Damgard, like
 * MD5 and SHA-1 before it, and inherits their length-extension weakness. SHA-3
 * is a sponge over the Keccak permutation, chosen in an open competition
 * specifically so that a break in SHA-2 would not take the replacement with it.
 */
import { sha3_256, sha3_384, sha3_512 } from "@noble/hashes/sha3.js";
import type { CryptoResult, HashAlgorithm } from "./types";
import { bytesToHex, textToBytes, toBytes } from "./bytes";

const SHA3 = {
  "SHA3-256": sha3_256,
  "SHA3-384": sha3_384,
  "SHA3-512": sha3_512,
} as const;

export const SHA2_ALGORITHMS = ["SHA-256", "SHA-384", "SHA-512"] as const;
export const SHA3_ALGORITHMS = ["SHA3-256", "SHA3-384", "SHA3-512"] as const;

/** Digest length in bits, for display. */
export function digestBits(algorithm: HashAlgorithm): number {
  return Number.parseInt(algorithm.split("-").pop() ?? "256", 10);
}

/** Hashes text and returns the digest as lowercase hex. */
export async function hashText(
  text: string,
  algorithm: HashAlgorithm,
): Promise<CryptoResult> {
  try {
    if (algorithm in SHA3) {
      const digest = SHA3[algorithm as keyof typeof SHA3](textToBytes(text));
      return { ok: true, value: bytesToHex(digest) };
    }

    const digest = await crypto.subtle.digest(algorithm, textToBytes(text) as BufferSource);
    return { ok: true, value: bytesToHex(toBytes(digest)) };
  } catch (error) {
    return { ok: false, error: `Hashing failed: ${(error as Error).message}` };
  }
}

/**
 * Compares a digest against one the user pastes in.
 *
 * Case and surrounding whitespace are ignored, since hex digests get copied out
 * of terminals and checksum files in either case.
 */
export function compareDigest(computed: string, expected: string): boolean {
  return computed.toLowerCase() === expected.trim().toLowerCase();
}
