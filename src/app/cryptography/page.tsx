import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  CRYPTO_FAMILIES,
  CRYPTO_TOOLS,
  CRYPTO_TOOL_IDS,
} from "@/lib/crypto";

export const metadata: Metadata = {
  title: "Cryptography — CipherVault",
  description:
    "AES, DES, Triple DES, RSA, ECC, SHA-2, SHA-3 and hybrid encryption, all executed in the browser.",
};

/** Hub grouping the eight tools by family. */
export default function CryptographyHubPage() {
  return (
    <div
      className="space-y-10"
      style={{ "--cv-accent": "#8b5cf6" } as React.CSSProperties}
    >
      <header className="space-y-3">
        <p className="cv-label accent-text">Cryptography</p>
        <h1 className="text-3xl font-bold tracking-tight">
          Eight algorithms, one browser tab
        </h1>
        <p className="max-w-2xl text-muted">
          Everything here runs through the native WebCrypto API where the
          platform provides it. Keys are derived in your browser, held for the
          length of one operation, and never sent anywhere or written to a log.
        </p>
      </header>

      {CRYPTO_FAMILIES.map((family) => {
        const tools = CRYPTO_TOOL_IDS.map((id) => CRYPTO_TOOLS[id]).filter(
          (tool) => tool.family === family.family,
        );

        return (
          <section key={family.family} className="space-y-4">
            <div className="space-y-1 border-b border-edge pb-3">
              <h2 className="text-xl font-semibold tracking-tight">{family.label}</h2>
              <p className="text-muted">{family.blurb}</p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <li key={tool.id}>
                  <Link
                    href={`/cryptography/${tool.path}`}
                    className="cv-card accent-ring group flex h-full flex-col rounded-xl border border-edge bg-surface/70 p-5 backdrop-blur-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-medium tracking-tight">
                        {tool.label}
                      </h3>
                      <ArrowRight
                        aria-hidden
                        className="accent-text size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </div>

                    <p className="mt-1.5 flex-1 text-muted">{tool.tagline}</p>

                    {tool.status && (
                      <span
                        className={`cv-badge mt-4 w-fit ${tool.status.tone === "warn"
                            ? "border-amber-800 bg-amber-950/50 text-amber-400"
                            : "border-emerald-800 bg-emerald-950/50 text-emerald-400"
                          }`}
                      >
                        {tool.status.text}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}