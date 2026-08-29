/**
 * Capitalisation hiding.
 *
 * The first letter of each word carries one bit — uppercase is 1, lowercase
 * is 0. The letters themselves never change, only their case, so the text
 * stays readable and passes a spell check while looking like erratic typing.
 *
 * Words beginning with a caseless script (digits, CJK, symbols) are skipped by
 * both sides, so the carrier sequence stays identical in each direction.
 */
import type { OperationResult } from "@/types";
import { NO_PAYLOAD, frameSecret, requiredBits, tooSmall, unframeSecret } from "./bits";

const WORD = /\p{L}[\p{L}\p{M}'’-]*/gu;

/** True when a character actually has an upper and lower form. */
function isCaseable(char: string): boolean {
  return char.toLowerCase() !== char.toUpperCase();
}

export function capitalizationCapacity(cover: string): number {
  const words = cover.match(WORD);
  if (!words) return 0;
  return words.filter((word) => isCaseable(word[0])).length;
}

export function hideCapitalization(secret: string, cover: string): OperationResult {
  const framed = frameSecret(secret);
  if (!framed.ok) return framed;

  const bits = framed.value;
  const capacity = capitalizationCapacity(cover);
  if (capacity < bits.length) {
    return tooSmall(capacity, requiredBits(secret), "usable words");
  }

  let index = 0;
  const value = cover.replace(WORD, (word) => {
    const first = word[0];
    if (!isCaseable(first)) return word;
    if (index >= bits.length) return word;

    const bit = bits[index];
    index += 1;
    const cased = bit === "1" ? first.toUpperCase() : first.toLowerCase();
    return cased + word.slice(1);
  });

  return { ok: true, value };
}

export function extractCapitalization(stego: string): OperationResult {
  const words = stego.match(WORD);
  if (!words) return { ok: false, error: NO_PAYLOAD };

  let bits = "";
  for (const word of words) {
    const first = word[0];
    if (!isCaseable(first)) continue;
    bits += first === first.toUpperCase() ? "1" : "0";
  }

  if (bits.length === 0) return { ok: false, error: NO_PAYLOAD };
  return unframeSecret(bits);
}
