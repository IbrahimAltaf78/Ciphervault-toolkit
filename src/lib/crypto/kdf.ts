/**
 * Password-based key derivation (PBKDF2-HMAC-SHA-256).
 *
 * A password is not a key: it is short, low-entropy and drawn from a predictable
 * alphabet. PBKDF2 stretches it into full-length key material and makes each
 * guess expensive, so an attacker who captures a ciphertext cannot simply run a
 * wordlist through it at memory speed.
 *
 * The salt is random per message and travels in the envelope. That is what stops
 * one precomputed table from unlocking every payload that shares a password.
 */
import { textToBytes } from "./bytes";

/**
 * Iteration count. OWASP currently puts the floor for PBKDF2-HMAC-SHA-256 at
 * 600,000; that costs roughly a second in a browser, which is too slow for a
 * tool people are meant to experiment with. 210,000 is the previous published
 * guidance and lands near 150 ms, so it is the compromise taken here — worth
 * raising if this were protecting real secrets rather than demonstrating them.
 */
export const PBKDF2_ITERATIONS = 210_000;

export const SALT_BYTES = 16;

/** Imports the password itself as PBKDF2 input material. */
async function importPassword(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", textToBytes(password), "PBKDF2", false, [
    "deriveBits",
    "deriveKey",
  ]);
}

/** Derives an AES key of the requested size, usable for encrypt and decrypt. */
export async function deriveAesKey(
  password: string,
  salt: Uint8Array,
  length: 128 | 192 | 256,
  algorithm: "AES-GCM" | "AES-CBC" | "AES-CTR",
): Promise<CryptoKey> {
  const material = await importPassword(password);
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    material,
    { name: algorithm, length },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Derives raw key bytes, for ciphers WebCrypto cannot import — DES and 3DES are
 * not part of the WebCrypto algorithm set, so their keys are produced here and
 * fed to the local implementation.
 */
export async function deriveKeyBytes(
  password: string,
  salt: Uint8Array,
  byteLength: number,
): Promise<Uint8Array> {
  const material = await importPassword(password);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    material,
    byteLength * 8,
  );
  return new Uint8Array(bits);
}
