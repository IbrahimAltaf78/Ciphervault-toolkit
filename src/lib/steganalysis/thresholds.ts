/**
 * Threat banding policy.
 *
 * Kept apart from the report shape because it is a decision, not a structure.
 * Where the line sits between "elevated" and "high" is a tuning question the
 * engine and the dashboard have to answer identically, and burying it among the
 * type declarations makes it easy to fork the two by accident.
 */
import type { ThreatLevel } from "./types";

/** Mirrored by the engine so a score is labelled the same on both sides. */
export function threatFromProbability(probability: number): ThreatLevel {
  if (probability < 0.2) return "clean";
  if (probability < 0.4) return "low";
  if (probability < 0.6) return "elevated";
  if (probability < 0.8) return "high";
  return "critical";
}

export const THREAT_COPY: Record<ThreatLevel, { label: string; blurb: string }> = {
  clean: {
    label: "Clean",
    blurb: "No statistical evidence of embedding.",
  },
  low: {
    label: "Low",
    blurb: "Minor irregularities, most likely from normal encoding.",
  },
  elevated: {
    label: "Elevated",
    blurb: "Several tests disagree with the expected distribution.",
  },
  high: {
    label: "High",
    blurb: "Strong statistical indication of a hidden payload.",
  },
  critical: {
    label: "Critical",
    blurb: "Multiple tests agree that a payload is present.",
  },
};
