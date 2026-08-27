"use client";

import type { Paradigm, ToolMode } from "@/types";
import { accentStyle } from "@/lib/paradigm-theme";

interface ModeToggleProps {
  /** Currently selected direction. */
  mode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  /** Forward-operation label: Hide, Encrypt or Encode. */
  forwardLabel: string;
  /** Reverse-operation label: Extract, Decrypt or Decode. */
  reverseLabel: string;
  paradigm: Paradigm;
}

/**
 * The unified direction switch carried by every tool panel.
 *
 * Rendered as a radio group so keyboard and screen-reader users get the
 * "one of two" semantics, with a sliding accent pill tracking the selection.
 */
export function ModeToggle({
  mode,
  onModeChange,
  forwardLabel,
  reverseLabel,
  paradigm,
}: ModeToggleProps) {
  const options: Array<{ value: ToolMode; label: string }> = [
    { value: "forward", label: forwardLabel },
    { value: "reverse", label: reverseLabel },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Operation direction"
      style={accentStyle(paradigm)}
      className="relative grid w-fit grid-cols-2 gap-1 rounded-xl border border-edge bg-background/70 p-1"
    >
      {/* Sliding indicator — one element, translated rather than re-rendered. */}
      <span
        aria-hidden
        className={`accent-soft accent-border accent-glow pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg border transition-transform duration-300 ease-out ${
          mode === "reverse" ? "translate-x-[calc(100%+0.25rem)]" : "translate-x-0"
        }`}
      />
      {options.map((option) => {
        const isActive = mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onModeChange(option.value)}
            className={`accent-ring relative z-10 rounded-lg px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-widest transition-colors duration-200 ${
              isActive ? "accent-text" : "text-muted hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default ModeToggle;
