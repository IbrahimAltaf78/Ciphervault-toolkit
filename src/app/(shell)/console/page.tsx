import type { Metadata } from "next";
import { RainingLetters } from "@/components/ui/raining-letters";
import { ModuleRail } from "@/components/console/ModuleRail";

export const metadata: Metadata = {
  title: "Console",
  description: "The six CipherVault modules.",
};

const FACTS = [
  { term: "Modules", value: "6" },
  { term: "Tools", value: "35" },
  { term: "Execution", value: "Browser" },
  { term: "Storage", value: "None" },
];

/**
 * Console.
 *
 * Copy at the top, the rail underneath. An earlier pass put a search box
 * here; it duplicated the ⌘K palette already in the navbar, so the space
 * went back to saying what the suite is instead.
 */
export default function ConsolePage() {
  return (
    <div className="relative">
      {/* Pinned to the viewport, behind everything, so the rail glides over a
          steady field rather than dragging it along. */}
      <div aria-hidden className="fixed inset-0 -z-10 bg-phos-void">
        {/* Blue, matching the cover page particles — every animation on the
            site runs in the same hue. */}
        <RainingLetters count={220} accent="#60A5FA" dim="#64748b" speed={1} />

        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 68% 55% at 50% 42%, rgba(7,8,10,0.8), rgba(7,8,10,0.32) 68%, rgba(7,8,10,0.62) 100%)",
          }}
        />
      </div>

      <div className="flex min-h-[calc(100dvh-7rem)] flex-col justify-center gap-10 py-8">
        <header className="phos-rise max-w-3xl">
          <p className="cv-label accent-text">CipherVault · Console</p>

          <h1 className="mt-3">Six ways to make data disappear.</h1>

          <p className="mt-5 max-w-2xl text-muted">
            Hide a payload inside an image or a waveform, encrypt it first,
            conceal it in ordinary prose, or go the other way and prove a file
            is carrying something it should not be. Every tool runs both
            directions, and every one of them runs in this tab — nothing you
            put through it is uploaded, logged or kept.
          </p>

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
            {FACTS.map((fact) => (
              <div key={fact.term} className="flex items-baseline gap-2">
                <dt className="cv-label">{fact.term}</dt>
                <dd className="font-mono text-sm tabular-nums text-phos-white">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </header>

        <ModuleRail />
      </div>
    </div>
  );
}
