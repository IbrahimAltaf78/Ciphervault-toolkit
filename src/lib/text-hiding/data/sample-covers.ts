/**
 * Worked cover texts offered as a starting point in each tool.
 *
 * These techniques borrow their carriers from features the cover already has,
 * so capacity is set by the cover, not the algorithm. Each sample is written to
 * be dense in whatever its technique actually consumes — word gaps, word
 * initials, punctuation marks or swappable words — and each technique gets a
 * different passage, so switching tools does not look like nothing changed.
 */

/** Zero-width: capacity is unbounded, so a short realistic note is enough. */
export const ZERO_WIDTH_COVER = [
  "Thanks for sending the draft over so quickly. I read it on the train this",
  "morning and I think it holds together well. The middle section is the one",
  "I would look at again, mostly because the argument arrives before the",
  "evidence does. Happy to talk it through on Monday if that suits you.",
].join(" ");

/** Whitespace: long, because capacity is one bit per word gap. */
export const WHITESPACE_COVER = [
  "The winter timetable comes into effect on the first of next month and a few",
  "services are moving by ten or fifteen minutes. Most passengers will not",
  "notice the difference, but anyone connecting at the junction should check",
  "the new departure boards before travelling, since two of the later evening",
  "connections now leave from a different platform. Printed copies of the",
  "revised timetable are available at every staffed ticket office, and the same",
  "information is on the notice boards at the far end of each concourse.",
  "Engineering work continues on the northern line for another three weekends,",
  "so replacement buses will run between the two terminus stations on those",
  "days. Journey times are roughly twenty minutes longer than usual, which is",
  "worth allowing for if you are catching an onward service. Staff will be on",
  "hand at both ends to point people towards the right stop, and the usual",
  "ticket conditions apply throughout the period of the works.",
].join(" ");

/** Capitalization: long, because capacity is one bit per word initial. */
export const CAPITALIZATION_COVER = [
  "The reading room reopens on Tuesday after the shelving work finishes, and",
  "the reference collection has moved to the gallery on the upper floor. Most",
  "of the older bound volumes are now stored off site, so anything published",
  "before nineteen sixty needs to be requested a day in advance through the",
  "catalogue. Requests placed before four in the afternoon are usually",
  "available the following morning, and the desk will send a message when an",
  "item arrives. The microfilm readers have been serviced and both machines",
  "are working again, though the older one still needs a firm hand to load a",
  "reel properly. Anyone who has not used them before should ask at the desk",
  "rather than guessing, since the film is easy to crease. Quiet study spaces",
  "remain on the ground floor and the group rooms can be booked by the hour.",
].join(" ");

/** Punctuation: dense in apostrophes, quotes, hyphens, semicolons and colons. */
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

/** Word-choice: written around the synonym pair table. */
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
