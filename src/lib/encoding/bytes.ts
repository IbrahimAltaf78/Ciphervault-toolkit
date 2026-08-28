/**
 * UTF-8 bridging shared by every encoder.
 *
 * All six sub-techniques operate on bytes rather than UTF-16 code units, so a
 * payload containing emoji, accented characters or zero-width code points
 * survives a full round trip through any of them.
 */
import type { OperationResult } from "@/types";

/** Message returned whenever input fails its alphabet or structural check. */
export const INVALID_INPUT = "Invalid input for this encoding";

export function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/**
 * Decodes bytes back to text, rejecting sequences that are not valid UTF-8
 * rather than silently substituting replacement characters.
 */
export function bytesToText(bytes: Uint8Array): OperationResult {
  try {
    return {
      ok: true,
      value: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    };
  } catch {
    return {
      ok: false,
      error: "Decoded bytes are not valid UTF-8 text.",
    };
  }
}

/** Collapses all whitespace, which every decoder tolerates in pasted payloads. */
export function stripWhitespace(input: string): string {
  return input.replace(/\s+/g, "");
}

export function invalid(): OperationResult {
  return { ok: false, error: INVALID_INPUT };
}
