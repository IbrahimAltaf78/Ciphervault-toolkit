/**
 * Punctuation hiding.
 *
 * Several punctuation marks have a Unicode twin that renders near-identically
 * in almost every font. Each mark in the cover therefore carries one bit: the
 * plain ASCII form is 0, the typographic twin is 1.
 *
 * The Greek question mark (U+037E) is the clearest example — it is visually a
 * semicolon, and the pair below relies on exactly that kind of collision.
 */
import type { OperationResult } from "@/types";
import { NO_PAYLOAD, frameSecret, requiredBits, tooSmall, unframeSecret } from "./bits";

/** [ ASCII form (bit 0), Unicode twin (bit 1) ] */
const PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["'", "\u2019"], // apostrophe    -> right single quotation mark
  ['"', "\u201D"], // quotation     -> right double quotation mark
  ["-", "\u2010"], // hyphen-minus  -> hyphen
  [";", "\u037E"], // semicolon     -> Greek question mark
  [":", "\u2236"], // colon         -> ratio
  ["!", "\u01C3"], // exclamation   -> latin letter retroflex click
];

const ZERO_FORMS = new Map(PAIRS.map(([zero], i) => [zero, i]));
const ONE_FORMS = new Map(PAIRS.map(([, one], i) => [one, i]));

/** Index of the pair a character belongs to, or -1. */
function pairIndex(char: string): number {
  const asZero = ZERO_FORMS.get(char);
  if (asZero !== undefined) return asZero;
  const asOne = ONE_FORMS.get(char);
  return asOne === undefined ? -1 : asOne;
}

export function punctuationCapacity(cover: string): number {
  let count = 0;
  for (const char of cover) if (pairIndex(char) !== -1) count += 1;
  return count;
}

export function hidePunctuation(secret: string, cover: string): OperationResult {
  const framed = frameSecret(secret);
  if (!framed.ok) return framed;

  const bits = framed.value;
  const capacity = punctuationCapacity(cover);
  if (capacity < bits.length) {
    return tooSmall(capacity, requiredBits(secret), "punctuation marks");
  }

  let index = 0;
  let output = "";
  for (const char of cover) {
    const pair = pairIndex(char);
    if (pair === -1 || index >= bits.length) {
      output += char;
      continue;
    }
    output += bits[index] === "1" ? PAIRS[pair][1] : PAIRS[pair][0];
    index += 1;
  }

  return { ok: true, value: output };
}

export function extractPunctuation(stego: string): OperationResult {
  let bits = "";
  for (const char of stego) {
    if (ZERO_FORMS.has(char)) bits += "0";
    else if (ONE_FORMS.has(char)) bits += "1";
  }

  if (bits.length === 0) return { ok: false, error: NO_PAYLOAD };
  return unframeSecret(bits);
}

/** Brackets every mark that was swapped for its Unicode twin. */
export function revealPunctuation(text: string): string {
  let output = "";
  for (const char of text) {
    const asOne = ONE_FORMS.get(char);
    output += asOne === undefined ? char : `\u27E8${PAIRS[asOne][0]}\u27E9`;
  }
  return output;
}
