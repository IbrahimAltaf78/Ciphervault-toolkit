import Link from "next/link";
import {
  Binary,
  ChevronRight,
  EyeOff,
  Fingerprint,
  ScanSearch,
  Stamp,
  Terminal,
  Type,
  type LucideIcon,
} from "lucide-react";
import { WireCube } from "@/components/layout/WireCube";

interface Module {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  badge?: string;
}

/**
 * The six paradigms, in the order the PRD introduces them.
 *
 * Descriptions name what the module actually does to a file rather than listing
 * the algorithms — the algorithm names live on each module's own hub, where
 * someone has already decided they want that module.
 */
const MODULES: Module[] = [
  {
    title: "Steganography Engine",
    description:
      "Hide encrypted payloads inside digital images and WAV audio using LSB and frequency-domain embedding.",
    icon: EyeOff,
    href: "/stego",
    badge: "Core",
  },
  {
    title: "Steganalysis",
    description:
      "Detect hidden data in suspect media using chi-square tests, RS analysis and pixel histograms.",
    icon: ScanSearch,
    href: "/steganalysis",
    badge: "Forensics",
  },
  {
    title: "Cryptography Toolkit",
    description:
      "AES, DES, Triple DES, RSA, ECC, SHA-2, SHA-3 and hybrid encryption, executed in the browser.",
    icon: Fingerprint,
    href: "/cryptography",
  },
  {
    title: "Text Hiding",
    description:
      "Zero-width Unicode, whitespace, capitalisation and acrostics to conceal messages in plain text.",
    icon: Type,
    href: "/text-hiding",
  },
  {
    title: "Digital Watermarking",
    description:
      "Embed robust ownership markers and verify signatures to protect media copyright.",
    icon: Stamp,
    href: "/watermark",
  },
  {
    title: "Encoding & Decoding",
    description:
      "Base64, Base32, hexadecimal, binary, URL and ASCII conversions for payload inspection.",
    icon: Binary,
    href: "/encoding",
  },
];

export default function HomePage() {
  return (
    <div className="crt phos-corners px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      {/* The binary field now comes from the layout, behind every page. */}
      <WireCube className="pointer-events-none absolute -right-16 top-24 z-0 hidden h-[34rem] w-[34rem] text-phos opacity-45 lg:block" />

      <div className="relative z-[1] mx-auto max-w-5xl space-y-12">
        {/* Hero */}
        <header className="space-y-5 text-center">
          <p className="phos-pill mx-auto">
            <Terminal aria-hidden className="size-3" />
            CipherVault Toolkit v1.0
          </p>

          {/* The project's own positioning, from README.md and the PRD.
              The previous headline called this a digital forensics suite and
              named only steganography — which described one module out of six
              and left out cryptography, the largest of them. */}
          <h1 className="phos-glow-strong text-balance text-4xl font-black leading-[1.08] tracking-tight text-phos-hot sm:text-5xl lg:text-6xl">
            Universal Data Hiding
            <br />
            &amp; Cryptography Toolkit
          </h1>

          <p className="mx-auto max-w-2xl text-pretty leading-relaxed text-phos-dim">
            Six paradigms in one workspace — encryption, steganography, text
            hiding, encoding, covert channels and watermarking. Every tool runs
            both ways, and nothing you process is stored.
          </p>
        </header>

        {/* Modules */}
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((module) => (
            <li key={module.href}>
              <Link
                href={module.href}
                className="phos-card group flex h-full flex-col p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phos-hot focus-visible:ring-offset-2 focus-visible:ring-offset-phos-deep"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="phos-tile shrink-0">
                    <module.icon aria-hidden className="size-5" />
                  </span>
                  {module.badge && <span className="phos-pill">{module.badge}</span>}
                </div>

                <h2 className="phos-glow mt-5 text-lg font-bold tracking-tight text-phos-white">
                  {module.title}
                </h2>

                <p className="mt-2 flex-1 text-sm leading-relaxed text-phos-dim">
                  {module.description}
                </p>

                {/* Rule above the action, so the card reads as two zones. */}
                <span className="mt-5 flex items-center gap-1 border-t border-phos-line pt-3 font-mono text-xs font-bold uppercase tracking-wider text-phos transition-colors group-hover:text-phos-hot">
                  Launch module
                  <ChevronRight
                    aria-hidden
                    className="size-3.5 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
