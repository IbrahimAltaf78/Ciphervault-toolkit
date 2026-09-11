import type { Metadata } from "next";
import { ModuleIndex } from "@/components/shared/ModuleIndex";
import { FxEmbed } from "@/components/viz/ModuleFx";

export const metadata: Metadata = {
  title: "Steganography",
  description:
    "Hide payloads inside images, audio and video using LSB and frequency-domain embedding.",
};

/** Each entry names its trade-off, because choosing between LSB and DCT is
 *  the only real decision in this module. */
const TOOLS = [
  { name: "Image — LSB", meta: "PNG · BMP — dies on re-encode", href: "/stego/image/lsb" },
  { name: "Image — DCT / DWT", meta: "PNG · JPEG — survives re-encode", href: "/stego/image/dct-dwt" },
  { name: "Audio", meta: "WAV — lossless carriers only", href: "/stego/audio" },
  { name: "Video", meta: "MP4 · AVI — largest capacity", href: "/stego/video" },
];

export default function StegoHubPage() {
  return (
    <ModuleIndex
      eyebrow="Module 01 · Steganography"
      title="Hide a payload inside media"
      lead="Processed in memory, returned in the response. Nothing is written to disk."
      fx={<FxEmbed />}
      groups={[{ label: "Carriers", entries: TOOLS }]}
    />
  );
}
