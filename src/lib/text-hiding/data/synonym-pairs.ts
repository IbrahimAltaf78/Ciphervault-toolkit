/**
 * Synonym table for word-choice hiding.
 *
 * Each pair must be interchangeable in the same grammatical slot, so swapping
 * one for the other never breaks the sentence: [ bit 0 word, bit 1 word ].
 */
export const SYNONYM_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["big", "large"],
  ["small", "little"],
  ["fast", "quick"],
  ["begin", "start"],
  ["buy", "purchase"],
  ["help", "assist"],
  ["show", "display"],
  ["near", "close"],
  ["end", "finish"],
  ["keep", "retain"],
  ["need", "require"],
  ["make", "create"],
  ["tell", "inform"],
  ["ask", "request"],
  ["hard", "difficult"],
  ["smart", "clever"],
  ["happy", "glad"],
  ["strange", "odd"],
  ["answer", "reply"],
  ["choose", "select"],
  ["fix", "repair"],
  ["hide", "conceal"],
  ["idea", "notion"],
  ["job", "task"],
  ["main", "primary"],
  ["often", "frequently"],
  ["quiet", "silent"],
  ["rich", "wealthy"],
  ["whole", "entire"],
  ["wrong", "incorrect"],
  ["brave", "bold"],
  ["calm", "peaceful"],
  ["danger", "peril"],
  ["empty", "vacant"],
  ["famous", "renowned"],
];
