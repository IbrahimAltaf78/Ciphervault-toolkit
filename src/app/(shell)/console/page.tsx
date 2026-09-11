import type { Metadata } from "next";
import { RainingLetters } from "@/components/ui/raining-letters";
import { ModuleCoverflow } from "@/components/console/ModuleCoverflow";

export const metadata: Metadata = {
  title: "Console",
  description: "The six CipherVault modules.",
};

/**
 * Console.
 *
 * A short header and the six modules on a coverflow rack. Centred, because
 * the rack is centred — a left-set header above a centred rack pulled the
 * page two ways at once.
 */
export default function ConsolePage() {
  return (
    <div className="relative">
      {/* Pinned to the viewport, behind everything. */}
      <div aria-hidden className="fixed inset-0 -z-10 bg-phos-void">
        {/* Blue, matching the cover page particles — every animation on the
            site runs in the same hue. */}
        <RainingLetters count={200} accent="#60A5FA" dim="#64748b" speed={1} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(8,10,13,0.84), rgba(8,10,13,0.4) 70%, rgba(8,10,13,0.66) 100%)",
          }}
        />
      </div>

      <div className="flex min-h-[calc(100dvh-7rem)] flex-col items-center justify-center py-6">
        {/* The scrim sits directly behind the words, so a lit glyph drifting
            past can never land on top of a letter and make it hard to read. */}
        <header className="cv-scrim phos-rise flex max-w-3xl flex-col items-center text-center">
          <p className="cv-label accent-text">CipherVault · Console</p>
          <h1 className="mt-3">Six ways to make data disappear.</h1>
          <p className="mt-4 max-w-2xl text-muted">
            Hide a payload in an image or a waveform, encrypt it first, conceal
            it in plain prose — or prove a file is carrying something it should
            not be. Every tool runs in this tab; nothing is uploaded or kept.
          </p>
        </header>

        <div className="mt-2 w-full">
          <ModuleCoverflow />
        </div>
      </div>
    </div>
  );
}
