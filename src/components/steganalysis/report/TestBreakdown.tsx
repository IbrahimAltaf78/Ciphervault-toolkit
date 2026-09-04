import type { DetectionTest } from "@/lib/steganalysis/types";
import { styleForScore } from "./threat-styles";

/**
 * Per-test scores.
 *
 * Shown individually rather than rolled entirely into the headline number,
 * because the disagreements are the informative part: chi-square catches
 * sequential LSB embedding but misses randomised embedding, which RS analysis
 * picks up. A high aggregate built on one dissenting test is a different
 * situation from four tests agreeing, and an analyst needs to see which it is.
 */
export function TestBreakdown({ tests }: { tests: DetectionTest[] }) {
  if (tests.length === 0) return null;

  return (
    <section className="space-y-4 rounded-xl border border-edge bg-background/40 p-5">
      <div className="space-y-1">
        <h3 className="font-medium tracking-tight">Detection tests</h3>
        <p className="text-muted">
          Each test targets a different embedding style, so they can and do
          disagree — the aggregate score above weighs them together.
        </p>
      </div>

      <ul className="space-y-4">
        {tests.map((test) => {
          const percent = Math.round(test.score * 100);
          const style = styleForScore(test.score);

          return (
            <li key={test.id} className="space-y-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium">{test.label}</span>
                <span className="cv-label normal-case tracking-normal">
                  {test.measurement} · {percent}%
                </span>
              </div>

              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-edge"
                role="meter"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${test.label} score`}
              >
                <div
                  className={`h-full rounded-full ${style.bar}`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <p className="text-muted">{test.description}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default TestBreakdown;
