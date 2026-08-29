/**
 * Zero-width Unicode hiding.
 *
 * Each payload bit becomes an invisible code point interleaved into the cover:
 * U+200B ZERO WIDTH SPACE for 0, U+200C ZERO WIDTH NON-JOINER for 1. Both
 * render as nothing, so the cover text is visually untouched while carrying the
 * message between its characters.
 *
 * This is the only technique with unbounded capacity — the carriers are
 * inserted rather than borrowed from existing text features.
 */
import type { OperationResult } from "@/types";
import { NO_PAYLOAD, frameSecret, unframeSecret } from "./bits";

const ZERO = "\u200B";
const ONE = "\u200C";
const ZERO_WIDTH = /[\u200B\u200C]/g;

/** Removes any existing carriers so re-hiding never stacks two payloads. */
export function stripZeroWidth(text: string): string {
  return text.replace(ZERO_WIDTH, "");
}

export function hideZeroWidth(secret: string, cover: string): OperationResult {
  const framed = frameSecret(secret);
  if (!framed.ok) return framed;

  const marks = Array.from(framed.value, (bit) => (bit === "1" ? ONE : ZERO));
  const chars = Array.from(stripZeroWidth(cover));

  // Spread one carrier after each visible character, so the invisible run is
  // distributed through the text rather than clumped at one edge.
  let output = "";
  for (let i = 0; i < chars.length; i += 1) {
    output += chars[i];
    if (i < marks.length) output += marks[i];
  }
  if (marks.length > chars.length) output += marks.slice(chars.length).join("");

  return { ok: true, value: output };
}

export function extractZeroWidth(stego: string): OperationResult {
  let bits = "";
  for (const char of stego) {
    if (char === ZERO) bits += "0";
    else if (char === ONE) bits += "1";
  }
  if (bits.length === 0) return { ok: false, error: NO_PAYLOAD };
  return unframeSecret(bits);
}

/** Zero-width capacity is bounded only by the payload header. */
export function zeroWidthCapacity(): number {
  return Number.POSITIVE_INFINITY;
}

/** Renders the invisible carriers as visible bit marks, for inspection. */
export function revealZeroWidth(text: string): string {
  return text.replace(/\u200B/g, "\u2080").replace(/\u200C/g, "\u2081");
}
