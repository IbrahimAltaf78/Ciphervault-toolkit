import type { Metadata } from "next";
import { ModuleIndex } from "@/components/shared/ModuleIndex";
import { FxWatermark } from "@/components/viz/ModuleFx";

export const metadata: Metadata = {
  title: "Watermarking",
  description:
    "Visible overlays, invisible signatures, robust DCT marks and fragile tamper detection.",
};

/** Robust and fragile are opposites and the pairing is the point: one is
 *  built to survive re-encoding, the other to break the instant a pixel
 *  moves. The meta line says which, because picking the wrong one silently
 *  produces a mark that cannot do the job it was chosen for. */
const TOOLS = [
  { name: "Visible", meta: "Deterrent — anyone can see it", href: "/watermark/visible" },
  { name: "Invisible", meta: "Covert — survives normal viewing", href: "/watermark/invisible" },
  { name: "Robust", meta: "Ownership — outlives re-encoding", href: "/watermark/robust" },
  { name: "Fragile", meta: "Tamper proof — breaks by design", href: "/watermark/fragile" },
];

export default function WatermarkHubPage() {
  return (
    <ModuleIndex
      eyebrow="Module 05 · Watermarking"
      title="Mark it, or prove it was moved"
      lead="Two opposite jobs: a mark that survives everything, and one that survives nothing."
      fx={<FxWatermark />}
      groups={[{ label: "Marks", entries: TOOLS }]}
    />
  );
}
