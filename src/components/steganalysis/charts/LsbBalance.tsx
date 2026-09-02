"use client";

import type { ChannelHistogram } from "@/lib/steganalysis/types";
import { SERIES_PRIMARY, SERIES_SECONDARY } from "./palette";

const SERIES = [
  { label: "LSB = 0", color: SERIES_PRIMARY },
  { label: "LSB = 1", color: SERIES_SECONDARY },
] as const;

/** Within a point of even is the signature of a saturated low bit plane. */
const EVEN_TOLERANCE = 1;

/**
 * Zeros against ones per channel, as a share of samples.
 *
 * Shows magnitude rather than shape, and it is the faster read of the two
 * charts: a natural channel sits away from an even split, so every channel
 * landing on 50/50 is the tell.
 */
export function LsbBalance({ histograms }: { histograms: ChannelHistogram[] }) {
  return (
    <figure className="space-y-3">
      <figcaption className="flex flex-wrap items-center justify-between gap-3">
        <span className="cv-label">Low bit balance</span>
        {/* A legend is always present for two series. */}
        <span className="flex items-center gap-4">
          {SERIES.map((series) => (
            <span key={series.label} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: series.color }}
              />
              <span className="cv-label normal-case tracking-normal">{series.label}</span>
            </span>
          ))}
        </span>
      </figcaption>

      <div className="space-y-2.5">
        {histograms.map((histogram) => {
          const total = histogram.lsb.zeros + histogram.lsb.ones || 1;
          const zeroShare = (histogram.lsb.zeros / total) * 100;
          const isEven = Math.abs(zeroShare - 50) < EVEN_TOLERANCE;

          return (
            <div key={histogram.channel} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="cv-label normal-case tracking-normal">
                  {histogram.channel}
                </span>
                {/* Direct labels, so the split is readable without the bar. */}
                <span
                  className={`cv-label normal-case tracking-normal ${
                    isEven ? "text-amber-400" : ""
                  }`}
                >
                  {zeroShare.toFixed(1)}% / {(100 - zeroShare).toFixed(1)}%
                  {isEven && " — even"}
                </span>
              </div>

              {/* 2px surface gap between the two fills. */}
              <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded">
                <span
                  className="rounded-l-sm"
                  style={{ width: `${zeroShare}%`, backgroundColor: SERIES_PRIMARY }}
                />
                <span
                  className="flex-1 rounded-r-sm"
                  style={{ backgroundColor: SERIES_SECONDARY }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="cv-label normal-case tracking-normal">
        A natural channel sits away from an even split. Every channel landing on
        50/50 means the low bit plane has been overwritten.
      </p>
    </figure>
  );
}

export default LsbBalance;
