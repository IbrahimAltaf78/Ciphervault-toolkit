"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Binary,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Fingerprint,
  ScanSearch,
  Stamp,
  Type,
  type LucideIcon,
} from "lucide-react";

interface RailItem {
  name: string;
  href: string;
  icon: LucideIcon;
  /** One short line. Nothing longer belongs on a tile this size. */
  note: string;
}

/**
 * The six modules.
 *
 * This table lives inside the client component rather than being passed in
 * from the page. An icon is a function, and a Server Component cannot hand a
 * function across the boundary to a Client Component — React has nothing to
 * serialise, and the page throws at hydration. Keeping the table here is the
 * fix; the page simply renders <ModuleRail />.
 */
const MODULES: RailItem[] = [
  { name: "Steganography", href: "/stego", icon: EyeOff, note: "Hide payloads in images and audio" },
  { name: "Steganalysis", href: "/steganalysis", icon: ScanSearch, note: "Test media for a hidden payload" },
  { name: "Cryptography", href: "/cryptography", icon: Fingerprint, note: "AES, RSA, ECC, SHA-3" },
  { name: "Text Hiding", href: "/text-hiding", icon: Type, note: "Conceal a message in prose" },
  { name: "Watermarking", href: "/watermark", icon: Stamp, note: "Ownership marks and tamper checks" },
  { name: "Encoding", href: "/encoding", icon: Binary, note: "Base64, hex, binary, URL" },
];

/**
 * Horizontal rail of module tiles.
 *
 * Native scrolling with CSS snap points does the work — the arrows only nudge
 * `scrollLeft`. Building the track on `transform` instead would have broken
 * trackpad swipes, touch drag, shift-wheel and keyboard scrolling, all of
 * which come free this way.
 *
 * The arrows disable at each end rather than wrapping, because a rail that
 * silently jumps back to the start hides how many tiles there were.
 */
export function ModuleRail() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    // A pixel of slack: sub-pixel layout means scrollLeft rarely lands exactly
    // on the maximum, and without it the right arrow never disables.
    const max = track.scrollWidth - track.clientWidth;
    setAtStart(track.scrollLeft <= 1);
    setAtEnd(track.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    measure();
    track.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [measure]);

  const nudge = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    // Step by one tile, measured off the first child, so the distance always
    // matches whatever width the current breakpoint gave the tiles.
    const tile = track.firstElementChild as HTMLElement | null;
    const gap = 16;
    const step = tile ? tile.offsetWidth + gap : track.clientWidth * 0.8;
    track.scrollBy({ left: step * direction, behavior: "smooth" });
  }, []);

  return (
    <div className="w-full">
      <ul
        ref={trackRef}
        className="cv-rail flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2"
      >
        {MODULES.map((item, index) => (
          <li key={item.href} className="snap-start">
            <Link href={item.href} className="cv-box group">
              <span aria-hidden className="cv-box-ord">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="cv-box-icon">
                <item.icon aria-hidden className="size-6" />
              </span>

              <span className="block">
                <span className="cv-box-name block">{item.name}</span>
                <span className="cv-box-note mt-1.5 block">{item.note}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => nudge(-1)}
          disabled={atStart}
          aria-label="Previous modules"
          className="cv-nub"
        >
          <ChevronLeft aria-hidden className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => nudge(1)}
          disabled={atEnd}
          aria-label="Next modules"
          className="cv-nub"
        >
          <ChevronRight aria-hidden className="size-5" />
        </button>
      </div>
    </div>
  );
}

export default ModuleRail;
