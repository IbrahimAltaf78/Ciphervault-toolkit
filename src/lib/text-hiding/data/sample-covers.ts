/**
 * Worked cover texts offered as a starting point in each tool.
 *
 * These techniques borrow their carriers from features the cover already has,
 * so capacity is set by the cover, not the algorithm. Each sample is written to
 * be dense in whatever the technique actually consumes — word gaps, punctuation
 * marks or swappable words — so a first-time user can hide a short message
 * without hunting for suitable text.
 */

/** General prose: long, so it offers plenty of gaps and word initials. */
export const PROSE_COVER = [
  "The quarterly review has been moved to Thursday morning, and the agenda is",
  "now circulating with the meeting notes attached. Please bring a printed copy",
  "of the summary so we can work through the figures together rather than",
  "reading them off a shared screen. The finance team has asked for questions in",
  "advance, which gives everyone a little more time to prepare something useful.",
  "Last quarter the discussion ran long because half the room was seeing the",
  "numbers for the first time, and nobody wants to repeat that experience.",
  "If you cannot attend in person, the call details are at the bottom of the",
  "invitation and a recording will be posted the same afternoon. Anyone who",
  "needs the underlying spreadsheet should ask before Wednesday, since access",
  "requests take a day to clear. We will close with a short planning segment",
  "covering the next two months, so it is worth glancing at the roadmap first.",
].join(" ");

/** Punctuation-dense: apostrophes, quotes, hyphens, semicolons, colons. */
export const PUNCTUATION_COVER = [
  `Well - that's the plan; we ship on Friday!`,
  `The client's notes were blunt: "keep it simple; don't over-think it!"`,
  `Here's the short version: we freeze the branch; we re-test the edge-cases;`,
  `we sign off. It's not glamorous - it's just careful!`,
  `Marta's review flagged three things: naming; spacing; error-handling.`,
  `She wrote: "the first two are cosmetic - the third isn't!"`,
  `So: fix the third one first; the rest can wait. Don't panic!`,
  `Jae's follow-up said much the same: "ship it; iterate later!"`,
].join(" ");

/** Synonym-dense: written around the word-choice pair table. */
export const SYNONYM_COVER = [
  "We need to begin the big handover early, so please help the new starter",
  "choose a quiet desk near the window and show them where the main files",
  "are kept. It is not a hard task, but it is often the small details that",
  "make people happy: tell them how to fix the printer, ask whether they",
  "need a large monitor, and keep the whole tour under an hour.",
  "The clever part is to end before they get tired. If anything looks wrong,",
  "answer it on the spot rather than leaving a strange gap in their first day.",
  "A calm start is worth more than a fast one, and the whole team benefits.",
  "Show them the empty meeting room, tell them the job is a marathon, and",
  "help them begin to feel at home. We often forget how odd a new office is;",
  "a little help makes the difference, and a smart welcome is never wasted.",
  "Ask what they need, keep the pace slow, and finish with a quick coffee.",
].join(" ");
