/**
 * Byte plumbing shared by every cipher in the module.
 *
 * Cryptographic primitives speak bytes; the UI speaks text. Everything crossing
 * that boundary goes through here so the conversions stay in one place.
 */

/**
 * A Uint8Array backed by a plain ArrayBuffer.
 *
 * Since TypeScript 5.7 the typed arrays are generic over their buffer, and the
 * WebCrypto signatures accept only the ArrayBuffer form — a SharedArrayBuffer
 * view is rejected. Naming it once here keeps the casts out of the ciphers.
 */
export type Bytes = Uint8Array<ArrayBuffer>;

export function textToBytes(text: string): Bytes {
  return new TextEncoder().encode(text) as Bytes;
}

/** Decodes bytes as UTF-8, rejecting anything that is not valid text. */
export function bytesToText(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  // Chunked so a large payload cannot blow the argument limit of fromCharCode.
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function base64ToBytes(value: string): Bytes {
  const binary = atob(value.trim());
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(value: string): Bytes {
  const clean = value.replace(/\s+/g, "").toLowerCase();
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Cryptographically secure random bytes — never Math.random. */
export function randomBytes(length: number): Bytes {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function concatBytes(...parts: Uint8Array[]): Bytes {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** BufferSource views handed back by WebCrypto, normalised to Uint8Array. */
export function toBytes(buffer: ArrayBuffer): Bytes {
  return new Uint8Array(buffer);
}
