/**
 * Acrostic hiding.
 *
 * The odd one out: rather than borrowing carriers from a cover you supply,
 * this technique *generates* the cover. One sentence is emitted per letter of
 * the secret, chosen so its first letter is that letter, and the sentences are
 * grouped into a paragraph per word.
 *
 * Because the carrier is the first letter of a sentence — and sentences always
 * start capitalised — the scheme carries letters only. Case, punctuation and
 * digits are not preserved, which is the classic limitation of an acrostic and
 * the reason it is used for short signals rather than payloads.
 *
 * A telestic is the same construction read from the final letter of each line
 * instead of the first.
 *
 * Note that this is the one technique with no length header. The other five
 * hide a frame inside a carrier the reader cannot see, so they can tell a real
 * payload from noise; here the carrier *is* the visible sentence structure, so
 * there is nowhere to put a header. Extraction therefore always returns the
 * initials of whatever it is given — reading a message out of innocent prose is
 * the reader's judgement call, not something the tool can verify.
 */
import type { OperationResult } from "@/types";
import { ACROSTIC_SENTENCES } from "./data/acrostic-sentences";

const SUPPORTED = /^[a-z ]+$/;

export function hideAcrostic(secret: string): OperationResult {
  const normalised = secret.trim().toLowerCase().replace(/\s+/g, " ");

  if (normalised.length === 0) {
    return { ok: false, error: "Enter a secret message to spell out." };
  }
  if (!SUPPORTED.test(normalised)) {
    return {
      ok: false,
      error:
        "An acrostic can only spell letters A–Z and spaces — remove digits and punctuation from the secret.",
    };
  }

  // One paragraph per word, one sentence per letter.
  const paragraphs = normalised.split(" ").map((word, wordIndex) =>
    Array.from(word, (letter, letterIndex) => {
      const bank = ACROSTIC_SENTENCES[letter];
      // Rotate through the bank so a repeated letter is not a repeated line.
      return bank[(wordIndex + letterIndex) % bank.length];
    }).join(" "),
  );

  return { ok: true, value: paragraphs.join("\n\n") };
}

export function extractAcrostic(stego: string): OperationResult {
  const paragraphs = stego
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return { ok: false, error: "No hidden message found in this text." };
  }

  const words = paragraphs.map((paragraph) =>
    paragraph
      // Split after sentence-ending punctuation, keeping the sentences intact.
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean)
      .map((sentence) => {
        const first = sentence.match(/\p{L}/u);
        return first ? first[0].toLowerCase() : "";
      })
      .join(""),
  );

  const secret = words.filter(Boolean).join(" ");
  if (secret.length === 0) {
    return { ok: false, error: "No hidden message found in this text." };
  }

  return { ok: true, value: secret };
}

/** Sentences the generator will emit for a given secret. */
export function acrosticSentenceCount(secret: string): number {
  return secret.replace(/[^a-z]/gi, "").length;
}
