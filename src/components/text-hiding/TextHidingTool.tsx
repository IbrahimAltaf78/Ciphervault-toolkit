"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  RotateCcw,
  Type,
} from "lucide-react";
import { ToolPanel } from "@/components/shared/ToolPanel";
import { TEXT_HIDING_TECHNIQUES, TEXT_HIDING_TYPES } from "@/lib/text-hiding";
import { HEADER_BITS } from "@/lib/text-hiding/bits";
import { TEXT_HIDING_EXPLAINERS } from "@/components/text-hiding/explainers";
import type { TextHidingType, ToolMode } from "@/types";

interface TextHidingToolProps {
  technique: TextHidingType;
}

/**
 * Bidirectional panel shared by all six text-hiding routes.
 *
 * Like the encoding tool, it holds no algorithm of its own — it looks the
 * technique up in the registry and calls it, so every route behaves the same.
 */
export function TextHidingTool({ technique }: TextHidingToolProps) {
  const spec = TEXT_HIDING_TECHNIQUES[technique];

  const [mode, setMode] = useState<ToolMode>("forward");
  const [secret, setSecret] = useState("");
  const [cover, setCover] = useState("");
  const [stego, setStego] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const isHiding = mode === "forward";

  const result = useMemo(() => {
    if (isHiding) {
      if (!secret) return null;
      if (spec.needsCover && !cover) return null;
      return spec.hide(secret, cover);
    }
    return stego ? spec.extract(stego) : null;
  }, [isHiding, secret, cover, stego, spec]);

  // Carrier budget for the current cover, shown as a meter while hiding.
  const budget = useMemo(() => {
    if (!isHiding || !spec.needsCover) return null;
    const available = spec.capacity(cover);
    if (!Number.isFinite(available)) return null;

    const needed = HEADER_BITS + new TextEncoder().encode(secret).length * 8;
    return {
      available,
      needed,
      maxChars: Math.max(0, Math.floor((available - HEADER_BITS) / 8)),
      percent: available === 0 ? 0 : Math.min(100, (needed / available) * 100),
      over: needed > available,
    };
  }, [isHiding, spec, cover, secret]);

  const output = result?.ok ? result.value : "";
  const hasOutput = output.length > 0;
  const displayed = isRevealed && spec.reveal ? spec.reveal(output) : output;

  async function copyOutput() {
    if (!hasOutput) return;
    await navigator.clipboard.writeText(output);
    setHasCopied(true);
    window.setTimeout(() => setHasCopied(false), 1600);
  }

  /** Hands the result to the browser as a .txt file, without touching a server. */
  function downloadOutput() {
    if (!hasOutput) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ciphervault-${technique}-${isHiding ? "stego" : "secret"}.txt`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setSecret("");
    setCover("");
    setStego("");
    setMode("forward");
    setIsRevealed(false);
    setHasCopied(false);
  }

  return (
    <div className="space-y-6">
      {/* Technique switcher */}
      <nav aria-label="Text hiding tools" className="flex flex-wrap gap-2">
        {TEXT_HIDING_TYPES.map((slug) => {
          const isCurrent = slug === technique;
          return (
            <Link
              key={slug}
              href={`/text-hiding/${slug}`}
              aria-current={isCurrent ? "page" : undefined}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${isCurrent
                  ? "accent-soft accent-border accent-text"
                  : "border-edge text-muted hover:border-phos-dim hover:text-foreground"
                }`}
            >
              {TEXT_HIDING_TECHNIQUES[slug].label}
            </Link>
          );
        })}
      </nav>

      <ToolPanel
        title={spec.label}
        description={spec.tagline}
        paradigm="text-hiding"
        icon={Type}
        mode={mode}
        onModeChange={setMode}
        forwardLabel="Hide"
        reverseLabel="Extract"
        explainer={TEXT_HIDING_EXPLAINERS[technique]}
      >
        {isHiding ? (
          <>
            <div className="space-y-2">
              <label htmlFor="secret" className="cv-label">
                Secret message
              </label>
              <textarea
                id="secret"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                rows={3}
                spellCheck={false}
                placeholder={spec.secretPlaceholder}
                className="cv-field resize-y"
              />
            </div>

            {spec.needsCover && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="cover" className="cv-label">
                    Cover text
                  </label>
                  <button
                    type="button"
                    onClick={() => setCover(spec.sampleCover)}
                    className="cv-btn"
                  >
                    <FileText aria-hidden className="size-3.5" />
                    Load sample cover
                  </button>
                </div>
                <textarea
                  id="cover"
                  value={cover}
                  onChange={(event) => setCover(event.target.value)}
                  rows={7}
                  spellCheck={false}
                  placeholder={spec.coverPlaceholder}
                  className="cv-field resize-y"
                />
              </div>
            )}

            {/* Carrier budget for the current cover */}
            {budget && (
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="cv-label">Capacity · {spec.carrier}</span>
                  <span
                    className={`cv-label normal-case tracking-normal ${budget.over ? "text-red-400" : ""
                      }`}
                  >
                    {budget.needed} / {budget.available} bits · fits{" "}
                    {budget.maxChars} chars
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-edge">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ${budget.over ? "bg-red-500" : "accent-fill"
                      }`}
                    style={{ width: `${budget.percent}%` }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <label htmlFor="stego" className="cv-label">
              Text containing a hidden message
            </label>
            <textarea
              id="stego"
              value={stego}
              onChange={(event) => setStego(event.target.value)}
              rows={9}
              spellCheck={false}
              placeholder="Paste the text you received…"
              className="cv-field resize-y"
            />
          </div>
        )}

        {/* Output */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="cv-label">
              {isHiding ? "Text with the message hidden" : "Recovered message"}
            </span>
            {result && (
              <span
                className={
                  result.ok
                    ? "cv-badge border-emerald-800 bg-emerald-950/60 text-emerald-400"
                    : "cv-badge border-red-800 bg-red-950/60 text-red-400"
                }
              >
                {result.ok ? "Success" : "Failed"}
              </span>
            )}
          </div>

          <output
            className={`cv-field block min-h-32 whitespace-pre-wrap wrap-break-word ${result && !result.ok ? "border-red-900/70 text-red-400" : ""
              }`}
          >
            {result ? (
              result.ok ? (
                displayed || (
                  <span className="text-phos-dim">
                    The message was empty, so the cover is unchanged.
                  </span>
                )
              ) : (
                result.error
              )
            ) : (
              <span className="text-phos-dim">
                {isHiding
                  ? "Enter a secret message to see the result."
                  : "Paste text above to check it for a hidden message."}
              </span>
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
            {spec.reveal && isHiding && (
              <button
                type="button"
                onClick={() => setIsRevealed((shown) => !shown)}
                disabled={!hasOutput}
                className="cv-btn"
                title="The output looks identical to the cover — this marks the carriers"
              >
                {isRevealed ? (
                  <EyeOff aria-hidden className="size-3.5" />
                ) : (
                  <Eye aria-hidden className="size-3.5" />
                )}
                {isRevealed ? "Hide carriers" : "Reveal carriers"}
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              disabled={!secret && !cover && !stego}
              className="cv-btn"
            >
              <RotateCcw aria-hidden className="size-3.5" />
              Reset
            </button>
          </div>

          {isRevealed && (
            <p className="cv-label normal-case tracking-normal">
              Preview only — copy and download always use the real text.
            </p>
          )}
        </div>
      </ToolPanel>
    </div>
  );
}

export default TextHidingTool;