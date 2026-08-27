/**
 * Shared type definitions for CipherVault tool modules.
 */

/**
 * Every tool panel is bidirectional. `forward` covers Hide / Encrypt / Encode,
 * `reverse` covers Extract / Decrypt / Decode.
 */
export type ToolMode = "forward" | "reverse";

/** Security paradigms, each mapped to its own accent colour in DESIGN.md. */
export type Paradigm =
  | "cryptography"
  | "steganography"
  | "text-hiding"
  | "encoding"
  | "covert-channels"
  | "watermarking";

/**
 * Result of a local (client-side) transformation. Operations never throw at the
 * UI boundary — failures come back as `ok: false` with a readable reason.
 */
export type OperationResult =
  | { ok: true; value: string }
  | { ok: false; error: string };
