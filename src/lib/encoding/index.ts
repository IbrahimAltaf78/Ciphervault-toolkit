/**
 * Encoding registry — the single source of truth for the six sub-techniques.
 *
 * The /encoding/[type] route, the module hub and the tool panel are all driven
 * from this table, so adding a seventh encoding means adding one entry here and
 * one explainer, with no route or UI changes.
 */
import type { EncodingType, OperationResult } from "@/types";
import { decodeBase64, encodeBase64 } from "./base64";
import { decodeBase32, encodeBase32 } from "./base32";
import { decodeHex, encodeHex } from "./hex";
import { decodeBinary, encodeBinary } from "./binary";
import { decodeUrl, encodeUrl } from "./url";
import { decodeAscii, encodeAscii } from "./ascii";

export interface EncodingCodec {
  type: EncodingType;
  /** Display name, e.g. "Base64". */
  label: string;
  /** One-line summary shown in the panel header and hub card. */
  tagline: string;
  /** Alphabet or shape summary, shown as a mono chip. */
  alphabet: string;
  /** Label for the decoded side of the conversion. */
  plainLabel: string;
  /** Label for the encoded side of the conversion. */
  encodedLabel: string;
  encodePlaceholder: string;
  decodePlaceholder: string;
  encode: (input: string) => OperationResult;
  decode: (input: string) => OperationResult;
}

export const ENCODING_CODECS: Record<EncodingType, EncodingCodec> = {
  base64: {
    type: "base64",
    label: "Base64",
    tagline: "Pack 3 bytes into 4 characters over the RFC 4648 alphabet.",
    alphabet: "A–Z a–z 0–9 + / =",
    plainLabel: "Plain text",
    encodedLabel: "Base64 payload",
    encodePlaceholder: "Type a message…",
    decodePlaceholder: "Paste a Base64 payload…",
    encode: encodeBase64,
    decode: decodeBase64,
  },
  base32: {
    type: "base32",
    label: "Base32",
    tagline: "5 bits per character — case-insensitive and free of look-alike glyphs.",
    alphabet: "A–Z 2–7 =",
    plainLabel: "Plain text",
    encodedLabel: "Base32 payload",
    encodePlaceholder: "Type a message…",
    decodePlaceholder: "Paste a Base32 payload…",
    encode: encodeBase32,
    decode: decodeBase32,
  },
  hex: {
    type: "hex",
    label: "Hexadecimal",
    tagline: "Two nibbles per byte — the standard view for raw binary inspection.",
    alphabet: "0–9 a–f",
    plainLabel: "Plain text",
    encodedLabel: "Hex dump",
    encodePlaceholder: "Type a message…",
    decodePlaceholder: "Paste hex bytes, e.g. 48 65 6c 6c 6f…",
    encode: encodeHex,
    decode: decodeHex,
  },
  binary: {
    type: "binary",
    label: "Binary",
    tagline: "One 8-bit octet per byte — the bit-level view LSB hiding operates on.",
    alphabet: "0 1",
    plainLabel: "Plain text",
    encodedLabel: "Bit stream",
    encodePlaceholder: "Type a message…",
    decodePlaceholder: "Paste octets, e.g. 01001000 01101001…",
    encode: encodeBinary,
    decode: decodeBinary,
  },
  url: {
    type: "url",
    label: "URL",
    tagline: "Percent-encode reserved characters so text survives a query string.",
    alphabet: "%XX escapes",
    plainLabel: "Plain text",
    encodedLabel: "Percent-encoded",
    encodePlaceholder: "Type text or a URL fragment…",
    decodePlaceholder: "Paste percent-encoded text…",
    encode: encodeUrl,
    decode: decodeUrl,
  },
  ascii: {
    type: "ascii",
    label: "ASCII",
    tagline: "Decimal character codes — the classic CTF byte-code representation.",
    alphabet: "0–255 decimal",
    plainLabel: "Plain text",
    encodedLabel: "Decimal codes",
    encodePlaceholder: "Type a message…",
    decodePlaceholder: "Paste codes, e.g. 72 101 108 108 111…",
    encode: encodeAscii,
    decode: decodeAscii,
  },
};

/** Ordered list used for static params, hub cards and in-panel navigation. */
export const ENCODING_TYPES = Object.keys(ENCODING_CODECS) as EncodingType[];

export function isEncodingType(value: string): value is EncodingType {
  return value in ENCODING_CODECS;
}

export * from "./base64";
export * from "./base32";
export * from "./hex";
export * from "./binary";
export * from "./url";
export * from "./ascii";
