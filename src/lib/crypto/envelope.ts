/**
 * Ciphertext envelope.
 *
 * A raw ciphertext on its own is undecryptable: the recipient also needs the
 * salt the key was derived from, the IV, and which algorithm produced it. Rather
 * than making the user carry four fields around, every symmetric and hybrid tool
 * emits one self-describing string:
 *
 *   CV1.aes-256-gcm.<base64 salt>.<base64 iv>.<base64 ciphertext>
 *
 * Base64 never contains a dot, so the separator is unambiguous. Naming the
 * algorithm in the payload also means decryption can reject a mismatch outright
 * instead of failing with an opaque error deep inside WebCrypto.
 */
import type { CryptoResult } from "./types";
import { base64ToBytes, bytesToBase64 } from "./bytes";

const VERSION = "CV1";

/** Packs an algorithm label and its byte fields into one transportable string. */
export function seal(algorithm: string, fields: Uint8Array[]): string {
  return [VERSION, algorithm, ...fields.map(bytesToBase64)].join(".");
}

/**
 * Unpacks an envelope, checking the version, the algorithm and the field count
 * before handing anything to a cipher.
 */
export function open(
  envelope: string,
  algorithm: string,
  fieldCount: number,
): CryptoResult<Uint8Array[]> {
  const parts = envelope.trim().split(".");

  if (parts.length !== fieldCount + 2 || parts[0] !== VERSION) {
    return {
      ok: false,
      error: "This does not look like a CipherVault payload — expected a CV1 envelope.",
    };
  }

  if (parts[1] !== algorithm) {
    return {
      ok: false,
      error: `Wrong tool for this payload — it was produced by ${parts[1]}, not ${algorithm}.`,
    };
  }

  try {
    return { ok: true, value: parts.slice(2).map(base64ToBytes) };
  } catch {
    return { ok: false, error: "The payload is corrupted — its fields are not valid Base64." };
  }
}

/** Algorithm label carried by an envelope, for display. Null when unreadable. */
export function readAlgorithm(envelope: string): string | null {
  const parts = envelope.trim().split(".");
  return parts.length >= 2 && parts[0] === VERSION ? parts[1] : null;
}
