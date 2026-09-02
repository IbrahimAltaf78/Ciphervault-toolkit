/**
 * Hybrid encryption: RSA-OAEP wrapping an AES-256-GCM content key.
 *
 * This is how every real system solves the problem the RSA tool runs into. RSA
 * can only carry a couple of hundred bytes and is orders of magnitude slower
 * than a block cipher, so nobody encrypts a document with it. Instead:
 *
 *   1. Generate a random AES-256 key for this message alone.
 *   2. Encrypt the message with AES-GCM — fast, authenticated, any length.
 *   3. Encrypt just that 32-byte key with the recipient RSA public key.
 *   4. Send both.
 *
 * The recipient unwraps the content key with their private key, then decrypts
 * the body. TLS, PGP, S/MIME and age all work this way. It is also why "RSA is
 * slow" rarely matters in practice: RSA only ever touches 32 bytes.
 */
import type { CryptoResult } from "./types";
import { bytesToText, randomBytes, textToBytes, toBytes } from "./bytes";
import { open, seal } from "./envelope";
import { importRsaPrivateKey, importRsaPublicKey } from "./rsa";

const LABEL = "hybrid-rsa-aes256gcm";
const IV_BYTES = 12;

export async function encryptHybrid(
  plaintext: string,
  publicKeyPem: string,
): Promise<CryptoResult> {
  if (!publicKeyPem.trim()) return { ok: false, error: "Paste or generate an RSA public key first." };

  let recipient: CryptoKey;
  try {
    recipient = await importRsaPublicKey(publicKeyPem);
  } catch {
    return { ok: false, error: "That is not a valid RSA public key in PEM format." };
  }

  try {
    // A content key used for exactly one message.
    const contentKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
      "encrypt",
      "decrypt",
    ]);

    const iv = randomBytes(IV_BYTES);
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      contentKey,
      textToBytes(plaintext) as BufferSource,
    );

    // Only the 32-byte key goes through RSA — never the message itself.
    const rawKey = await crypto.subtle.exportKey("raw", contentKey);
    const wrappedKey = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      recipient,
      rawKey,
    );

    return {
      ok: true,
      value: seal(LABEL, [toBytes(wrappedKey), iv, toBytes(ciphertext)]),
    };
  } catch (error) {
    return { ok: false, error: `Encryption failed: ${(error as Error).message}` };
  }
}

export async function decryptHybrid(
  envelope: string,
  privateKeyPem: string,
): Promise<CryptoResult> {
  if (!privateKeyPem.trim()) return { ok: false, error: "Paste the matching RSA private key." };

  const opened = open(envelope, LABEL, 3);
  if (!opened.ok) return opened;

  const [wrappedKey, iv, ciphertext] = opened.value;

  let recipient: CryptoKey;
  try {
    recipient = await importRsaPrivateKey(privateKeyPem);
  } catch {
    return { ok: false, error: "That is not a valid RSA private key in PEM format." };
  }

  let rawKey: ArrayBuffer;
  try {
    rawKey = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      recipient,
      wrappedKey as BufferSource,
    );
  } catch {
    return {
      ok: false,
      error: "Could not unwrap the content key — this payload was sealed for a different key pair.",
    };
  }

  try {
    const contentKey = await crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      contentKey,
      ciphertext as BufferSource,
    );
    return { ok: true, value: bytesToText(toBytes(plaintext)) };
  } catch {
    // The key unwrapped, so the recipient is right — the body must be damaged.
    return { ok: false, error: "The content key unwrapped, but the body failed its integrity check." };
  }
}
