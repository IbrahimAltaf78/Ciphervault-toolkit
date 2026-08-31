/**
 * Shared types for the cryptography module.
 */

/**
 * Every operation returns rather than throws, so a wrong key or a corrupted
 * payload surfaces as a message in the panel instead of a crashed page.
 */
export type CryptoResult<T = string> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/** Block cipher modes offered for AES. */
export type AesMode = "GCM" | "CBC" | "CTR";

/** AES key sizes, in bits. */
export type AesKeyLength = 128 | 192 | 256;

/** Digest algorithms across both the SHA-2 and SHA-3 families. */
export type HashAlgorithm =
  | "SHA-256"
  | "SHA-384"
  | "SHA-512"
  | "SHA3-256"
  | "SHA3-384"
  | "SHA3-512";

/** RSA modulus sizes, in bits. */
export type RsaModulusLength = 2048 | 3072 | 4096;

/** NIST curves exposed by WebCrypto. */
export type EccCurve = "P-256" | "P-384" | "P-521";

/** A generated key pair, serialised as PEM for display and re-entry. */
export interface PemKeyPair {
  publicKey: string;
  privateKey: string;
}

/** Advisory verdict from the password meter. */
export interface PasswordVerdict {
  /** 0 (very weak) through 4 (strong). */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  /** Rough search-space estimate, in bits. */
  entropyBits: number;
  /** Concrete things that would improve the passphrase. */
  suggestions: string[];
}
