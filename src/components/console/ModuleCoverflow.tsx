"use client";

import {
  Binary,
  EyeOff,
  Fingerprint,
  ScanSearch,
  Stamp,
  Type,
  type LucideIcon,
} from "lucide-react";
import { CoverflowCarousel, type CoverflowSlide } from "@/components/ui/coverflow-carousel";

interface Module {
  id: string;
  name: string;
  note: string;
  href: string;
  icon: LucideIcon;
}

/**
 * The six modules.
 *
 * Kept inside this client component: each carries an icon, which is a
 * function, and a Server Component cannot hand a function across the
 * boundary to a Client Component.
 */
const MODULES: Module[] = [
  { id: "stego", name: "Steganography", note: "Hide a payload inside an image, audio or video", href: "/stego", icon: EyeOff },
  { id: "analysis", name: "Steganalysis", note: "Test a file for a payload hidden inside it", href: "/steganalysis", icon: ScanSearch },
  { id: "crypto", name: "Cryptography", note: "Encrypt, decrypt and hash — AES, RSA, ECC, SHA-3", href: "/cryptography", icon: Fingerprint },
  { id: "text", name: "Text Hiding", note: "Hide a secret message inside ordinary text", href: "/text-hiding", icon: Type },
  { id: "watermark", name: "Watermarking", note: "Stamp ownership on an image, or detect tampering", href: "/watermark", icon: Stamp },
  { id: "encoding", name: "Encoding", note: "Convert text to Base64, hex, binary or URL form", href: "/encoding", icon: Binary },
];

/**
 * Cryptography: the middle card of six, so the rack opens balanced — two
 * modules to the left, three to the right.
 *
 * The console always opens here. An earlier version remembered the last
 * module in sessionStorage and reopened on it; that was taken out at the
 * owner's request, so every visit to the console starts from the same view.
 */
const DEFAULT_INDEX = 2;

/** The face of one card: number, icon, name. The one-line note goes in the
 *  caption under the rack, so the card itself stays uncluttered. */
function Face({ module, index }: { module: Module; index: number }) {
  const Icon = module.icon;
  return (
    <span className="cv-cover-face">
      <span aria-hidden className="cv-cover-ord">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="cv-cover-icon">
        <Icon aria-hidden className="size-9" strokeWidth={1.5} />
      </span>
      <span className="cv-cover-name">{module.name}</span>
    </span>
  );
}

export function ModuleCoverflow() {
  const slides: CoverflowSlide[] = MODULES.map((module, index) => ({
    id: module.id,
    title: module.name,
    subtitle: module.note,
    href: module.href,
    face: <Face module={module} index={index} />,
  }));

  return (
    <CoverflowCarousel
      slides={slides}
      initialIndex={DEFAULT_INDEX}
      // Fixed slots, moving focus. Every module is always on screen with its
      // name readable — a sliding rack either hid the card opposite the
      // centre (as a ring) or piled five cards onto one side with their
      // titles colliding (as a straight line, with the first card centred).
      layout="fan"
      loop={false}
      rotate={28}
      maxTilt={36}
      depth={0.34}
      lift={0.2}
      pop={0.1}
      falloff={0.62}
      fade={0.08}
      gap={0.1}
      perspective={3.4}
      // Six slots across the width, never wider than 200px.
      cardWidth="clamp(104px, calc((100vw - 10rem) / 7), 200px)"
      hoverToFocus
      hoverDelay={140}
      label="CipherVault modules"
      openLabel="Open"
    />
  );
}

export default ModuleCoverflow;
