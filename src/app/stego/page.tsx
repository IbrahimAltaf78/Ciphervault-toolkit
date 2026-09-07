import type { Metadata } from "next";
import Link from "next/link";
import {
  AudioLines,
  ChevronRight,
  Image as ImageIcon,
  Layers,
  ScanSearch,
  Video,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Steganography — CipherVault",
  description:
    "Hide payloads inside images, audio and video using LSB and frequency-domain embedding.",
};

interface Tool {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  carrier: string;
  /** Why you would pick this one over its neighbour. */
  tradeoff: string;
}

/**
 * The steganography tools.
 *
 * This page previously repeated the landing page — the same six paradigm cards,
 * with one of them linking back to here. A hub has to go somewhere its parent
 * does not, so it now lists what actually lives under /stego.
 *
 * Each entry names its trade-off, because the choice between LSB and DCT is the
 * only real decision in this module and the tools cannot make it for you.
 */
const TOOLS: Tool[] = [
  {
    title: "Image — LSB",
    description:
      "Write payload bits into the least significant bit of each colour channel.",
    icon: ImageIcon,
    href: "/stego/image/lsb",
    carrier: "PNG · BMP",
    tradeoff: "Highest capacity, destroyed by any re-encode",
  },
  {
    title: "Image — DCT / DWT",
    description:
      "Embed in the frequency domain rather than the pixels, so the payload survives compression.",
    icon: Layers,
    href: "/stego/image/dct-dwt",
    carrier: "PNG · JPEG",
    tradeoff: "Survives re-encoding, far less room",
  },
  {
    title: "Audio",
    description:
      "Hide data in the sample stream of a lossless waveform, below the noise floor.",
    icon: AudioLines,
    href: "/stego/audio",
    carrier: "WAV",
    tradeoff: "Inaudible, but lossless carriers only",
  },
  {
    title: "Video",
    description: "Distribute a payload across the frames of a video container.",
    icon: Video,
    href: "/stego/video",
    carrier: "MP4 · AVI",
    tradeoff: "Largest capacity, slowest to process",
  },
];

export default function StegoHubPage() {
  return (
    <div className="crt phos-boot phos-sweep px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
      <div className="relative z-[1] mx-auto max-w-5xl space-y-10">
        <header className="phos-rise phos-delay-1 space-y-4">
          <p className="phos-pill">Module 01 · Steganography</p>

          <h1 className="phos-glow-strong text-balance text-3xl font-black tracking-tight text-phos-hot sm:text-4xl">
            Hide a payload inside media
          </h1>

          <p className="max-w-2xl text-pretty leading-relaxed text-phos-dim">
            These tools run against the Python engine, which does the pixel and
            sample work. Files are processed in memory and returned in the
            response — nothing is written to disk.
          </p>
        </header>

        <ul className="phos-rise phos-delay-2 grid gap-5 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="phos-card group flex h-full flex-col p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phos-hot focus-visible:ring-offset-2 focus-visible:ring-offset-phos-deep"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="phos-tile shrink-0">
                    <tool.icon aria-hidden className="size-5" />
                  </span>
                  <span className="phos-pill">{tool.carrier}</span>
                </div>

                <h2 className="phos-glow mt-5 text-lg font-bold tracking-tight text-phos-white">
                  {tool.title}
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-phos-dim">
                  {tool.description}
                </p>

                <p className="mt-3 flex-1 font-mono text-xs text-phos/70">
                  {tool.tradeoff}
                </p>

                <span className="mt-5 flex items-center gap-1 border-t border-phos-line pt-3 font-mono text-xs font-bold uppercase tracking-wider text-phos transition-colors group-hover:text-phos-hot">
                  Open tool
                  <ChevronRight
                    aria-hidden
                    className="size-3.5 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* The inverse operation, one click away — someone hiding a payload
            usually wants to know whether it is detectable. */}
        <aside className="phos-card phos-rise phos-delay-3 flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 font-bold tracking-tight text-phos-white">
              <ScanSearch aria-hidden className="size-4 text-phos" />
              Going the other way?
            </h2>
            <p className="text-sm text-phos-dim">
              Steganalysis tests a file for a payload it was never told about.
            </p>
          </div>
          <Link href="/steganalysis" className="phos-btn shrink-0 text-sm">
            Open Steganalysis
            <ChevronRight aria-hidden className="size-3.5" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
