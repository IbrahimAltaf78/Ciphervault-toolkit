/**
 * URL percent-encoding (RFC 3986).
 *
 * Uses `encodeURIComponent`, which escapes reserved delimiters as well, so the
 * output is safe to drop into a query string or path segment.
 */
import type { OperationResult } from "@/types";
import { invalid } from "./bytes";

/** A `%` must be followed by exactly two hex digits. */
const WELL_FORMED = /^(?:[^%]|%[0-9a-fA-F]{2})*$/;

export function encodeUrl(input: string): OperationResult {
  return { ok: true, value: encodeURIComponent(input) };
}

export function decodeUrl(input: string): OperationResult {
  if (input.length === 0) return { ok: true, value: "" };

  // Structural check first: a dangling or malformed escape is rejected here
  // rather than surfacing as a raw URIError.
  if (!WELL_FORMED.test(input)) return invalid();

  try {
    return { ok: true, value: decodeURIComponent(input) };
  } catch {
    // Reached when escapes are well-formed but decode to invalid UTF-8.
    return {
      ok: false,
      error: "Escape sequences do not decode to valid UTF-8 text.",
    };
  }
}
