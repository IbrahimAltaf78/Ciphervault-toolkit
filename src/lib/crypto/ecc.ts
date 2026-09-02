/**
 * Elliptic-curve encryption, as ECIES over ECDH + HKDF + AES-GCM.
 *
 * ECC does not encrypt. There is no elliptic-curve equivalent of "raise the
 * message to the public exponent" — the primitive is a key agreement, not a
 * cipher. Every real system that says "encrypted with ECC" is doing what this
 * file does:
 *
 *   1. Generate a throwaway (ephemeral) key pair on the same curve.
 *   2. ECDH the ephemeral private key against the recipient public key to get a
 *      shared secret only the recipient can reproduce.
 *   3. Run that secret through HKDF to get a clean AES-256 key.
 *   4. Encrypt with AES-GCM, and send the ephemeral public key alongside.
 *
 * The recipient repeats step 2 with their private key and the ephemeral public
 * key, reaching the same secret. A fresh ephemeral pair per message is what
 * gives the scheme forward secrecy: the sender discards the private half
 * immediately, so it cannot be seized later.
 *
 * The appeal over RSA is size — P-256 offers security comparable to RSA-3072
 * with a 32-byte key.
 */
import type { CryptoResult, EccCurve, PemKeyPair } from "./types";
import { bytesToText, randomBytes, textToBytes, toBytes } from "./bytes";
import { fromPem, toPem } from "./pem";
import { open, seal } from "./envelope";

const IV_BYTES = 12;

export async function generateEccKeyPair(
  namedCurve: EccCurve,
): Promise<CryptoResult<PemKeyPair>> {
  try {
    const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve }, true, [
      "deriveKey",
      "deriveBits",
    ]);

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

/**
 * Turns a raw ECDH secret into an AES key.
 *
 * The shared secret is a curve point coordinate, not uniformly random, so it
 * must never be used as a key directly — HKDF is what flattens it.
 */
async function deriveAesKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  namedCurve: EccCurve,
): Promise<CryptoKey> {
  const bitsPerCurve = { "P-256": 256, "P-384": 384, "P-521": 528 } as const;

  const shared = await crypto.subtle.deriveBits(
    { name: "ECDH", public: publicKey },
    privateKey,
    bitsPerCurve[namedCurve],
  );

  const material = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: textToBytes("ciphervault-ecies-v1"),
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

const label = (curve: EccCurve) => `ecies-${curve.toLowerCase()}`;

export async function encryptEcc(
  plaintext: string,
  publicKeyPem: string,
  namedCurve: EccCurve,
): Promise<CryptoResult> {
  if (!publicKeyPem.trim()) return { ok: false, error: "Paste or generate a public key first." };

  let recipient: CryptoKey;
  try {
    recipient = await crypto.subtle.importKey(
      "spki",
      fromPem(publicKeyPem, "PUBLIC KEY") as BufferSource,
      { name: "ECDH", namedCurve },
      false,
      [],
    );
  } catch {
    return {
      ok: false,
      error: `That is not a valid ${namedCurve} public key — check the curve selector matches the key.`,
    };
  }

  try {
    // Fresh ephemeral pair per message: this is what provides forward secrecy.
    const ephemeral = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve },
      true,
      ["deriveBits", "deriveKey"],
    );

    const key = await deriveAesKey(ephemeral.privateKey, recipient, namedCurve);
    const iv = randomBytes(IV_BYTES);
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      textToBytes(plaintext) as BufferSource,
    );
    const ephemeralPublic = await crypto.subtle.exportKey("spki", ephemeral.publicKey);

    return {
      ok: true,
      value: seal(label(namedCurve), [toBytes(ephemeralPublic), iv, toBytes(ciphertext)]),
    };
  } catch (error) {
    return { ok: false, error: `Encryption failed: ${(error as Error).message}` };
  }
}

export async function decryptEcc(
  envelope: string,
  privateKeyPem: string,
  namedCurve: EccCurve,
): Promise<CryptoResult> {
  if (!privateKeyPem.trim()) return { ok: false, error: "Paste the matching private key." };

  const opened = open(envelope, label(namedCurve), 3);
  if (!opened.ok) return opened;

  const [ephemeralPublic, iv, ciphertext] = opened.value;

  let recipientPrivate: CryptoKey;
  try {
    recipientPrivate = await crypto.subtle.importKey(
      "pkcs8",
      fromPem(privateKeyPem, "PRIVATE KEY") as BufferSource,
      { name: "ECDH", namedCurve },
      false,
      ["deriveBits", "deriveKey"],
    );
  } catch {
    return { ok: false, error: `That is not a valid ${namedCurve} private key in PEM format.` };
  }

  try {
    const ephemeral = await crypto.subtle.importKey(
      "spki",
      ephemeralPublic as BufferSource,
      { name: "ECDH", namedCurve },
      false,
      [],
    );

    const key = await deriveAesKey(recipientPrivate, ephemeral, namedCurve);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      ciphertext as BufferSource,
    );
    return { ok: true, value: bytesToText(toBytes(plaintext)) };
  } catch {
    return {
      ok: false,
      error: "Decryption failed — this payload was not sealed for this key pair.",
    };
  }
}
