import Link from "next/link";
import {
  ArrowRight,
  Binary,
  Fingerprint,
  Image as ImageIcon,
  KeyRound,
  Lock,
  Radio,
  Type,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { PARADIGM_ACCENT } from "@/lib/paradigm-theme";
import type { Paradigm } from "@/types";

interface ModuleCard {
  paradigm: Paradigm;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Live modules link out; the rest render as inert cards with a phase chip. */
  href?: string;
  status: string;
}

const MODULES: ModuleCard[] = [
  {
    paradigm: "cryptography",
    title: "Cryptography",
    description: "AES-GCM, RSA keygen and SHA-256 / SHA-3 through the native WebCrypto API.",
    icon: KeyRound,
    href: "/cryptography",
    status: "Phase 2",
  },
  {
    paradigm: "encoding",
    title: "Encoding",
    description: "Base64, Base32, Hex, Binary, URL and ASCII transforms in under 200 ms.",
    icon: Binary,
    href: "/encoding",
    status: "Live",
  },
  {
    paradigm: "text-hiding",
    title: "Text Hiding",
    description: "Zero-width Unicode, whitespace, capitalisation and acrostic concealment.",
    icon: Type,
    href: "/text-hiding",
    status: "Phase 2",
  },
  {
    paradigm: "steganography",
    title: "Steganography",
    description: "LSB and DCT payload embedding across image, audio and video carriers.",
    icon: ImageIcon,
    status: "Phase 3",
  },
  {
    paradigm: "watermarking",
    title: "Watermarking",
    description: "Visible overlays plus fragile and robust marks for tamper detection.",
    icon: Fingerprint,
    status: "Phase 3",
  },
  {
    paradigm: "covert-channels",
    title: "Covert Channels",
    description: "Sandboxed timing, storage and protocol-field exfiltration visualisers.",
    icon: Radio,
    status: "Phase 4",
  },
];

const PILLARS = [
  { icon: Lock, title: "Stateless by design", body: "Payloads live in memory for the length of one operation, then vanish. No database, no disk, no key logging." },
  { icon: Zap, title: "Local execution track", body: "Encoding and WebCrypto work never leaves the browser, so results land in well under 200 ms." },
  { icon: ArrowRight, title: "Bidirectional everywhere", body: "Every panel carries the same toggle: Hide / Encrypt / Encode against Extract / Decrypt / Decode." },
];

function accentVar(paradigm: Paradigm) {
  return { "--cv-accent": PARADIGM_ACCENT[paradigm] } as React.CSSProperties;
}

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="space-y-6">
        <span className="cv-badge border-crypto/40 bg-crypto/10 text-crypto">
          <span className="cv-pulse size-1.5 rounded-full bg-crypto" />
          Six paradigms · one workspace
        </span>

        <h1 className="max-w-3xl text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl">
          Hide anything.{" "}
          <span className="bg-gradient-to-r from-crypto via-texthide to-encoding bg-clip-text text-transparent">
            Reveal everything.
          </span>
        </h1>

        <p className="max-w-2xl text-base leading-relaxed text-muted">
          CipherVault unifies cryptography, steganography, text-based hiding,
          encoding, covert channels and digital watermarking into a single
          interactive toolkit — built for students, CTF competitors and analysts
          who need the mechanism visible, not hidden behind a black box.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/encoding"
            className="inline-flex items-center gap-2 rounded-lg border border-encoding/50 bg-encoding/15 px-4 py-2 font-medium text-encoding shadow-[0_0_30px_-10px_#3b82f6] transition-colors hover:bg-encoding/25"
          >
            Open Base64 converter
            <ArrowRight aria-hidden className="size-4" />
          </Link>
          <Link
            href="/cryptography"
            className="cv-btn px-4 py-2 text-sm"
          >
            Browse cryptography
          </Link>
        </div>
      </section>

      {/* Module grid */}
      <section className="space-y-5">
        <div className="flex items-baseline justify-between gap-4 border-b border-edge pb-3">
          <h2 className="text-xl font-semibold tracking-tight">Modules</h2>
          <p className="cv-label">6 paradigms</p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((module) => {
            const isLive = Boolean(module.href);
            const body = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <span className="accent-soft accent-border accent-text flex size-10 items-center justify-center rounded-xl border">
                    <module.icon aria-hidden className="size-5" />
                  </span>
                  <span
                    className={`cv-badge ${module.status === "Live"
                        ? "border-emerald-800 bg-emerald-950/60 text-emerald-400"
                        : "border-edge bg-edge/40 text-muted"
                      }`}
                  >
                    {module.status}
                  </span>
                </div>
                <div className="mt-4 space-y-1.5">
                  <h3 className="text-lg font-medium tracking-tight">
                    {module.title}
                  </h3>
                  <p className="text-muted">{module.description}</p>
                </div>
              </>
            );

            return (
              <li key={module.paradigm} style={accentVar(module.paradigm)}>
                {isLive ? (
                  <Link
                    href={module.href!}
                    className="cv-card accent-ring block h-full rounded-xl border border-edge bg-surface/70 p-5 backdrop-blur-md"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="h-full rounded-xl border border-edge/70 bg-surface/40 p-5 opacity-70 backdrop-blur-md">
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Pillars */}
      <section className="grid gap-4 sm:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.title}
            className="rounded-xl border border-edge bg-surface/50 p-5 backdrop-blur-md"
          >
            <pillar.icon aria-hidden className="size-5 text-muted" />
            <h3 className="mt-3 font-medium tracking-tight">{pillar.title}</h3>
            <p className="mt-1 text-muted">{pillar.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
