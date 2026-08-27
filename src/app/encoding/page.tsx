"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, Binary, Check, Copy, Eraser } from "lucide-react";
import { ToolPanel } from "@/components/shared/ToolPanel";
import { decodeBase64, encodeBase64 } from "@/lib/encoding/base64";
import type { ToolMode } from "@/types";

/**
 * Base64 converter — the first working module, and the reference wiring for
 * ToolPanel + ModeToggle data binding. All work happens client-side.
 */
export default function EncodingPage() {
  const [mode, setMode] = useState<ToolMode>("forward");
  const [input, setInput] = useState("");
  const [hasCopied, setHasCopied] = useState(false);

  const result = useMemo(
    () => (mode === "forward" ? encodeBase64(input) : decodeBase64(input)),
    [mode, input],
  );

  const byteCount = useMemo(() => new TextEncoder().encode(input).length, [input]);

  const isForward = mode === "forward";
  const output = result.ok ? result.value : result.error;

  async function copyOutput() {
    if (!result.ok || !result.value) return;
    await navigator.clipboard.writeText(result.value);
    setHasCopied(true);
    window.setTimeout(() => setHasCopied(false), 1600);
  }

  /** Feeds the current output back in and flips direction — a quick round trip. */
  function swapDirection() {
    if (result.ok) setInput(result.value);
    setMode(isForward ? "reverse" : "forward");
  }

  return (
    <ToolPanel
      title="Base64 Converter"
      description="Convert text to and from Base64 instantly, without leaving the browser."
      paradigm="encoding"
      icon={Binary}
      mode={mode}
      onModeChange={setMode}
      forwardLabel="Encode"
      reverseLabel="Decode"
      explainer={
        <>
          <p>
            Base64 maps every 3 bytes of input onto 4 characters drawn from a
            64-symbol alphabet (A–Z, a–z, 0–9, <code>+</code> and <code>/</code>),
            so binary data survives transports that only accept text. Input that
            is not a multiple of 3 bytes is padded with <code>=</code>.
          </p>
          <p>
            Text is converted to UTF-8 bytes before encoding, which keeps
            accented characters, emoji and zero-width payloads intact on the
            round trip — the same property the text-hiding module depends on.
          </p>
        </>
      }
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="encoding-input" className="cv-label">
            {isForward ? "Plain text" : "Base64 payload"}
          </label>
          <div className="flex items-center gap-2">
            <span className="cv-label normal-case tracking-normal">
              {input.length} chars · {byteCount} bytes
            </span>
            <button
              type="button"
              onClick={() => setInput("")}
              disabled={!input}
              className="cv-btn"
            >
              <Eraser aria-hidden className="size-3.5" />
              Clear
            </button>
          </div>
        </div>
        <textarea
          id="encoding-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={6}
          spellCheck={false}
          placeholder={isForward ? "Type a message…" : "Paste a Base64 payload…"}
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

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="cv-label">
            {isForward ? "Base64 payload" : "Plain text"}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={
                result.ok
                  ? "cv-badge border-emerald-800 bg-emerald-950/60 text-emerald-400"
                  : "cv-badge border-red-800 bg-red-950/60 text-red-400"
              }
            >
              {result.ok ? "Success" : "Failed"}
            </span>
            <button
              type="button"
              onClick={copyOutput}
              disabled={!result.ok || !result.value}
              className="cv-btn"
            >
              {hasCopied ? (
                <Check aria-hidden className="size-3.5 text-emerald-400" />
              ) : (
                <Copy aria-hidden className="size-3.5" />
              )}
              {hasCopied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <output
          className={`cv-field block min-h-32 whitespace-pre-wrap break-all ${
            result.ok ? "" : "border-red-900/70 text-red-400"
          }`}
        >
          {output || (
            <span className="text-slate-600">Output appears here as you type.</span>
          )}
        </output>
      </div>
    </ToolPanel>
  );
}
