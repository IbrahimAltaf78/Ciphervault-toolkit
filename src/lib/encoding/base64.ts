/**
 * Base64 (RFC 4648 §4) — runs entirely in the browser.
 *
 * `btoa` / `atob` operate on latin1, so text is bridged through UTF-8 bytes to
 * keep non-ASCII payloads intact.
 */
import type { OperationResult } from "@/types";
import { bytesToText, invalid, stripWhitespace, textToBytes } from "./bytes";

const ALPHABET = /^[A-Za-z0-9+/]*={0,2}$/;

export function encodeBase64(input: string): OperationResult {
  const bytes = textToBytes(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return { ok: true, value: btoa(binary) };
}

export function decodeBase64(input: string): OperationResult {
  const payload = stripWhitespace(input);
  if (payload.length === 0) return { ok: true, value: "" };

  // Strict alphabet check before any decoding is attempted.
  if (!ALPHABET.test(payload)) return invalid();
  if (payload.length % 4 !== 0) {
    return {
      ok: false,
      error: "Invalid length — Base64 payloads must be a multiple of 4 characters.",
    };
  }

  const binary = atob(payload);
  return bytesToText(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

/** Returns true when `input` is a structurally valid Base64 payload. */
export function isBase64(input: string): boolean {
  const payload = stripWhitespace(input);
  return payload.length % 4 === 0 && ALPHABET.test(payload);
}
