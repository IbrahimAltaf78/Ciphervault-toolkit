/**
 * ASCII decimal — one space-separated code per byte.
 *
 * Values run 0–255 because text is bridged through UTF-8 first; a plain ASCII
 * message stays inside 0–127, while anything above it is a multi-byte
 * character's constituent bytes.
 */
import type { OperationResult } from "@/types";
import { bytesToText, invalid, textToBytes } from "./bytes";

const TOKEN = /^\d{1,3}$/;

export function encodeAscii(input: string): OperationResult {
  const bytes = textToBytes(input);
  return { ok: true, value: Array.from(bytes).join(" ") };
}

export function decodeAscii(input: string): OperationResult {
  const tokens = input.trim().split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0) return { ok: true, value: "" };

  const bytes = new Uint8Array(tokens.length);
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!TOKEN.test(token)) return invalid();

    const code = Number(token);
    if (code > 255) {
      return {
        ok: false,
        error: `Out of range — ${code} exceeds the maximum byte value of 255.`,
      };
    }
    bytes[i] = code;
  }

  return bytesToText(bytes);
}
