import type { Metadata } from "next";
import { TEXT_HIDING_TECHNIQUES, TEXT_HIDING_TYPES } from "@/lib/text-hiding";
import { ModuleIndex } from "@/components/shared/ModuleIndex";
import { FxZeroWidth } from "@/components/viz/ModuleFx";

export const metadata: Metadata = {
  title: "Text Hiding",
  description:
    "Zero-width Unicode, whitespace, capitalization, punctuation, acrostic and word-choice concealment, all client-side.",
};

export default function TextHidingHubPage() {
  return (
    <ModuleIndex
      eyebrow="Module 04 · Text Hiding"
      title="Hide a message in plain prose"
      lead="Each technique spends a feature the text already has as one bit."
      fx={<FxZeroWidth />}
      groups={[
        {
          label: "Techniques",
          entries: TEXT_HIDING_TYPES.map((type) => {
            const spec = TEXT_HIDING_TECHNIQUES[type];
            const unbounded = !Number.isFinite(spec.capacity(spec.sampleCover));
            return {
              name: spec.label,
              // Carrier and capacity decide whether a technique can hold a
              // given payload at all — the one fact worth the tile space.
              meta: `${spec.carrier}${unbounded ? " · unbounded" : ""}`,
              href: `/text-hiding/${type}`,
            };
          }),
        },
      ]}
    />
  );
}
