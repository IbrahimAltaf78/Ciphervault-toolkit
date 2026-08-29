import type { ReactNode } from "react";
import type { TextHidingType } from "@/types";

/**
 * "How this works" content for each technique, kept beside the UI so the
 * modules in lib/ stay pure logic with no JSX dependency.
 */
export const TEXT_HIDING_EXPLAINERS: Record<TextHidingType, ReactNode> = {
  "zero-width": (
    <>
      <p>
        Your message is converted to UTF-8 bytes and then to bits. Each bit
        becomes an invisible code point slipped between the characters of the
        cover: <code>U+200B</code> zero width space for 0,{" "}
        <code>U+200C</code> zero width non-joiner for 1.
      </p>
      <p>
        Both render as nothing at all, so the cover text is byte-for-byte
        unchanged to a reader while carrying the payload between its letters.
        This is the only technique here with unlimited capacity — the carriers
        are inserted rather than borrowed from something the cover already has.
      </p>
      <p>
        It is also the easiest to detect: stripping characters in the{" "}
        <code>U+200B–200F</code> range destroys the payload completely, and a
        hex view makes the extra bytes obvious.
      </p>
    </>
  ),
  whitespace: (
    <>
      <p>
        Every gap between two words carries one bit — a single space is 0, a
        double space is 1. The words themselves, their punctuation and the line
        breaks are left exactly as written.
      </p>
      <p>
        Capacity is therefore one bit per word gap, so a message of{" "}
        <var>n</var> characters needs roughly <var>8n + 8</var> words of cover.
        That is why the sample text is long: short covers simply cannot hold
        much.
      </p>
      <p>
        It survives copy and paste through most plain-text channels, but any
        system that collapses runs of whitespace — HTML rendering, a Markdown
        pipeline, a code formatter — silently erases the entire message.
      </p>
    </>
  ),
  capitalization: (
    <>
      <p>
        The first letter of each word carries one bit: uppercase is 1,
        lowercase is 0. The letters never change, only their case, so the text
        still reads correctly and passes a spell check.
      </p>
      <p>
        Words starting with a caseless character — a digit, a symbol, a CJK
        glyph — are skipped by both sides, so the carrier sequence stays
        identical when hiding and extracting.
      </p>
      <p>
        The trade-off is visibility: erratic capitalisation is obvious to a
        human reader, which makes this the least subtle of the six even though
        the text remains perfectly legible.
      </p>
    </>
  ),
  punctuation: (
    <>
      <p>
        Several punctuation marks have a Unicode twin that renders almost
        identically. The semicolon <code>;</code> and the Greek question mark{" "}
        <code>U+037E</code> are the clearest case — they are different
        characters that look the same in nearly every font.
      </p>
      <p>
        Each mark in the cover therefore carries one bit: the plain ASCII form
        is 0, the twin is 1. Six pairs are used, covering apostrophes, quotes,
        hyphens, semicolons, colons and exclamation marks.
      </p>
      <p>
        Capacity is low — one bit per punctuation mark — so this suits short
        signals rather than payloads. It is invisible to the eye but trivial to
        spot in a hex dump, since the twins are multi-byte.
      </p>
    </>
  ),
  acrostic: (
    <>
      <p>
        Rather than borrowing carriers from a cover you supply, this technique
        generates one. It emits a sentence per letter of your secret, chosen so
        the sentence begins with that letter, and groups the sentences into a
        paragraph per word.
      </p>
      <p>
        Because sentences always start capitalised, an acrostic carries letters
        only — case, digits and punctuation are lost. It is the oldest technique
        here by centuries, and the only one that survives being read aloud,
        retyped or printed.
      </p>
      <p>
        It is also the only one with no length header: the carrier is the
        visible sentence structure, so there is nowhere to hide a frame.
        Extraction returns the initials of whatever you give it, which means
        judging whether a message is really there is your call, not the
        tool&rsquo;s.
      </p>
    </>
  ),
  "word-choice": (
    <>
      <p>
        Wherever the cover uses a word that has a listed synonym, the choice
        between the two carries one bit — <code>big</code> is 0,{" "}
        <code>large</code> is 1. Thirty-five interchangeable pairs are used.
      </p>
      <p>
        This is the subtlest technique of the six. There is no formatting
        anomaly to notice, no invisible character to strip and no odd
        capitalisation: the output is ordinary prose that differs from the
        original only in word selection.
      </p>
      <p>
        The cost is the lowest capacity here — one bit per matched word — and a
        dependence on the cover&rsquo;s vocabulary. Rewriting a single sentence in
        your own words destroys the payload.
      </p>
    </>
  ),
};
