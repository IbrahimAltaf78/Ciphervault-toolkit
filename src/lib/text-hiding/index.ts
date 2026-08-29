/**
 * Text-hiding registry — the single source of truth for the six techniques.
 *
 * The /text-hiding/[technique] route, the module hub and the tool panel are all
 * driven from this table, so adding a seventh technique means one entry here
 * and one explainer, with no route or UI change.
 */
import type { OperationResult, TextHidingType } from "@/types";
import {
  extractZeroWidth,
  hideZeroWidth,
  revealZeroWidth,
  zeroWidthCapacity,
} from "./zero-width";
import {
  extractWhitespace,
  hideWhitespace,
  revealWhitespace,
  whitespaceCapacity,
} from "./whitespace";
import {
  capitalizationCapacity,
  extractCapitalization,
  hideCapitalization,
} from "./capitalization";
import {
  extractPunctuation,
  hidePunctuation,
  punctuationCapacity,
  revealPunctuation,
} from "./punctuation";
import { extractAcrostic, hideAcrostic } from "./acrostic";
import { extractWordChoice, hideWordChoice, wordChoiceCapacity } from "./word-choice";
import {
  PROSE_COVER,
  PUNCTUATION_COVER,
  SYNONYM_COVER,
} from "./data/sample-covers";

export interface TextHidingTechnique {
  type: TextHidingType;
  /** Display name, e.g. "Zero-Width Unicode". */
  label: string;
  /** One-line summary for the panel header and hub card. */
  tagline: string;
  /** What in the cover text actually carries the bits. */
  carrier: string;
  /**
   * False for acrostic, which generates its own cover rather than borrowing
   * carriers from one you supply.
   */
  needsCover: boolean;
  coverPlaceholder: string;
  secretPlaceholder: string;
  /** True when the output is visually identical to the cover. */
  isInvisible: boolean;
  hide: (secret: string, cover: string) => OperationResult;
  extract: (stego: string) => OperationResult;
  /** Bits this cover can carry; Infinity where carriers are inserted. */
  capacity: (cover: string) => number;
  /**
   * Renders hidden carriers visibly, where the technique leaves the cover
   * looking unchanged. Absent when the change is already on the page.
   */
  reveal?: (text: string) => string;
  /** Worked example the UI offers as a starting point. */
  sampleCover: string;
}

export const TEXT_HIDING_TECHNIQUES: Record<TextHidingType, TextHidingTechnique> = {
  "zero-width": {
    type: "zero-width",
    label: "Zero-Width Unicode",
    tagline: "Interleave invisible U+200B and U+200C code points between the characters.",
    carrier: "invisible code points",
    needsCover: true,
    coverPlaceholder: "Paste any cover text…",
    secretPlaceholder: "Message to conceal…",
    isInvisible: true,
    hide: hideZeroWidth,
    extract: extractZeroWidth,
    capacity: zeroWidthCapacity,
    reveal: revealZeroWidth,
    sampleCover: PROSE_COVER,
  },
  whitespace: {
    type: "whitespace",
    label: "Whitespace",
    tagline: "Single or double spacing between words encodes each bit.",
    carrier: "word gaps",
    needsCover: true,
    coverPlaceholder: "Paste cover text with plenty of words…",
    secretPlaceholder: "Message to conceal…",
    isInvisible: true,
    hide: hideWhitespace,
    extract: extractWhitespace,
    capacity: whitespaceCapacity,
    reveal: revealWhitespace,
    sampleCover: PROSE_COVER,
  },
  capitalization: {
    type: "capitalization",
    label: "Capitalization",
    tagline: "The case of each word's first letter carries one bit.",
    carrier: "word initials",
    needsCover: true,
    coverPlaceholder: "Paste cover text with plenty of words…",
    secretPlaceholder: "Message to conceal…",
    isInvisible: false,
    hide: hideCapitalization,
    extract: extractCapitalization,
    capacity: capitalizationCapacity,
    sampleCover: PROSE_COVER,
  },
  punctuation: {
    type: "punctuation",
    label: "Punctuation",
    tagline: "Swap punctuation for its near-identical Unicode twin, one bit per mark.",
    carrier: "punctuation marks",
    needsCover: true,
    coverPlaceholder: "Paste cover text rich in punctuation…",
    secretPlaceholder: "Short message to conceal…",
    isInvisible: true,
    hide: hidePunctuation,
    extract: extractPunctuation,
    capacity: punctuationCapacity,
    reveal: revealPunctuation,
    sampleCover: PUNCTUATION_COVER,
  },
  acrostic: {
    type: "acrostic",
    label: "Acrostic",
    tagline: "Generate sentences whose first letters spell the secret out.",
    carrier: "sentence initials",
    needsCover: false,
    coverPlaceholder: "",
    secretPlaceholder: "Letters and spaces only, e.g. meet at nine",
    isInvisible: false,
    hide: (secret) => hideAcrostic(secret),
    extract: extractAcrostic,
    capacity: () => Number.POSITIVE_INFINITY,
    sampleCover: "",
  },
  "word-choice": {
    type: "word-choice",
    label: "Word Choice",
    tagline: "Pick between two synonyms — big or large — to encode each bit.",
    carrier: "swappable words",
    needsCover: true,
    coverPlaceholder: "Paste cover text using common words…",
    secretPlaceholder: "Very short message…",
    isInvisible: true,
    hide: hideWordChoice,
    extract: extractWordChoice,
    capacity: wordChoiceCapacity,
    sampleCover: SYNONYM_COVER,
  },
};

/** Ordered list used for static params, hub cards and in-panel navigation. */
export const TEXT_HIDING_TYPES = Object.keys(
  TEXT_HIDING_TECHNIQUES,
) as TextHidingType[];

export function isTextHidingType(value: string): value is TextHidingType {
  return value in TEXT_HIDING_TECHNIQUES;
}

export * from "./bits";
export * from "./zero-width";
export * from "./whitespace";
export * from "./capitalization";
export * from "./punctuation";
export * from "./acrostic";
export * from "./word-choice";
