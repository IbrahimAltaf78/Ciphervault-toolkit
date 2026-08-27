/**
 * Base64 encoding / decoding — runs entirely in the browser (local execution track).
 *
 * `btoa` / `atob` operate on latin1, so text is bridged through UTF-8 bytes to
 * keep non-ASCII payloads (emoji, accents, zero-width characters) intact.
 */
import type { OperationResult } from "@/types";

const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;

/** Encodes a UTF-8 string to a standard Base64 payload. */
export function encodeBase64(input: string): OperationResult {
  try {
    const bytes = new TextEncoder().encode(input);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return { ok: true, value: btoa(binary) };
  } catch {
    return { ok: false, error: "Unable to encode this input to Base64." };
  }
}

/** Decodes a Base64 payload back to a UTF-8 string. */
export function decodeBase64(input: string): OperationResult {
  const payload = input.trim().replace(/\s+/g, "");

  if (payload.length === 0) return { ok: true, value: "" };
  if (!BASE64_PATTERN.test(payload)) {
    return { ok: false, error: "Invalid character set — expected A–Z, a–z, 0–9, +, / and = padding." };
  }
  if (payload.length % 4 !== 0) {
    return { ok: false, error: "Invalid length — Base64 payloads must be a multiple of 4 characters." };
  }

  try {
    const binary = atob(payload);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return { ok: true, value: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, error: "Corrupted payload — this is not valid Base64-encoded UTF-8 text." };
  }
}

/** Returns true when `input` is a structurally valid Base64 payload. */
export function isBase64(input: string): boolean {
  const payload = input.trim().replace(/\s+/g, "");
  return payload.length % 4 === 0 && BASE64_PATTERN.test(payload);
}
