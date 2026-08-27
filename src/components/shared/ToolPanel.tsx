"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Lightbulb, type LucideIcon } from "lucide-react";
import type { Paradigm, ToolMode } from "@/types";
import { accentStyle } from "@/lib/paradigm-theme";
import { ModeToggle } from "@/components/ui/ModeToggle";

interface ToolPanelProps {
  title: string;
  description: string;
  paradigm: Paradigm;
  /** Module glyph shown in the accent tile beside the title. */
  icon: LucideIcon;
  /** Direction state, owned by the tool page so the panel stays presentational. */
  mode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  forwardLabel: string;
  reverseLabel: string;
  /** Body of the "How this works" card required on every tool panel. */
  explainer?: ReactNode;
  /** Input / output controls for the specific tool. */
  children: ReactNode;
}

/**
 * The layout shell every CipherVault tool is built inside: glassmorphic card
 * with an accent hairline, icon-tiled header, mode toggle, and a collapsible
 * educational card. It holds no cryptographic or payload logic of its own.
 */
export function ToolPanel({
  title,
  description,
  paradigm,
  icon: Icon,
  mode,
  onModeChange,
  forwardLabel,
  reverseLabel,
  explainer,
  children,
}: ToolPanelProps) {
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);

  return (
    <section style={accentStyle(paradigm)} className="cv-panel">
      <header className="flex flex-col gap-5 border-b border-edge/80 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="accent-soft accent-border accent-text accent-glow flex size-11 shrink-0 items-center justify-center rounded-xl border">
            <Icon aria-hidden className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="cv-label accent-text">{paradigm.replace("-", " ")}</p>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">
              {title}
            </h1>
            <p className="max-w-prose text-muted">{description}</p>
          </div>
        </div>
        <ModeToggle
          mode={mode}
          onModeChange={onModeChange}
          forwardLabel={forwardLabel}
          reverseLabel={reverseLabel}
          paradigm={paradigm}
        />
      </header>

      <div className="space-y-5 p-6">{children}</div>

      {explainer && (
        <div className="border-t border-edge/80 bg-background/40">
          <button
            type="button"
            onClick={() => setIsExplainerOpen((open) => !open)}
            aria-expanded={isExplainerOpen}
            className="accent-ring flex w-full items-center justify-between gap-2 px-6 py-3.5 text-left text-muted transition-colors hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <Lightbulb aria-hidden className="accent-text size-4" />
              <span className="cv-label text-foreground">How this works</span>
            </span>
            <ChevronDown
              aria-hidden
              className={`size-4 transition-transform duration-300 ${
                isExplainerOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {isExplainerOpen && (
            <div className="space-y-3 border-t border-edge/60 px-6 py-5 text-muted [&_code]:rounded [&_code]:bg-edge/60 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-foreground">
              {explainer}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default ToolPanel;
