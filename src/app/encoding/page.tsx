import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ENCODING_CODECS, ENCODING_TYPES } from "@/lib/encoding";

export const metadata: Metadata = {
  title: "Encoding — CipherVault",
  description:
    "Base64, Base32, Hex, Binary, URL and ASCII converters, all client-side.",
};

/** Hub listing every encoding sub-technique. */
export default function EncodingHubPage() {
  return (
    <div className="space-y-8" style={{ "--cv-accent": "#3b82f6" } as React.CSSProperties}>
      <header className="space-y-3">
        <p className="cv-label accent-text">Encoding</p>
        <h1 className="text-3xl font-bold tracking-tight">
          Six bidirectional converters
        </h1>
        <p className="max-w-2xl text-muted">
          Every transformation runs in your browser against UTF-8 bytes, so
          accented text, emoji and zero-width characters survive a full round
          trip. Decoding validates the alphabet before it converts anything.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ENCODING_TYPES.map((type) => {
          const codec = ENCODING_CODECS[type];
          return (
            <li key={type}>
              <Link
                href={`/encoding/${type}`}
                className="cv-card accent-ring group flex h-full flex-col rounded-xl border border-edge bg-surface/70 p-5 backdrop-blur-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-medium tracking-tight">
                    {codec.label}
                  </h2>
                  <ArrowRight
                    aria-hidden
                    className="accent-text size-4 opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </div>
                <p className="mt-1.5 flex-1 text-muted">{codec.tagline}</p>
                <p className="cv-label mt-4 normal-case tracking-normal">
                  {codec.alphabet}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}