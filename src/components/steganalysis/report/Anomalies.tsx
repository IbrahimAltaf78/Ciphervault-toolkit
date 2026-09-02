import { CheckCircle2 } from "lucide-react";
import type { MetadataAnomaly } from "@/lib/steganalysis/types";
import { SEVERITY_STYLE } from "./threat-styles";

/**
 * Container-level findings.
 *
 * Kept separate from the statistical tests because it is a different kind of
 * evidence. These findings sit outside the pixel data, so they survive analysis
 * that only looks at samples — and bytes appended after a format's end marker
 * are often the whole story, with the LSB plane completely untouched.
 */
export function Anomalies({ anomalies }: { anomalies: MetadataAnomaly[] }) {
  return (
    <section className="space-y-4 rounded-xl border border-edge bg-background/40 p-5">
      <div className="space-y-1">
        <h3 className="font-medium tracking-tight">Metadata anomalies</h3>
        <p className="text-muted">
          Container-level findings, outside the pixel or sample data.
        </p>
      </div>

      {anomalies.length === 0 ? (
        <p className="flex items-center gap-2 text-muted">
          <CheckCircle2 aria-hidden className="size-4 text-emerald-400" />
          Nothing flagged in the container.
        </p>
      ) : (
        <ul className="space-y-2">
          {anomalies.map((anomaly) => {
            const style = SEVERITY_STYLE[anomaly.severity];
            const Icon = style.icon;

            return (
              <li
                key={anomaly.id}
                className="flex flex-col gap-2 rounded-lg border border-edge/70 bg-surface/50 p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium">{anomaly.label}</p>
                  <p className="text-muted">{anomaly.detail}</p>
                  {anomaly.field && (
                    <p className="cv-label normal-case tracking-normal">{anomaly.field}</p>
                  )}
                </div>

                <span className={`cv-badge shrink-0 ${style.chip}`}>
                  <Icon aria-hidden className="size-3.5" />
                  {anomaly.severity}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default Anomalies;
