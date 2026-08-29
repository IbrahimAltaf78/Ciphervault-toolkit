/**
 * Whitespace hiding.
 *
 * Every gap between two words carries one bit: a single space is 0, a double
 * space is 1. The words, punctuation and line breaks are left exactly as
 * written — only the width of the gaps changes, which most readers and most
 * rendering engines silently ignore.
 */
import type { OperationResult } from "@/types";
import { NO_PAYLOAD, frameSecret, requiredBits, tooSmall, unframeSecret } from "./bits";

/** Collapses existing runs so the cover starts from a known single-space state. */
function normalise(text: string): string {
  return text.replace(/ {2,}/g, " ");
}

/** One bit per inter-word gap. */
export function whitespaceCapacity(cover: string): number {
  const matches = normalise(cover).match(/ /g);
  return matches ? matches.length : 0;
}

export function hideWhitespace(secret: string, cover: string): OperationResult {
  const framed = frameSecret(secret);
  if (!framed.ok) return framed;

  const bits = framed.value;
  const capacity = whitespaceCapacity(cover);
  if (capacity < bits.length) {
    return tooSmall(capacity, requiredBits(secret), "word gaps");
  }

  // Rebuild the text gap by gap, widening the ones that carry a 1.
  const segments = normalise(cover).split(" ");
  let output = segments[0] ?? "";
  for (let i = 1; i < segments.length; i += 1) {
    const bit = bits[i - 1];
    output += bit === "1" ? "  " : " ";
    output += segments[i];
  }

  return { ok: true, value: output };
}

export function extractWhitespace(stego: string): OperationResult {
  const runs = stego.match(/ +/g);
  if (!runs) return { ok: false, error: NO_PAYLOAD };

  const bits = runs.map((run) => (run.length >= 2 ? "1" : "0")).join("");
  return unframeSecret(bits);
}

/** Renders each gap as a visible glyph so single and double reads clearly. */
export function revealWhitespace(text: string): string {
  return text.replace(/ +/g, (run) => "\u2423".repeat(run.length));
}
