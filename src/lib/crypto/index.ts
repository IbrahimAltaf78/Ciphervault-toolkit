/**
 * Cryptography registry — the single source of truth for the eight tools.
 *
 * The catch-all /cryptography/[...slug] route, the module hub and the panels
 * are all driven from this table, so a new algorithm means one entry here and
 * one explainer rather than a new route file.
 */
import type { CryptoResult } from "./types";

/** Which panel shape a tool needs — the four differ substantially. */
export type CryptoFamily = "symmetric" | "asymmetric" | "hashing" | "hybrid";

export type CryptoToolId =
  | "aes"
  | "des"
  | "3des"
  | "rsa"
  | "ecc"
  | "sha256"
  | "sha3"
  | "hybrid";

export interface CryptoTool {
  id: CryptoToolId;
  /** Path under /cryptography, e.g. "symmetric/aes". */
  path: string;
  label: string;
  /** One-line summary for the panel header and hub card. */
  tagline: string;
  family: CryptoFamily;
  forwardLabel: string;
  reverseLabel: string;
  /** Short status note shown as a chip, e.g. a deprecation warning. */
  status?: { tone: "warn" | "info"; text: string };
}

export const CRYPTO_TOOLS: Record<CryptoToolId, CryptoTool> = {
  aes: {
    id: "aes",
    path: "symmetric/aes",
    label: "AES",
    tagline: "The modern symmetric standard, in GCM, CBC or CTR at 128, 192 or 256 bits.",
    family: "symmetric",
    forwardLabel: "Encrypt",
    reverseLabel: "Decrypt",
    status: { tone: "info", text: "Recommended" },
  },
  des: {
    id: "des",
    path: "symmetric/des",
    label: "DES",
    tagline: "The 1977 standard, with a 56-bit key that fell to brute force in 1998.",
    family: "symmetric",
    forwardLabel: "Encrypt",
    reverseLabel: "Decrypt",
    status: { tone: "warn", text: "Broken — study only" },
  },
  "3des": {
    id: "3des",
    path: "symmetric/3des",
    label: "Triple DES",
    tagline: "Three chained DES passes for 112 effective bits, held back by a 64-bit block.",
    family: "symmetric",
    forwardLabel: "Encrypt",
    reverseLabel: "Decrypt",
    status: { tone: "warn", text: "Withdrawn by NIST" },
  },
  rsa: {
    id: "rsa",
    path: "asymmetric/rsa",
    label: "RSA",
    tagline: "Public-key encryption with OAEP padding — small payloads only.",
    family: "asymmetric",
    forwardLabel: "Encrypt",
    reverseLabel: "Decrypt",
  },
  ecc: {
    id: "ecc",
    path: "asymmetric/ecc",
    label: "ECC",
    tagline: "Elliptic-curve sealing over ECDH, HKDF and AES-GCM, with forward secrecy.",
    family: "asymmetric",
    forwardLabel: "Encrypt",
    reverseLabel: "Decrypt",
  },
  sha256: {
    id: "sha256",
    path: "hashing/sha256",
    label: "SHA-2",
    tagline: "SHA-256, 384 and 512 — one-way digests for integrity checking.",
    family: "hashing",
    forwardLabel: "Hash",
    reverseLabel: "Verify",
  },
  sha3: {
    id: "sha3",
    path: "hashing/sha3",
    label: "SHA-3",
    tagline: "Keccak sponge digests, structurally unrelated to the SHA-2 family.",
    family: "hashing",
    forwardLabel: "Hash",
    reverseLabel: "Verify",
  },
  hybrid: {
    id: "hybrid",
    path: "hybrid",
    label: "Hybrid",
    tagline: "RSA wraps a one-time AES-256-GCM key — how TLS and PGP actually work.",
    family: "hybrid",
    forwardLabel: "Encrypt",
    reverseLabel: "Decrypt",
    status: { tone: "info", text: "Any payload size" },
  },
};

/** Ordered list used for static params, hub cards and in-panel navigation. */
export const CRYPTO_TOOL_IDS = Object.keys(CRYPTO_TOOLS) as CryptoToolId[];

/** Path segments to tool, for the catch-all route. */
export function toolFromSlug(slug: string[]): CryptoTool | null {
  const path = slug.join("/");
  return CRYPTO_TOOL_IDS.map((id) => CRYPTO_TOOLS[id]).find((tool) => tool.path === path) ?? null;
}

/** Groups tools by family, for the hub layout. */
export const CRYPTO_FAMILIES: Array<{ family: CryptoFamily; label: string; blurb: string }> = [
  {
    family: "symmetric",
    label: "Symmetric",
    blurb: "One shared password encrypts and decrypts. Fast, and the workhorse of bulk encryption.",
  },
  {
    family: "asymmetric",
    label: "Asymmetric",
    blurb: "A public key seals, a private key opens. Solves key distribution, at a cost in speed and size.",
  },
  {
    family: "hashing",
    label: "Hashing",
    blurb: "One-way fingerprints. No key, no decryption — only comparison.",
  },
  {
    family: "hybrid",
    label: "Hybrid",
    blurb: "Asymmetric key exchange around a symmetric body. What real systems ship.",
  },
];

export type { CryptoResult };
export * from "./types";
export * from "./aes";
export * from "./des";
export * from "./rsa";
export * from "./ecc";
export * from "./hashing";
export * from "./hybrid";
export * from "./password-strength";
export * from "./envelope";
export * from "./pem";
export { PBKDF2_ITERATIONS } from "./kdf";
