/**
 * Everything the command palette can reach.
 *
 * Written out rather than derived from the filesystem, because the palette
 * needs more than a path: a human name, the module it belongs to, and the words
 * someone would actually type to find it. "Base64" is a route; "b64" and
 * "encode" are what a person searches.
 */

export interface Command {
  /** What the row reads as. */
  label: string;
  /** Module heading the row is grouped under. */
  group: string;
  href: string;
  /** Extra search terms that do not appear in the label. */
  keywords?: string;
}

export const COMMANDS: Command[] = [
  { label: "Suite overview", group: "General", href: "/", keywords: "home landing start" },

  // Cryptography
  { label: "AES", group: "Cryptography", href: "/cryptography/symmetric/aes", keywords: "symmetric gcm cbc ctr encrypt 256" },
  { label: "DES", group: "Cryptography", href: "/cryptography/symmetric/des", keywords: "symmetric legacy feistel" },
  { label: "Triple DES", group: "Cryptography", href: "/cryptography/symmetric/3des", keywords: "3des ede symmetric" },
  { label: "RSA", group: "Cryptography", href: "/cryptography/asymmetric/rsa", keywords: "asymmetric oaep public key" },
  { label: "ECC", group: "Cryptography", href: "/cryptography/asymmetric/ecc", keywords: "elliptic curve ecdh ecies p-256" },
  { label: "SHA-2", group: "Cryptography", href: "/cryptography/hashing/sha256", keywords: "sha256 sha512 hash digest" },
  { label: "SHA-3", group: "Cryptography", href: "/cryptography/hashing/sha3", keywords: "keccak hash digest" },
  { label: "Hybrid encryption", group: "Cryptography", href: "/cryptography/hybrid", keywords: "rsa aes envelope tls pgp" },
  { label: "All cryptography tools", group: "Cryptography", href: "/cryptography", keywords: "hub index" },

  // Encoding
  { label: "Base64", group: "Encoding", href: "/encoding/base64", keywords: "b64 encode decode" },
  { label: "Base32", group: "Encoding", href: "/encoding/base32", keywords: "b32 rfc4648" },
  { label: "Hexadecimal", group: "Encoding", href: "/encoding/hex", keywords: "hex dump bytes" },
  { label: "Binary", group: "Encoding", href: "/encoding/binary", keywords: "bits octets 01" },
  { label: "URL encoding", group: "Encoding", href: "/encoding/url", keywords: "percent escape query" },
  { label: "ASCII", group: "Encoding", href: "/encoding/ascii", keywords: "decimal codes charcode" },
  { label: "All encoders", group: "Encoding", href: "/encoding", keywords: "hub index" },

  // Text hiding
  { label: "Zero-width Unicode", group: "Text hiding", href: "/text-hiding/zero-width", keywords: "invisible u+200b carrier" },
  { label: "Whitespace", group: "Text hiding", href: "/text-hiding/whitespace", keywords: "spaces gaps" },
  { label: "Capitalization", group: "Text hiding", href: "/text-hiding/capitalization", keywords: "case letters" },
  { label: "Punctuation", group: "Text hiding", href: "/text-hiding/punctuation", keywords: "homoglyph marks" },
  { label: "Acrostic", group: "Text hiding", href: "/text-hiding/acrostic", keywords: "first letters sentences" },
  { label: "Word choice", group: "Text hiding", href: "/text-hiding/word-choice", keywords: "synonym swap" },
  { label: "All text techniques", group: "Text hiding", href: "/text-hiding", keywords: "hub index" },

  // Steganography
  { label: "Image — LSB", group: "Steganography", href: "/stego/image/lsb", keywords: "least significant bit png pixel" },
  { label: "Image — DCT / DWT", group: "Steganography", href: "/stego/image/dct-dwt", keywords: "frequency domain jpeg transform" },
  { label: "Audio", group: "Steganography", href: "/stego/audio", keywords: "wav sample waveform" },
  { label: "Video", group: "Steganography", href: "/stego/video", keywords: "mp4 avi frames" },
  { label: "All stego tools", group: "Steganography", href: "/stego", keywords: "hub index hide" },

  // Forensics and watermarking
  { label: "Steganalysis", group: "Forensics", href: "/steganalysis", keywords: "detect chi-square rs analysis histogram" },
  { label: "Visible watermark", group: "Watermarking", href: "/watermark/visible", keywords: "overlay logo" },
  { label: "Invisible watermark", group: "Watermarking", href: "/watermark/invisible", keywords: "lsb hidden mark" },
  { label: "Robust watermark", group: "Watermarking", href: "/watermark/robust", keywords: "durable survive" },
  { label: "Fragile watermark", group: "Watermarking", href: "/watermark/fragile", keywords: "tamper detection" },
  { label: "All watermarking", group: "Watermarking", href: "/watermark", keywords: "hub index copyright" },
];

/**
 * Ranks commands against a query.
 *
 * A label match outranks a keyword match, and a match at the start of the label
 * outranks one in the middle — so typing "as" puts AES above "All stego tools",
 * which is what someone reaching for AES expects.
 */
export function searchCommands(query: string): Command[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return COMMANDS;

  return COMMANDS.map((command) => {
    const label = command.label.toLowerCase();
    const haystack = `${label} ${command.group.toLowerCase()} ${command.keywords ?? ""}`;

    let score = -1;
    if (label.startsWith(needle)) score = 3;
    else if (label.includes(needle)) score = 2;
    else if (haystack.includes(needle)) score = 1;

    return { command, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.command);
}
