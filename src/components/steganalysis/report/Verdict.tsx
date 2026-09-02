import { THREAT_COPY } from "@/lib/steganalysis/thresholds";
import { formatBytes } from "@/lib/steganalysis/format";
import type { AnalysisReport } from "@/lib/steganalysis/types";
import { THREAT_STYLE } from "./threat-styles";

/**
 * The headline verdict: one number, one band, one sentence.
 *
 * A hero figure rather than a chart — a single value has no comparison to make,
 * and a gauge or donut would be decoration around a number the reader can
 * already see.
 */
export function Verdict({ report }: { report: AnalysisReport }) {
  const style = THREAT_STYLE[report.threatLevel];
  const copy = THREAT_COPY[report.threatLevel];
  const percent = Math.round(report.probability * 100);
  const Icon = style.icon;

  return (
    <section className="rounded-xl border border-edge bg-background/40 p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <span className={`cv-badge ${style.chip}`}>
            <Icon aria-hidden className="size-3.5" />
            {copy.label} threat
          </span>
          <p className="max-w-prose text-muted">{report.summary}</p>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <p className={`font-mono text-5xl font-bold leading-none ${style.ink}`}>
            {percent}
            <span className="text-2xl">%</span>
          </p>
          <p className="cv-label mt-2">Embedding likelihood</p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-edge">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${style.bar}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <span className="cv-label normal-case tracking-normal">{copy.blurb}</span>
          {report.estimatedPayloadBytes !== null && (
            <span className="cv-label normal-case tracking-normal">
              est. payload {formatBytes(report.estimatedPayloadBytes)}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

export default Verdict;
