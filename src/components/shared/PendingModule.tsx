import { CircleDashed } from "lucide-react";

interface PendingModuleProps {
  /** Roadmap phase this module is scheduled for, per PHASES.md. */
  phase: string;
  /** Direction currently selected, e.g. "Encryption" or "Extraction". */
  operation: string;
  /** What the finished module will offer. */
  capabilities: string[];
}

/**
 * Placeholder body for route skeletons — keeps an unbuilt panel looking
 * deliberate rather than broken, and states what is coming.
 */
export function PendingModule({
  phase,
  operation,
  capabilities,
}: PendingModuleProps) {
  return (
    <div className="rounded-xl border border-dashed border-edge bg-background/40 p-8 text-center">
      <CircleDashed aria-hidden className="accent-text mx-auto size-7 opacity-70" />
      <p className="mt-3 font-medium">
        {operation} controls arrive in {phase}
      </p>
      <p className="mt-1 text-muted">
        The panel shell, direction toggle and explainer card are wired and ready
        for the engine to drop in.
      </p>
      <ul className="mx-auto mt-5 flex max-w-md flex-col gap-2 text-left">
        {capabilities.map((capability) => (
          <li
            key={capability}
            className="flex items-center gap-2.5 rounded-lg border border-edge/70 bg-surface/50 px-3 py-2 text-muted"
          >
            <span className="accent-fill size-1.5 shrink-0 rounded-full" />
            {capability}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PendingModule;
