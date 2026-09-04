import type { ChannelHistogram } from "@/lib/steganalysis/types";
import { LsbBalance } from "./LsbBalance";
import { ValueProfile } from "./ValueProfile";
import { HistogramTable } from "./HistogramTable";

/**
 * The LSB distribution section.
 *
 * Composes two views that answer different questions — balance for magnitude,
 * the per-channel profiles for shape — plus the table fallback. Small multiples
 * rather than one overlaid chart, so no channel is ever hidden behind another.
 */
export function LsbHistogram({ histograms }: { histograms: ChannelHistogram[] }) {
  if (histograms.length === 0) return null;

  return (
    <section className="space-y-6 rounded-xl border border-edge bg-background/40 p-5">
      <div className="space-y-1">
        <h3 className="font-medium tracking-tight">LSB distribution</h3>
        <p className="text-muted">
          Sample values across each channel, and how the low bit divides.
        </p>
      </div>

      <LsbBalance histograms={histograms} />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {histograms.map((histogram) => (
          <ValueProfile key={histogram.channel} histogram={histogram} />
        ))}
      </div>

      <HistogramTable histograms={histograms} />
    </section>
  );
}

export default LsbHistogram;
