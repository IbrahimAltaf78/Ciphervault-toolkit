"use client";

import { useState } from "react";
import { Check, Copy, Download, Loader2, RotateCcw } from "lucide-react";
import type { CryptoResult } from "@/lib/crypto";

interface ResultBlockProps {
  label: string;
  /** Null until an operation has been run. */
  result: CryptoResult | null;
  isRunning: boolean;
  onReset: () => void;
  /** Placeholder shown before the first run. */
  hint: string;
  /** Base name for the downloaded file. */
  filename: string;
}

/**
 * Output area plus the standard result actions.
 *
 * Shared by all four panel shapes so copy, download and reset behave the same
 * everywhere, and so a failure always renders as a message rather than an
 * empty box.
 */
export function ResultBlock({
  label,
  result,
  isRunning,
  onReset,
  hint,
  filename,
}: ResultBlockProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const output = result?.ok ? result.value : "";
  const hasOutput = output.length > 0;

  async function copyOutput() {
    if (!hasOutput) return;
    await navigator.clipboard.writeText(output);
    setHasCopied(true);
    window.setTimeout(() => setHasCopied(false), 1600);
  }

  function downloadOutput() {
    if (!hasOutput) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${filename}.txt`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="cv-label">{label}</span>
        {isRunning ? (
          <span className="cv-badge border-edge bg-edge/40 text-muted">
            <Loader2 aria-hidden className="size-3 animate-spin" />
            Working
          </span>
        ) : (
          result && (
            <span
              className={
                result.ok
                  ? "cv-badge border-emerald-800 bg-emerald-950/60 text-emerald-400"
                  : "cv-badge border-red-800 bg-red-950/60 text-red-400"
              }
            >
              {result.ok ? "Success" : "Failed"}
            </span>
          )
        )}
      </div>

      <output
        className={`cv-field block min-h-28 whitespace-pre-wrap break-all ${
          result && !result.ok ? "border-red-900/70 text-red-400" : ""
        }`}
      >
        {result ? (
          result.ok ? (
            result.value || <span className="text-slate-600">Empty result.</span>
          ) : (
            result.error
          )
        ) : (
          <span className="text-slate-600">{hint}</span>
        )}
      </output>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button type="button" onClick={copyOutput} disabled={!hasOutput} className="cv-btn">
          {hasCopied ? (
            <Check aria-hidden className="size-3.5 text-emerald-400" />
          ) : (
            <Copy aria-hidden className="size-3.5" />
          )}
          {hasCopied ? "Copied" : "Copy to clipboard"}
        </button>
        <button type="button" onClick={downloadOutput} disabled={!hasOutput} className="cv-btn">
          <Download aria-hidden className="size-3.5" />
          Download .txt
        </button>
        <button type="button" onClick={onReset} className="cv-btn">
          <RotateCcw aria-hidden className="size-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
}

export default ResultBlock;
