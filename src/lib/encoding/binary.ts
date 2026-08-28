/**
 * Binary — one space-separated octet per byte. Decoding tolerates any spacing
 * but insists on a whole number of octets.
 */
import type { OperationResult } from "@/types";
import { bytesToText, invalid, stripWhitespace, textToBytes } from "./bytes";

const VALID = /^[01]*$/;

export function encodeBinary(input: string): OperationResult {
  const bytes = textToBytes(input);
  const octets = Array.from(bytes, (byte) => byte.toString(2).padStart(8, "0"));
  return { ok: true, value: octets.join(" ") };
}

export function decodeBinary(input: string): OperationResult {
  const payload = stripWhitespace(input);
  if (payload.length === 0) return { ok: true, value: "" };

  if (!VALID.test(payload)) return invalid();
  if (payload.length % 8 !== 0) {
    return {
      ok: false,
      error: "Invalid length — binary payloads must be a whole number of 8-bit octets.",
    };
  }

  const bytes = new Uint8Array(payload.length / 8);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(payload.slice(i * 8, i * 8 + 8), 2);
  }

  return bytesToText(bytes);
}
