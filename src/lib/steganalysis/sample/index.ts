/**
 * Illustrative reports, for building and reviewing the dashboard before the
 * detection engine exists.
 *
 * Every report here carries `isSample: true`, and the dashboard renders a
 * persistent banner for it. A detection tool whose demo output is
 * indistinguishable from a real verdict is actively dangerous, so the flag is
 * not optional and is never stripped.
 */
import type { AnalysisReport } from "../types";
import { buildChannel } from "./curves";

/** A file carrying an obvious sequential LSB payload. */
export function sampleEmbeddedReport(): AnalysisReport {
  return {
    file: {
      name: "sample-carrier.png",
      kind: "image",
      sizeBytes: 1_482_240,
      mimeType: "image/png",
      dimensions: { width: 800, height: 600 },
    },
    analyzedAt: new Date().toISOString(),
    probability: 0.94,
    threatLevel: "critical",
    summary:
      "Chi-square and RS analysis both indicate a payload occupying most of the LSB plane, concentrated in the first two thirds of the image.",
    estimatedPayloadBytes: 41_300,
    tests: [
      {
        id: "chi-square",
        label: "Chi-square attack",
        description: "Compares adjacent value pairs against the distribution expected of untouched pixels.",
        score: 0.96,
        measurement: "p = 0.9993",
      },
      {
        id: "rs-analysis",
        label: "RS analysis",
        description: "Measures how groups of pixels respond to a flipping mask; embedding disturbs the ratio.",
        score: 0.91,
        measurement: "estimated 0.78 bpp",
      },
      {
        id: "sample-pairs",
        label: "Sample pairs",
        description: "Estimates embedding rate from transitions between neighbouring sample values.",
        score: 0.88,
        measurement: "rate 0.74",
      },
      {
        id: "lsb-entropy",
        label: "LSB plane entropy",
        description: "A natural low bit plane is noisy but structured; a payload pushes it toward pure randomness.",
        score: 0.83,
        measurement: "7.98 / 8.00 bits",
      },
    ],
    histograms: [
      buildChannel("Red", 118, 46, 9800, 0.92),
      buildChannel("Green", 126, 52, 10400, 0.9),
      buildChannel("Blue", 108, 44, 9100, 0.94),
    ],
    anomalies: [
      {
        id: "trailing-bytes",
        label: "Data appended after IEND",
        detail: "4,096 bytes follow the PNG end-of-stream marker. Decoders ignore this region entirely.",
        severity: "critical",
        field: "offset 0x16A4C0",
      },
      {
        id: "software-tag",
        label: "Software tag rewritten",
        detail: "tEXt chunk names a tool inconsistent with the camera EXIF block.",
        severity: "warning",
        field: "tEXt:Software",
      },
      {
        id: "timestamp-skew",
        label: "Modification precedes creation",
        detail: "The file mtime is 3 hours earlier than the embedded capture timestamp.",
        severity: "warning",
        field: "tIME",
      },
      {
        id: "colour-profile",
        label: "No colour profile",
        detail: "Common in re-encoded files; on its own not evidence of anything.",
        severity: "info",
      },
    ],
    isSample: true,
  };
}

/** A file with nothing hidden in it, for comparison. */
export function sampleCleanReport(): AnalysisReport {
  return {
    file: {
      name: "sample-original.png",
      kind: "image",
      sizeBytes: 1_310_720,
      mimeType: "image/png",
      dimensions: { width: 800, height: 600 },
    },
    analyzedAt: new Date().toISOString(),
    probability: 0.07,
    threatLevel: "clean",
    summary:
      "Value pairs follow the distribution expected of an untouched image, and no test disagrees.",
    estimatedPayloadBytes: null,
    tests: [
      {
        id: "chi-square",
        label: "Chi-square attack",
        description: "Compares adjacent value pairs against the distribution expected of untouched pixels.",
        score: 0.04,
        measurement: "p = 0.0002",
      },
      {
        id: "rs-analysis",
        label: "RS analysis",
        description: "Measures how groups of pixels respond to a flipping mask; embedding disturbs the ratio.",
        score: 0.08,
        measurement: "estimated 0.01 bpp",
      },
      {
        id: "sample-pairs",
        label: "Sample pairs",
        description: "Estimates embedding rate from transitions between neighbouring sample values.",
        score: 0.06,
        measurement: "rate 0.02",
      },
      {
        id: "lsb-entropy",
        label: "LSB plane entropy",
        description: "A natural low bit plane is noisy but structured; a payload pushes it toward pure randomness.",
        score: 0.11,
        measurement: "7.41 / 8.00 bits",
      },
    ],
    histograms: [
      buildChannel("Red", 118, 46, 9800, 0),
      buildChannel("Green", 126, 52, 10400, 0),
      buildChannel("Blue", 108, 44, 9100, 0),
    ],
    anomalies: [
      {
        id: "colour-profile",
        label: "sRGB profile present",
        detail: "Matches the encoder named in the metadata.",
        severity: "info",
      },
    ],
    isSample: true,
  };
}
