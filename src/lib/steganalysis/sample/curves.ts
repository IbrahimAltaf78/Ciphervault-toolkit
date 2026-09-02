/**
 * Distribution generators for the sample reports.
 *
 * The sample histograms are generated rather than hand-written so they carry
 * the real signature an analyst looks for, instead of arbitrary numbers that
 * merely fill a chart.
 */
import type { ChannelHistogram } from "../types";

/** Smooth unimodal curve, standing in for a natural image channel. */
export function naturalCurve(center: number, spread: number, peak: number): number[] {
  return Array.from({ length: 256 }, (_, value) => {
    const distance = (value - center) / spread;
    return Math.round(peak * Math.exp(-0.5 * distance * distance));
  });
}

/**
 * Pulls each adjacent value pair toward its mean.
 *
 * This is what LSB embedding does to a histogram. `strength` 0 leaves the curve
 * alone; 1 makes every pair (2i, 2i+1) exactly equal, which is the flattened
 * stair-step a saturated low bit plane produces.
 */
export function flattenPairs(bins: number[], strength: number): number[] {
  const out = [...bins];
  for (let i = 0; i < 256; i += 2) {
    const mean = (out[i] + out[i + 1]) / 2;
    out[i] = Math.round(out[i] + (mean - out[i]) * strength);
    out[i + 1] = Math.round(out[i + 1] + (mean - out[i + 1]) * strength);
  }
  return out;
}

/** Counts samples by the parity of their value, which is their low bit. */
export function lsbCounts(bins: number[]): { zeros: number; ones: number } {
  let zeros = 0;
  let ones = 0;
  bins.forEach((count, value) => {
    if (value % 2 === 0) zeros += count;
    else ones += count;
  });
  return { zeros, ones };
}

/** Builds one channel at a given embedding strength. */
export function buildChannel(
  name: string,
  center: number,
  spread: number,
  peak: number,
  strength: number,
): ChannelHistogram {
  const bins = flattenPairs(naturalCurve(center, spread, peak), strength);
  return { channel: name, bins, lsb: lsbCounts(bins) };
}
