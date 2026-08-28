/**
 * Hexadecimal — two lowercase nibbles per byte, space-separated for legibility.
 * Decoding accepts any spacing and either case.
 */
import type { OperationResult } from "@/types";
import { bytesToText, invalid, stripWhitespace, textToBytes } from "./bytes";

const VALID = /^[0-9a-f]*$/i;

export function encodeHex(input: string): OperationResult {
  const bytes = textToBytes(input);
  const pairs = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return { ok: true, value: pairs.join(" ") };
}

export function decodeHex(input: string): OperationResult {
  const payload = stripWhitespace(input).replace(/^0x/i, "");
  if (payload.length === 0) return { ok: true, value: "" };

  if (!VALID.test(payload)) return invalid();
  if (payload.length % 2 !== 0) {
    return {
      ok: false,
      error: "Invalid length — every byte needs two hex digits.",
    };
  }

  const bytes = new Uint8Array(payload.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(payload.slice(i * 2, i * 2 + 2), 16);
  }

  return bytesToText(bytes);
}
