import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Infinity as InfinityIcon } from "lucide-react";
import { TEXT_HIDING_TECHNIQUES, TEXT_HIDING_TYPES } from "@/lib/text-hiding";

export const metadata: Metadata = {
  title: "Text Hiding — CipherVault",
  description:
    "Zero-width Unicode, whitespace, capitalization, punctuation, acrostic and word-choice concealment, all client-side.",
};

/** Hub listing every text-hiding technique. */
export default function TextHidingHubPage() {
  return (
    <div
      className="space-y-8"
      style={{ "--cv-accent": "#06b6d4" } as React.CSSProperties}
    >
      <header className="space-y-3">
        <p className="cv-label accent-text">Text-Based Hiding</p>
        <h1 className="text-3xl font-bold tracking-tight">
          Six ways to hide a message in plain sight
        </h1>
        <p className="max-w-2xl text-muted">
          Each technique borrows a feature the text already has — a gap, a
          capital letter, a punctuation mark — and spends it as one bit. Nothing
          is encrypted and nothing leaves your browser; the message is simply
          somewhere a reader is not looking.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEXT_HIDING_TYPES.map((type) => {
          const spec = TEXT_HIDING_TECHNIQUES[type];
          const isUnbounded = !Number.isFinite(spec.capacity(spec.sampleCover));

          return (
            <li key={type}>
              <Link
                href={`/text-hiding/${type}`}
                className="cv-card accent-ring group flex h-full flex-col rounded-xl border border-edge bg-surface/70 p-5 backdrop-blur-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-medium tracking-tight">
                    {spec.label}
                  </h2>
                  <ArrowRight
                    aria-hidden
                    className="accent-text size-4 opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </div>

                <p className="mt-1.5 flex-1 text-muted">{spec.tagline}</p>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="cv-label normal-case tracking-normal">
                    Carrier: {spec.carrier}
                  </span>
                  {isUnbounded && (
                    <span
                      className="accent-text"
                      title="Unlimited capacity — carriers are inserted, not borrowed"
                    >
                      <InfinityIcon aria-hidden className="size-4" />
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}