/**
 * RSA-OAEP key generation, encryption and decryption, via WebCrypto.
 *
 * OAEP rather than the older PKCS#1 v1.5 padding: v1.5 is vulnerable to
 * Bleichenbacher's adaptive chosen-ciphertext attack, and WebCrypto does not
 * offer it for encryption at all.
 *
 * The hard limit worth understanding here is capacity. RSA encrypts a number
 * smaller than the modulus, so a 2048-bit key can carry at most
 * 256 - 2 * 32 - 2 = 190 bytes with OAEP over SHA-256. That is not a quirk to
 * work around — it is why nobody encrypts a document with RSA directly, and why
 * the hybrid tool exists.
 */
import type { CryptoResult, PemKeyPair, RsaModulusLength } from "./types";
import { base64ToBytes, bytesToBase64, bytesToText, textToBytes, toBytes } from "./bytes";
import { fromPem, toPem } from "./pem";

const ALGORITHM = { name: "RSA-OAEP", hash: "SHA-256" } as const;

/** Bytes OAEP over SHA-256 can carry for a given modulus. */
export function maxPayloadBytes(modulusLength: RsaModulusLength): number {
  return modulusLength / 8 - 2 * 32 - 2;
}

export async function generateRsaKeyPair(
  modulusLength: RsaModulusLength,
): Promise<CryptoResult<PemKeyPair>> {
  try {
    const pair = await crypto.subtle.generateKey(
      {
        ...ALGORITHM,
        modulusLength,
        // 65537: the standard public exponent — large enough to avoid the
        // small-exponent attacks that sank e=3, small enough to stay fast.
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      },
      true,
      ["encrypt", "decrypt"],
    );

    const [spki, pkcs8] = await Promise.all([
      crypto.subtle.exportKey("spki", pair.publicKey),
      crypto.subtle.exportKey("pkcs8", pair.privateKey),
    ]);

    return {
      ok: true,
      value: {
        publicKey: toPem(toBytes(spki), "PUBLIC KEY"),
        privateKey: toPem(toBytes(pkcs8), "PRIVATE KEY"),
      },
    };
  } catch (error) {
    return { ok: false, error: `Key generation failed: ${(error as Error).message}` };
  }
}

export async function importRsaPublicKey(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "spki",
    fromPem(pem, "PUBLIC KEY") as BufferSource,
    ALGORITHM,
    false,
    ["encrypt"],
  );
}

export async function importRsaPrivateKey(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "pkcs8",
    fromPem(pem, "PRIVATE KEY") as BufferSource,
    ALGORITHM,
    false,
    ["decrypt"],
  );
}

export async function encryptRsa(
  plaintext: string,
  publicKeyPem: string,
): Promise<CryptoResult> {
  if (!publicKeyPem.trim()) return { ok: false, error: "Paste or generate a public key first." };

  let key: CryptoKey;
  try {
    key = await importRsaPublicKey(publicKeyPem);
  } catch {
    return { ok: false, error: "That is not a valid RSA public key in PEM format." };
  }

  const bytes = textToBytes(plaintext);
  const modulusLength = (key.algorithm as RsaHashedKeyAlgorithm).modulusLength;
  const capacity = modulusLength / 8 - 2 * 32 - 2;

  if (bytes.length > capacity) {
    return {
      ok: false,
      error: `Message is ${bytes.length} bytes but this ${modulusLength}-bit key can only carry ${capacity}. Use the Hybrid tool for anything larger.`,
    };
  }

  try {
    const ciphertext = await crypto.subtle.encrypt(ALGORITHM, key, bytes as BufferSource);
    return { ok: true, value: bytesToBase64(toBytes(ciphertext)) };
  } catch (error) {
    return { ok: false, error: `Encryption failed: ${(error as Error).message}` };
  }
}

export async function decryptRsa(
  ciphertextBase64: string,
  privateKeyPem: string,
): Promise<CryptoResult> {
  if (!privateKeyPem.trim()) return { ok: false, error: "Paste the matching private key." };

  let key: CryptoKey;
  try {
    key = await importRsaPrivateKey(privateKeyPem);
  } catch {
    return { ok: false, error: "That is not a valid RSA private key in PEM format." };
  }

  let ciphertext: Uint8Array;
  try {
    ciphertext = base64ToBytes(ciphertextBase64);
  } catch {
    return { ok: false, error: "The ciphertext is not valid Base64." };
  }

  try {
    const plaintext = await crypto.subtle.decrypt(ALGORITHM, key, ciphertext as BufferSource);
    return { ok: true, value: bytesToText(toBytes(plaintext)) };
  } catch {
    return {
      ok: false,
      error: "Decryption failed — this ciphertext was not encrypted for this key pair.",
    };
  }
}
