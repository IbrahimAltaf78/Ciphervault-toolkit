/**
 * Word-choice hiding.
 *
 * Wherever the cover uses a word that has a listed synonym, the choice between
 * the two carries one bit. Replacing "big" with "large" changes nothing a
 * reader would notice, which makes the payload invisible to inspection of the
 * text itself — unlike whitespace or capitalisation, there is no formatting
 * anomaly to spot.
 *
 * The trade-off is the lowest capacity of the six: one bit per matched word.
 */
import type { OperationResult } from "@/types";
import { NO_PAYLOAD, frameSecret, requiredBits, tooSmall, unframeSecret } from "./bits";
import { SYNONYM_PAIRS } from "./data/synonym-pairs";

interface Slot {
  pair: number;
  bit: "0" | "1";
}

/** word (lowercase) -> which pair it belongs to and which bit it represents. */
const LOOKUP = new Map<string, Slot>();
for (const [index, [zero, one]] of SYNONYM_PAIRS.entries()) {
  LOOKUP.set(zero, { pair: index, bit: "0" });
  LOOKUP.set(one, { pair: index, bit: "1" });
}

const WORD = /\p{L}+/gu;

/** Re-applies the original word's capitalisation to its replacement. */
function matchCase(original: string, replacement: string): string {
  if (original === original.toUpperCase() && original.length > 1) {
    return replacement.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

export function wordChoiceCapacity(cover: string): number {
  const words = cover.match(WORD);
  if (!words) return 0;
  return words.filter((word) => LOOKUP.has(word.toLowerCase())).length;
}

export function hideWordChoice(secret: string, cover: string): OperationResult {
  const framed = frameSecret(secret);
  if (!framed.ok) return framed;

  const bits = framed.value;
  const capacity = wordChoiceCapacity(cover);
  if (capacity < bits.length) {
    return tooSmall(capacity, requiredBits(secret), "swappable words");
  }

  let index = 0;
  const value = cover.replace(WORD, (word) => {
    const slot = LOOKUP.get(word.toLowerCase());
    if (!slot || index >= bits.length) return word;

    const bit = bits[index];
    index += 1;
    const [zero, one] = SYNONYM_PAIRS[slot.pair];
    return matchCase(word, bit === "1" ? one : zero);
  });

  return { ok: true, value };
}

export function extractWordChoice(stego: string): OperationResult {
  const words = stego.match(WORD);
  if (!words) return { ok: false, error: NO_PAYLOAD };

  let bits = "";
  for (const word of words) {
    const slot = LOOKUP.get(word.toLowerCase());
    if (slot) bits += slot.bit;
  }

  if (bits.length === 0) return { ok: false, error: NO_PAYLOAD };
  return unframeSecret(bits);
}

/** Exposed so the UI can tell the user which words act as carriers. */
export const SWAPPABLE_WORDS = SYNONYM_PAIRS;
