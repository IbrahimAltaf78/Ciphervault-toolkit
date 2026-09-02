import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AudioLines, Image as ImageIcon, ScanSearch, Video } from "lucide-react";

export const metadata: Metadata = {
  title: "Steganography — CipherVault",
  description:
    "Hide payloads inside images, audio and video using LSB and frequency-domain embedding.",
};

/**
 * Hub for the media steganography tools.
 *
 * The four tool pages moved to /stego/* during the route migration but nothing
 * linked to them — this index is what makes them reachable.
 */
const TOOLS = [
  {
    href: "/stego/image/lsb",
    title: "Image — LSB",
    description:
      "Write payload bits into the least significant bit of each colour channel. Highest capacity, lowest robustness.",
    icon: ImageIcon,
    carrier: "PNG, BMP",
  },
  {
    href: "/stego/image/dct-dwt",
    title: "Image — DCT / DWT",
    description:
      "Embed in the frequency domain instead of the pixels, so the payload survives recompression.",
    icon: ImageIcon,
    carrier: "PNG, JPEG",
  },
  {
    href: "/stego/audio",
    title: "Audio",
    description:
      "Hide data in the sample stream of a lossless waveform, below the noise floor.",
    icon: AudioLines,
    carrier: "WAV",
  },
  {
    href: "/stego/video",
    title: "Video",
    description: "Distribute a payload across frames of a video container.",
    icon: Video,
    carrier: "MP4, AVI",
  },
] as const;

export default function StegoHubPage() {
  return (
    <div
      className="space-y-8"
      style={{ "--cv-accent": "#10b981" } as React.CSSProperties}
    >
      <header className="space-y-3">
        <p className="cv-label accent-text">Steganography</p>
        <h1 className="text-3xl font-bold tracking-tight">Hide a payload in media</h1>
        <p className="max-w-2xl text-muted">
          These tools run against the Python engine, which does the pixel and
          sample work. Files are processed in memory and returned in the response
          — nothing is written to disk.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="cv-card accent-ring group flex h-full flex-col rounded-xl border border-edge bg-surface/70 p-5 backdrop-blur-md"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="accent-soft accent-border accent-text flex size-10 items-center justify-center rounded-xl border">
                  <tool.icon aria-hidden className="size-5" />
                </span>
                <ArrowRight
                  aria-hidden
                  className="accent-text size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                />
              </div>

              <h2 className="mt-4 text-lg font-medium tracking-tight">{tool.title}</h2>
              <p className="mt-1.5 flex-1 text-muted">{tool.description}</p>
              <p className="cv-label mt-4 normal-case tracking-normal">
                Carrier: {tool.carrier}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <aside className="rounded-xl border border-edge bg-surface/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 font-medium tracking-tight">
              <ScanSearch aria-hidden className="size-4 text-rose-400" />
              Looking for the other direction?
            </h2>
            <p className="text-muted">
              Steganalysis tests a file for a payload it was not told about.
            </p>
          </div>
          <Link href="/steganalysis" className="cv-btn">
            Open steganalysis
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </div>
      </aside>
    </div>
  );
}
