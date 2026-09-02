import { FlaskConical } from "lucide-react";

/**
 * Marks a report as illustrative.
 *
 * Its own component so it cannot be quietly dropped when the dashboard is
 * rearranged. A detection tool whose demo output is indistinguishable from a
 * real verdict is worse than no tool — someone will screenshot it.
 */
export function SampleBanner() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-xl border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-amber-300"
    >
      <FlaskConical aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p>
        <strong className="font-medium">Sample report.</strong> These figures are
        illustrative, generated to exercise the dashboard while the detection
        engine is being built. Nothing here reflects a real file.
      </p>
    </div>
  );
}

export default SampleBanner;
