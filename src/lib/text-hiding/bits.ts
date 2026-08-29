/**
 * Bit framing shared by all six text-hiding techniques.
 *
 * A carrier can only ever give back a flat run of bits, so the payload is
 * wrapped in a frame that tells the extractor where it ends:
 *
 *   [ 8-bit byte count ][ payload bytes, 8 bits each ]
 *
 * Without the header an extractor could not tell payload bits from whatever
 * the rest of the cover text happens to encode. The header also makes a
 * "nothing hidden here" result detectable rather than silent garbage.
 */
import type { OperationResult } from "@/types";

/**
 * Width of the length header, in bits.
 *
 * Kept at 8 rather than 16 because these carriers are scarce — a punctuation
 * cover may offer only a few dozen marks, so eight bits of overhead is the
 * difference between fitting a short message and not fitting one at all.
 */
export const HEADER_BITS = 8;

/** Largest payload the 16-bit header can describe. */
export const MAX_PAYLOAD_BYTES = 0xff;

export const NO_PAYLOAD = "No hidden message found in this text.";
export const TRUNCATED = "The hidden message is incomplete — the carrier text was altered.";

/** Serialises a secret into header + payload bits, ready for a carrier. */
export function frameSecret(secret: string): OperationResult {
  const bytes = new TextEncoder().encode(secret);
  if (bytes.length > MAX_PAYLOAD_BYTES) {
    return {
      ok: false,
      error: `Secret is too long — ${bytes.length} bytes exceeds the ${MAX_PAYLOAD_BYTES} byte limit.`,
    };
  }

  const header = bytes.length.toString(2).padStart(HEADER_BITS, "0");
  let payload = "";
  for (const byte of bytes) payload += byte.toString(2).padStart(8, "0");

  return { ok: true, value: header + payload };
}

/** Reads a framed payload back out of the bits recovered from a carrier. */
export function unframeSecret(bits: string): OperationResult {
  if (bits.length < HEADER_BITS) return { ok: false, error: NO_PAYLOAD };

  const byteCount = Number.parseInt(bits.slice(0, HEADER_BITS), 2);
  if (byteCount === 0) return { ok: true, value: "" };

  const payload = bits.slice(HEADER_BITS, HEADER_BITS + byteCount * 8);
  if (payload.length < byteCount * 8) return { ok: false, error: TRUNCATED };

  const bytes = new Uint8Array(byteCount);
  for (let i = 0; i < byteCount; i += 1) {
    bytes[i] = Number.parseInt(payload.slice(i * 8, i * 8 + 8), 2);
  }

  try {
    return {
      ok: true,
      value: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    };
  } catch {
    // Reached when the carrier held bits, but not bits this scheme wrote.
    return { ok: false, error: NO_PAYLOAD };
  }
}

/** Total bits a carrier must hold to fit `secret`, header included. */
export function requiredBits(secret: string): number {
  return HEADER_BITS + new TextEncoder().encode(secret).length * 8;
}

/** Standard message for a cover that cannot hold the payload. */
export function tooSmall(available: number, needed: number, unit: string): OperationResult {
  return {
    ok: false,
    error: `Cover text is too small — it offers ${available} ${unit} but this secret needs ${needed}.`,
  };
}
