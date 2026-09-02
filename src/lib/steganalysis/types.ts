/**
 * Steganalysis report contract.
 *
 * This file is the interface between the detection engine and the dashboard. The
 * analysis itself is server-side — pixel and sample statistics over a whole file
 * are not work for the main thread — so everything the UI renders arrives in this
 * shape. Treat it as the API specification for POST /api/steganalysis/analyze.
 */

/** What the dropzone accepted. */
export type SuspectKind = "image" | "audio";

/**
 * Colour-coded verdict band. Derived from `probability` by the engine so that
 * the threshold policy lives in one place rather than being re-guessed by every
 * client that renders a report.
 */
export type ThreatLevel = "clean" | "low" | "elevated" | "high" | "critical";

/** Severity of a single flagged metadata finding. */
export type AnomalySeverity = "info" | "warning" | "critical";

/**
 * One statistical test and what it found.
 *
 * Scores are reported per test rather than only in aggregate, because the tests
 * disagree in informative ways — chi-square catches sequential LSB embedding but
 * misses randomised embedding, which RS analysis picks up.
 */
export interface DetectionTest {
  id: string;
  label: string;
  /** One line on what the test looks for. */
  description: string;
  /** 0–1: how strongly this test alone indicates embedding. */
  score: number;
  /** The measured statistic, formatted for display (e.g. "p = 0.9993"). */
  measurement: string;
}

/**
 * Distribution data for one channel.
 *
 * `bins` is the full 256-value histogram: LSB embedding flattens the difference
 * between each adjacent pair (2i, 2i+1), which is visible as a stair-stepped
 * profile. `lsb` is the direct count — a ratio near 50/50 across every channel
 * is the strongest single visual tell.
 */
export interface ChannelHistogram {
  /** "Red" | "Green" | "Blue" for images, "Amplitude" for audio. */
  channel: string;
  /** Exactly 256 counts; index is the sample value. */
  bins: number[];
  lsb: { zeros: number; ones: number };
}

/** A metadata field that looks wrong, appended, or inconsistent. */
export interface MetadataAnomaly {
  id: string;
  label: string;
  detail: string;
  severity: AnomalySeverity;
  /** The offending field or offset, when there is one. */
  field?: string;
}

export interface SuspectFile {
  name: string;
  kind: SuspectKind;
  sizeBytes: number;
  mimeType: string;
  /** Images only. */
  dimensions?: { width: number; height: number };
  /** Audio only. */
  durationMs?: number;
}

export interface AnalysisReport {
  file: SuspectFile;
  /** ISO timestamp from the engine. */
  analyzedAt: string;
  /** 0–1 aggregate likelihood that the file carries a payload. */
  probability: number;
  threatLevel: ThreatLevel;
  /** One-sentence verdict in plain language. */
  summary: string;
  /** Engine estimate of payload size, or null when it cannot tell. */
  estimatedPayloadBytes: number | null;
  tests: DetectionTest[];
  histograms: ChannelHistogram[];
  anomalies: MetadataAnomaly[];
  /**
   * True when the report is illustrative rather than the result of a real scan.
   * The dashboard badges these prominently — a detection tool that cannot be
   * told apart from a demo is worse than no tool.
   */
  isSample?: boolean;
}
