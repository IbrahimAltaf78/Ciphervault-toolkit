/**
 * DES and Triple DES in CBC mode, over the block cipher in des-core.
 *
 * Both are here for teaching, not for use:
 *
 *  - DES has a 56-bit key. It was broken by brute force in public in 1998 and
 *    is exhaustible in hours on commodity hardware today.
 *  - 3DES chains three DES operations (encrypt, decrypt, encrypt) for an
 *    effective 112 bits, but its 64-bit block is the real problem — collisions
 *    become likely after about 32 GB under one key, which is the Sweet32
 *    attack. NIST withdrew it for new applications after 2023.
 *
 * The EDE ordering is not arbitrary: with K1 = K2 = K3, 3DES reduces exactly to
 * single DES, which is how the standard stayed backward compatible.
 */
import type { CryptoResult } from "../types";
import { bytesToText, randomBytes, textToBytes } from "../bytes";
import { deriveKeyBytes, SALT_BYTES } from "../kdf";
import { open, seal } from "../envelope";
import { BLOCK_BYTES, keySchedule, processBlock } from "./des-core";

/** DES takes one 8-byte key; 3DES takes three. */
const KEY_BYTES = { des: 8, "3des": 24 } as const;

export type DesVariant = keyof typeof KEY_BYTES;

/** PKCS#7: pad to the block size, always adding at least one byte. */
function pad(data: Uint8Array): Uint8Array {
  const padding = BLOCK_BYTES - (data.length % BLOCK_BYTES);
  const out = new Uint8Array(data.length + padding);
  out.set(data);
  out.fill(padding, data.length);
  return out;
}

function unpad(data: Uint8Array): CryptoResult<Uint8Array> {
  if (data.length === 0 || data.length % BLOCK_BYTES !== 0) {
    return { ok: false, error: "Ciphertext length is not a whole number of blocks." };
  }

  const padding = data[data.length - 1];
  if (padding < 1 || padding > BLOCK_BYTES || padding > data.length) {
    return { ok: false, error: "Decryption failed — wrong password, or the payload is corrupted." };
  }
  // Every padding byte must carry the same value, or this is not our plaintext.
  for (let i = data.length - padding; i < data.length; i += 1) {
    if (data[i] !== padding) {
      return { ok: false, error: "Decryption failed — wrong password, or the payload is corrupted." };
    }
  }

  return { ok: true, value: data.subarray(0, data.length - padding) };
}

function xorInto(target: Uint8Array, source: Uint8Array): void {
  for (let i = 0; i < target.length; i += 1) target[i] ^= source[i];
}

/** Round-key schedules for each DES pass, in EDE order. */
function schedules(key: Uint8Array, variant: DesVariant) {
  if (variant === "des") return [keySchedule(key)];
  return [
    keySchedule(key.subarray(0, 8)),
    keySchedule(key.subarray(8, 16)),
    keySchedule(key.subarray(16, 24)),
  ];
}

/** One block through the cipher: E(K1) for DES, E(K3)·D(K2)·E(K1) for 3DES. */
function cipherBlock(
  block: Uint8Array,
  keys: ReturnType<typeof schedules>,
  decrypt: boolean,
): Uint8Array {
  if (keys.length === 1) return processBlock(block, keys[0], decrypt);

  if (!decrypt) {
    return processBlock(
      processBlock(processBlock(block, keys[0], false), keys[1], true),
      keys[2],
      false,
    );
  }
  return processBlock(
    processBlock(processBlock(block, keys[2], true), keys[1], false),
    keys[0],
    true,
  );
}

function cbcEncrypt(data: Uint8Array, keys: ReturnType<typeof schedules>, iv: Uint8Array) {
  const padded = pad(data);
  const out = new Uint8Array(padded.length);
  let previous = iv;

  for (let offset = 0; offset < padded.length; offset += BLOCK_BYTES) {
    const block = padded.slice(offset, offset + BLOCK_BYTES);
    // Chaining: each block is masked by the previous ciphertext block, so two
    // identical plaintext blocks do not produce identical ciphertext.
    xorInto(block, previous);
    const encrypted = cipherBlock(block, keys, false);
    out.set(encrypted, offset);
    previous = encrypted;
  }
  return out;
}

function cbcDecrypt(data: Uint8Array, keys: ReturnType<typeof schedules>, iv: Uint8Array) {
  const out = new Uint8Array(data.length);
  let previous = iv;

  for (let offset = 0; offset < data.length; offset += BLOCK_BYTES) {
    const block = data.slice(offset, offset + BLOCK_BYTES);
    const decrypted = cipherBlock(block, keys, true);
    xorInto(decrypted, previous);
    out.set(decrypted, offset);
    previous = block;
  }
  return out;
}

const label = (variant: DesVariant) => `${variant}-cbc`;

export async function encryptDes(
  plaintext: string,
  password: string,
  variant: DesVariant,
): Promise<CryptoResult> {
  if (!password) return { ok: false, error: "Enter a password to derive the key from." };

  try {
    const salt = randomBytes(SALT_BYTES);
    const iv = randomBytes(BLOCK_BYTES);
    const key = await deriveKeyBytes(password, salt, KEY_BYTES[variant]);
    const ciphertext = cbcEncrypt(textToBytes(plaintext), schedules(key, variant), iv);
    return { ok: true, value: seal(label(variant), [salt, iv, ciphertext]) };
  } catch (error) {
    return { ok: false, error: `Encryption failed: ${(error as Error).message}` };
  }
}

export async function decryptDes(
  envelope: string,
  password: string,
  variant: DesVariant,
): Promise<CryptoResult> {
  if (!password) return { ok: false, error: "Enter the password the payload was encrypted with." };

  const opened = open(envelope, label(variant), 3);
  if (!opened.ok) return opened;

  const [salt, iv, ciphertext] = opened.value;
  if (ciphertext.length === 0 || ciphertext.length % BLOCK_BYTES !== 0) {
    return { ok: false, error: "Ciphertext length is not a whole number of 8-byte blocks." };
  }

  try {
    const key = await deriveKeyBytes(password, salt, KEY_BYTES[variant]);
    const padded = cbcDecrypt(ciphertext, schedules(key, variant), iv);

    const unpadded = unpad(padded);
    if (!unpadded.ok) return unpadded;

    return { ok: true, value: bytesToText(unpadded.value) };
  } catch {
    // A wrong key usually fails at the padding check above; reaching here means
    // the bytes unpadded cleanly but were not valid UTF-8.
    return { ok: false, error: "Decryption failed — wrong password, or the payload is corrupted." };
  }
}

export { BLOCK_BYTES } from "./des-core";
