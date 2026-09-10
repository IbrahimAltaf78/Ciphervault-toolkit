import Link from "next/link";
import type { Metadata } from "next";
import ParticleDrift from "@/components/ui/particle-drift";

export const metadata: Metadata = {
  title: "CipherVault",
  description:
    "Six data-hiding and cryptography paradigms in one stateless workspace.",
};

const MODULES = [
  "Steganography",
  "Steganalysis",
  "Cryptography",
  "Text hiding",
  "Watermarking",
  "Encoding",
];

/**
 * Cover page.
 *
 * Deliberately holds one idea: the name, one line about it, and the way in.
 * It sits outside `(shell)`, so it carries no navbar, no gutter and no footer
 * — the drift field runs edge to edge behind it.
 *
 * The particles are blue because blue is this design system's primary data
 * hue; orange stays on the button, where the whole site keeps its one
 * interactive colour. The cover therefore states the colour rule before the
 * console has to explain it.
 */
export default function CoverPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-10">
      {/* The effect renders a sandboxed iframe that isolates its canvas and
          hides the rest of its own markup, so it behaves as a background
          layer. aria-hidden because it carries no meaning. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <ParticleDrift className="h-full w-full" density={1.15} length={1.1} />
      </div>

      {/* A vignette so the type never has to compete with a bright particle
          passing behind it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(8,10,13,0.88), rgba(8,10,13,0.35) 60%, transparent 100%)",
        }}
      />

      <div className="relative z-[2] w-full max-w-3xl text-center">
        <p className="cv-label phos-rise flex items-center justify-center gap-3">
          <span className="phos-dot" />
          Client-side · Nothing stored
        </p>

        <h1 className="phos-rise phos-delay-1 mt-6">
          Cipher<span className="accent-text">Vault</span>
        </h1>

        <p className="phos-rise phos-delay-2 mx-auto mt-5 max-w-xl text-balance text-lg text-muted">
          Hide anything. Reveal everything. Six paradigms of concealment and
          cryptography, running entirely in your browser.
        </p>

        <div className="phos-rise phos-delay-3 mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/console" className="cv-btn">
            Go to website
          </Link>
          <Link href="/steganalysis" className="phos-btn">
            Analyse a file
          </Link>
        </div>

        {/* The contents of the toolkit, stated once so the cover is not a
            dead end that says only a name. */}
        <ul className="phos-rise phos-delay-4 mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {MODULES.map((module) => (
            <li key={module} className="cv-label">
              {module}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
