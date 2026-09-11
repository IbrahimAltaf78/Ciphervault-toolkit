import type { Metadata } from "next";
import { ENCODING_CODECS, ENCODING_TYPES } from "@/lib/encoding";
import { ModuleIndex } from "@/components/shared/ModuleIndex";
import { FxEncoding } from "@/components/viz/ModuleFx";

export const metadata: Metadata = {
  title: "Encoding",
  description:
    "Base64, Base32, Hex, Binary, URL and ASCII converters, both directions.",
};

export default function EncodingHubPage() {
  return (
    <ModuleIndex
      eyebrow="Module 06 · Encoding"
      title="Six bidirectional converters"
      lead="UTF-8 in, UTF-8 out. Reversible by anyone — this is not encryption."
      fx={<FxEncoding />}
      groups={[
        {
          label: "Converters",
          entries: ENCODING_TYPES.map((type) => ({
            name: ENCODING_CODECS[type].label,
            meta: ENCODING_CODECS[type].alphabet,
            href: `/encoding/${type}`,
          })),
        },
      ]}
    />
  );
}
