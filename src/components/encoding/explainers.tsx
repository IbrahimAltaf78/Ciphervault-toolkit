import type { ReactNode } from "react";
import type { EncodingType } from "@/types";

/**
 * "How this works" content for each sub-technique, kept beside the UI so the
 * codec modules in lib/ stay pure logic with no JSX dependency.
 */
export const ENCODING_EXPLAINERS: Record<EncodingType, ReactNode> = {
  base64: (
    <>
      <p>
        Base64 slices the input into 6-bit groups and maps each onto one of 64
        symbols (<code>A–Z</code>, <code>a–z</code>, <code>0–9</code>,{" "}
        <code>+</code>, <code>/</code>). Three bytes of input therefore become
        exactly four characters, growing the payload by about 33%.
      </p>
      <p>
        When the input is not a multiple of 3 bytes, the final group is padded
        with <code>=</code> so the output still lands on a 4-character boundary.
        That padding is what makes a length check a reliable first validation.
      </p>
    </>
  ),
  base32: (
    <>
      <p>
        Base32 takes 5 bits at a time instead of 6, mapping them onto{" "}
        <code>A–Z</code> and <code>2–7</code>. The digits <code>0</code>,{" "}
        <code>1</code> and <code>8</code> are deliberately excluded because they
        are easily confused with <code>O</code>, <code>I</code> and{" "}
        <code>B</code> when read aloud or typed by hand.
      </p>
      <p>
        Five bytes map onto eight characters, so output is padded with{" "}
        <code>=</code> to a multiple of 8. It is bulkier than Base64 — roughly
        60% growth — but case-insensitive, which is why TOTP secrets and onion
        addresses use it.
      </p>
    </>
  ),
  hex: (
    <>
      <p>
        Hexadecimal splits each byte into two 4-bit nibbles and prints each as a
        digit from <code>0–9a–f</code>. The mapping is direct and positional, so
        byte <var>n</var> of the input is always characters <code>2n</code> and{" "}
        <code>2n+1</code> of the output — which is why hex dumps line up in
        columns and Base64 does not.
      </p>
      <p>
        The cost is size: every byte becomes two characters, doubling the
        payload. The benefit is that a single byte can be read off by eye,
        making it the default for hashes, keys and memory inspection.
      </p>
    </>
  ),
  binary: (
    <>
      <p>
        Binary prints all 8 bits of every byte, most significant bit first. It
        is the widest possible representation — eight characters per byte — and
        exists to make bit-level structure visible rather than to save space.
      </p>
      <p>
        This is the view LSB steganography operates on: hiding a payload in an
        image means writing these bits, one at a time, into the last bit of each
        colour channel.
      </p>
    </>
  ),
  url: (
    <>
      <p>
        Percent-encoding replaces any character that has a reserved meaning in a
        URL with a <code>%</code> followed by its byte value in hex — a space
        becomes <code>%20</code>, an ampersand becomes <code>%26</code>.
        Multi-byte UTF-8 characters produce one escape per byte.
      </p>
      <p>
        This tool uses <code>encodeURIComponent</code> semantics, which also
        escapes the delimiters <code>&amp;</code>, <code>=</code>,{" "}
        <code>?</code> and <code>/</code>. That makes the output safe to drop
        into a single query parameter without it being reinterpreted as
        structure.
      </p>
    </>
  ),
  ascii: (
    <>
      <p>
        Each byte is printed as its decimal value, so <code>H</code> becomes{" "}
        <code>72</code> and <code>i</code> becomes <code>105</code>. It carries
        no compression or obfuscation — it is a readable numeric view of the
        same bytes, and a staple of CTF puzzle chains.
      </p>
      <p>
        Text is bridged through UTF-8 first, so plain English stays inside the
        classic <code>0–127</code> ASCII range while accented characters and
        emoji appear as several values above <code>127</code> — the individual
        bytes of one multi-byte character.
      </p>
    </>
  ),
};
