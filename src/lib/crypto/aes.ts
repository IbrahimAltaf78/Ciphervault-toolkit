/**
 * AES via the native WebCrypto API, in GCM, CBC and CTR.
 *
 * The three modes are not interchangeable and the tool says so:
 *
 *  - GCM is authenticated. A tampered ciphertext fails to decrypt rather than
 *    returning plausible-looking garbage, which is why it is the default.
 *  - CBC is confidentiality only. It will happily decrypt modified input, so it
 *    needs a separate MAC in any real design.
 *  - CTR turns the block cipher into a stream cipher. Reusing a counter with the
 *    same key is catastrophic, which is why the counter here is always random.
 *
 * Keys are never held longer than one operation and are marked non-extractable,
 * so the raw key cannot be read back out of the browser.
 */
import type { AesKeyLength, AesMode, CryptoResult } from "./types";
import { bytesToText, randomBytes, textToBytes, toBytes } from "./bytes";
import { deriveAesKey, SALT_BYTES } from "./kdf";
import { open, seal } from "./envelope";

/** GCM is specified around a 96-bit nonce; CBC and CTR take a full block. */
function ivLength(mode: AesMode): number {
  return mode === "GCM" ? 12 : 16;
}

function subtleName(mode: AesMode): "AES-GCM" | "AES-CBC" | "AES-CTR" {
  return `AES-${mode}` as const;
}

function params(mode: AesMode, iv: Uint8Array): AesGcmParams | AesCbcParams | AesCtrParams {
  if (mode === "GCM") {
    return { name: "AES-GCM", iv: iv as BufferSource, tagLength: 128 };
  }
  if (mode === "CBC") {
    return { name: "AES-CBC", iv: iv as BufferSource };
  }
  // Half the block is the nonce, half the counter — 2^64 blocks before reuse.
  return { name: "AES-CTR", counter: iv as BufferSource, length: 64 };
}

/** Envelope label, e.g. "aes-256-gcm". */
function label(length: AesKeyLength, mode: AesMode): string {
  return `aes-${length}-${mode.toLowerCase()}`;
}

export interface AesOptions {
  mode: AesMode;
  length: AesKeyLength;
}

export async function encryptAes(
  plaintext: string,
  password: string,
  options: AesOptions,
): Promise<CryptoResult> {
  if (!password) return { ok: false, error: "Enter a password to derive the key from." };

  try {
    const salt = randomBytes(SALT_BYTES);
    const iv = randomBytes(ivLength(options.mode));
    const key = await deriveAesKey(password, salt, options.length, subtleName(options.mode));

    const ciphertext = await crypto.subtle.encrypt(
      params(options.mode, iv),
      key,
      textToBytes(plaintext) as BufferSource,
    );

    return {
      ok: true,
      value: seal(label(options.length, options.mode), [salt, iv, toBytes(ciphertext)]),
    };
  } catch (error) {
    return { ok: false, error: `Encryption failed: ${(error as Error).message}` };
  }
}

export async function decryptAes(
  envelope: string,
  password: string,
  options: AesOptions,
): Promise<CryptoResult> {
  if (!password) return { ok: false, error: "Enter the password the payload was encrypted with." };

  const opened = open(envelope, label(options.length, options.mode), 3);
  if (!opened.ok) return opened;

  const [salt, iv, ciphertext] = opened.value;

  try {
    const key = await deriveAesKey(password, salt, options.length, subtleName(options.mode));
    const plaintext = await crypto.subtle.decrypt(
      params(options.mode, iv),
      key,
      ciphertext as BufferSource,
    );
    return { ok: true, value: bytesToText(toBytes(plaintext)) };
  } catch {
    // GCM reports authentication failure the same way it reports a wrong key,
    // and it must stay that way — distinguishing them leaks information.
    return {
      ok: false,
      error:
        options.mode === "GCM"
          ? "Decryption failed — wrong password, or the payload was tampered with."
          : "Decryption failed — wrong password, or the payload is corrupted.",
    };
  }
}
