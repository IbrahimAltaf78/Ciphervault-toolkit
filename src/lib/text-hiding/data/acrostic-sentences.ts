/**
 * Sentence bank for the acrostic generator — three neutral, office-flavoured
 * openers per letter. Rotating between them keeps a repeated letter from
 * producing an obviously duplicated line.
 */
export const ACROSTIC_SENTENCES: Record<string, readonly string[]> = {
  a: [
    "Analysts reviewed the quarterly figures before lunch.",
    "After the meeting the team drafted a short summary.",
    "Almost everyone agreed the plan needed revision.",
  ],
  b: [
    "Bright sunlight filled the conference room.",
    "Before leaving she checked the schedule twice.",
    "Both proposals arrived on the same afternoon.",
  ],
  c: [
    "Clouds gathered over the harbour that evening.",
    "Careful planning saved the project several weeks.",
    "Colleagues shared their notes after the session.",
  ],
  d: [
    "Deadlines shifted once the client responded.",
    "During the break we discussed the results.",
    "Drafts circulated among the reviewers overnight.",
  ],
  e: [
    "Everyone arrived earlier than expected.",
    "Editors trimmed the report down to ten pages.",
    "Every detail was checked before submission.",
  ],
  f: [
    "Feedback arrived from three different teams.",
    "Following the update the system ran smoothly.",
    "Fresh coffee kept the meeting going.",
  ],
  g: [
    "Given the delay we rescheduled the review.",
    "Gradually the room emptied after the talk.",
    "Good notes made the summary straightforward.",
  ],
  h: [
    "However the results told a different story.",
    "Half the team joined the call remotely.",
    "Historical data supported the conclusion.",
  ],
  i: [
    "Initial tests returned promising numbers.",
    "In the morning the servers were restarted.",
    "Interest in the topic grew steadily.",
  ],
  j: [
    "January brought a wave of new requests.",
    "Just before noon the report was filed.",
    "Joint reviews caught several small errors.",
  ],
  k: [
    "Keeping records simple saved everyone time.",
    "Known issues were listed in the appendix.",
    "Key findings appeared on the second page.",
  ],
  l: [
    "Later that week the numbers were confirmed.",
    "Local teams handled the rollout smoothly.",
    "Long discussions produced a short summary.",
  ],
  m: [
    "Most of the feedback was constructive.",
    "Meetings ran shorter than usual this month.",
    "Members of the group volunteered quickly.",
  ],
  n: [
    "Nobody objected to the revised timeline.",
    "New documentation went live on Friday.",
    "Notes from the session were shared widely.",
  ],
  o: [
    "Once the data loaded the pattern was clear.",
    "Overall the response was positive.",
    "Older records required manual checking.",
  ],
  p: [
    "Progress slowed during the holiday period.",
    "Participants received the agenda in advance.",
    "Preliminary results looked encouraging.",
  ],
  q: [
    "Quietly the team finished ahead of schedule.",
    "Questions were collected before the panel began.",
    "Quarterly reviews kept everyone aligned.",
  ],
  r: [
    "Reports were filed by the end of the day.",
    "Recent changes improved response times.",
    "Reviewers requested a second draft.",
  ],
  s: [
    "Several people asked for clarification.",
    "Support tickets dropped after the fix.",
    "Summaries were circulated the same evening.",
  ],
  t: [
    "The final version shipped on Thursday.",
    "Two reviewers signed off on the change.",
    "Testing uncovered a minor formatting issue.",
  ],
  u: [
    "Until the audit finished nothing was published.",
    "Updates arrived faster than anticipated.",
    "Users reported no further problems.",
  ],
  v: [
    "Various drafts were compared side by side.",
    "Volunteers helped organise the archive.",
    "Version notes explained each adjustment.",
  ],
  w: [
    "We reviewed the figures one last time.",
    "Widespread agreement made the vote quick.",
    "Weekly summaries kept the record current.",
  ],
  x: [
    "X-rays of the component revealed no cracks.",
    "Xenon lamps lit the testing bay overnight.",
    "X marks the section that needs revision.",
  ],
  y: [
    "Yesterday the archive was finally indexed.",
    "Younger members led the second session.",
    "Year-end totals matched the projection.",
  ],
  z: [
    "Zero defects were found in the final pass.",
    "Zones were assigned before the survey began.",
    "Zoning rules delayed the announcement.",
  ],
};
