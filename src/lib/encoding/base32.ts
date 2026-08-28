/**
 * Base32 (RFC 4648 §6) — 5 bits per character over the A–Z 2–7 alphabet,
 * padded with `=` to a multiple of 8 characters.
 *
 * Implemented as an explicit bit accumulator rather than via a library, per the
 * "no black-box packages" guardrail in RULES.md.
 */
import type { OperationResult } from "@/types";
import { bytesToText, invalid, stripWhitespace, textToBytes } from "./bytes";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const VALID = /^[A-Z2-7]*={0,6}$/;

export function encodeBase32(input: string): OperationResult {
  const bytes = textToBytes(input);
  let value = 0;
  let bits = 0;
  let output = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  // Flush the trailing partial group, then pad to an 8-character boundary.
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31];
  while (output.length % 8 !== 0) output += "=";

  return { ok: true, value: output };
}

export function decodeBase32(input: string): OperationResult {
  const payload = stripWhitespace(input).toUpperCase();
  if (payload.length === 0) return { ok: true, value: "" };

  if (!VALID.test(payload)) return invalid();
  if (payload.length % 8 !== 0) {
    return {
      ok: false,
      error: "Invalid length — Base32 payloads must be a multiple of 8 characters.",
    };
  }

  const body = payload.replace(/=+$/, "");
  let value = 0;
  let bits = 0;
  const bytes: number[] = [];

  for (const char of body) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) return invalid();
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return bytesToText(Uint8Array.from(bytes));
}
