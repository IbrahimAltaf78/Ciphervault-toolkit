"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownUp,
  Binary as BinaryIcon,
  Check,
  Copy,
  Download,
  RotateCcw,
} from "lucide-react";
import { ToolPanel } from "@/components/shared/ToolPanel";
import { ENCODING_CODECS, ENCODING_TYPES } from "@/lib/encoding";
import { ENCODING_EXPLAINERS } from "@/components/encoding/explainers";
import type { EncodingType, ToolMode } from "@/types";

interface EncodingToolProps {
  type: EncodingType;
}

/**
 * Bidirectional panel shared by all six encoding routes.
 *
 * The component holds no conversion logic of its own — it looks the codec up in
 * the registry and calls it, so every sub-technique behaves identically.
 */
export function EncodingTool({ type }: EncodingToolProps) {
  const codec = ENCODING_CODECS[type];
  const [mode, setMode] = useState<ToolMode>("forward");
  const [input, setInput] = useState("");
  const [hasCopied, setHasCopied] = useState(false);

  const isForward = mode === "forward";
  const result = useMemo(
    () => (isForward ? codec.encode(input) : codec.decode(input)),
    [codec, isForward, input],
  );
  const byteCount = useMemo(
    () => new TextEncoder().encode(input).length,
    [input],
  );

  const hasOutput = result.ok && result.value.length > 0;

  async function copyOutput() {
    if (!hasOutput || !result.ok) return;
    await navigator.clipboard.writeText(result.value);
    setHasCopied(true);
    window.setTimeout(() => setHasCopied(false), 1600);
  }

  /** Hands the result to the browser as a .txt file, without touching a server. */
  function downloadOutput() {
    if (!hasOutput || !result.ok) return;
    const blob = new Blob([result.value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ciphervault-${type}-${isForward ? "encoded" : "decoded"}.txt`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setInput("");
    setMode("forward");
    setHasCopied(false);
  }

  /** Feeds the output back in and flips direction — a one-click round trip. */
  function swapDirection() {
    if (result.ok) setInput(result.value);
    setMode(isForward ? "reverse" : "forward");
  }

  return (
    <div className="space-y-6">
      {/* Sub-technique switcher */}
      <nav aria-label="Encoding tools" className="flex flex-wrap gap-2">
        {ENCODING_TYPES.map((slug) => {
          const isCurrent = slug === type;
          return (
            <Link
              key={slug}
              href={`/encoding/${slug}`}
              aria-current={isCurrent ? "page" : undefined}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
                isCurrent
                  ? "accent-soft accent-border accent-text"
                  : "border-edge text-muted hover:border-phos-dim hover:text-foreground"
              }`}
            >
              {ENCODING_CODECS[slug].label}
            </Link>
          );
        })}
      </nav>

      <ToolPanel
        title={`${codec.label} Converter`}
        description={codec.tagline}
        paradigm="encoding"
        icon={BinaryIcon}
        mode={mode}
        onModeChange={setMode}
        forwardLabel="Encode"
        reverseLabel="Decode"
        explainer={ENCODING_EXPLAINERS[type]}
      >
        {/* Input */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="encoding-input" className="cv-label">
              {isForward ? codec.plainLabel : codec.encodedLabel}
            </label>
            <span className="cv-label normal-case tracking-normal">
              {input.length} chars · {byteCount} bytes
            </span>
          </div>
          <textarea
            id="encoding-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={6}
            spellCheck={false}
            placeholder={
              isForward ? codec.encodePlaceholder : codec.decodePlaceholder
            }
            className="cv-field resize-y"
          />
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={swapDirection}
            className="cv-btn accent-ring"
            title="Send the output back through in the opposite direction"
          >
            <ArrowDownUp aria-hidden className="size-3.5" />
            Swap direction
          </button>
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="cv-label">
              {isForward ? codec.encodedLabel : codec.plainLabel}
            </span>
            <span
              className={
                result.ok
                  ? "cv-badge border-emerald-800 bg-emerald-950/60 text-emerald-400"
                  : "cv-badge border-red-800 bg-red-950/60 text-red-400"
              }
            >
              {result.ok ? "Success" : "Failed"}
            </span>
          </div>

          <output
            className={`cv-field block min-h-32 whitespace-pre-wrap break-all ${
              result.ok ? "" : "border-red-900/70 text-red-400"
            }`}
          >
            {result.ok ? (
              result.value || (
                <span className="text-phos-dim">
                  Output appears here as you type.
                </span>
              )
            ) : (
              result.error
            )}
          </output>

          {/* Standard result actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={copyOutput}
              disabled={!hasOutput}
              className="cv-btn"
            >
              {hasCopied ? (
                <Check aria-hidden className="size-3.5 text-emerald-400" />
              ) : (
                <Copy aria-hidden className="size-3.5" />
              )}
              {hasCopied ? "Copied" : "Copy to clipboard"}
            </button>
            <button
              type="button"
              onClick={downloadOutput}
              disabled={!hasOutput}
              className="cv-btn"
            >
              <Download aria-hidden className="size-3.5" />
              Download .txt
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={!input}
              className="cv-btn"
            >
              <RotateCcw aria-hidden className="size-3.5" />
              Reset
            </button>
            <span className="cv-label ml-auto normal-case tracking-normal">
              {codec.alphabet}
            </span>
          </div>
        </div>
      </ToolPanel>
    </div>
  );
}

export default EncodingTool;
