"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Eye, EyeOff } from "lucide-react";
import { hideZeroWidth, revealZeroWidth } from "@/lib/text-hiding/zero-width";

/**
 * A working tool on the landing page.
 *
 * Not a mockup and not a recording — this calls the same `hideZeroWidth` the
 * text-hiding module uses, so whatever a visitor types here is genuinely
 * encoded into invisible code points they can copy out and paste anywhere.
 *
 * Zero-width was the right technique to put in front: its output is visually
 * identical to its input, which is the single most convincing thing this
 * toolkit does, and it needs no key, no file and no backend to demonstrate.
 */
const COVER =
  "Thanks for the update. I read the draft on the train this morning and it holds together well.";

export function LiveDemo() {
  const [secret, setSecret] = useState("meet at nine");
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const result = useMemo(() => hideZeroWidth(secret, COVER), [secret]);
  const output = result.ok ? result.value : "";

  // The whole point: the carriers add characters that take up no space.
  const hiddenChars = output.length - COVER.length;

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setHasCopied(true);
    window.setTimeout(() => setHasCopied(false), 1800);
  }

  return (
    <section className="phos-card overflow-hidden">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-phos-line px-5 py-3">
        <span className="phos-dot" aria-hidden />
        <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-phos">
          Live &mdash; zero-width Unicode
        </h2>
        <span className="ml-auto font-mono text-[11px] text-phos-dim">
          running in your browser
        </span>
      </header>

      <div className="grid gap-5 p-5 md:grid-cols-2">
        {/* Input */}
        <div className="space-y-2">
          <label
            htmlFor="demo-secret"
            className="block font-mono text-[11px] uppercase tracking-widest text-phos-dim"
          >
            Your secret
          </label>
          <input
            id="demo-secret"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            maxLength={60}
            spellCheck={false}
            placeholder="Type something..."
            className="cv-field w-full"
          />
          <p className="text-xs leading-relaxed text-phos-dim">
            Every character becomes bits, and every bit becomes an invisible
            code point slipped between the letters of the sentence opposite.
          </p>
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-phos-dim">
              Carrier text
            </span>
            <span className="font-mono text-[11px] text-phos">
              +{hiddenChars} invisible
            </span>
          </div>

          <output className="cv-field block min-h-[5.5rem] whitespace-pre-wrap break-words text-sm">
            {isRevealed ? revealZeroWidth(output) : output}
          </output>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsRevealed((shown) => !shown)}
              className="cv-btn text-xs"
            >
              {isRevealed ? (
                <EyeOff aria-hidden className="size-3.5" />
              ) : (
                <Eye aria-hidden className="size-3.5" />
              )}
              {isRevealed ? "Hide carriers" : "Reveal carriers"}
            </button>

            <button type="button" onClick={copyOutput} className="cv-btn text-xs">
              {hasCopied ? (
                <Check aria-hidden className="size-3.5 text-phos-hot" />
              ) : (
                <Copy aria-hidden className="size-3.5" />
              )}
              {hasCopied ? "Copied" : "Copy"}
            </button>

            <Link href="/text-hiding/zero-width" className="cv-btn ml-auto text-xs">
              Full tool
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </div>

          {isRevealed && (
            <p className="text-xs text-phos-dim">
              Preview only &mdash; copying always takes the real, invisible text.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default LiveDemo;
