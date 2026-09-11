import { ENCODING_CODECS, ENCODING_TYPES } from "@/lib/encoding";
import { ModuleNav } from "@/components/shared/ModuleNav";

/** Chip row across the six converters, above every encoding tool page. */
export default function EncodingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ModuleNav
        label="Encoding tools"
        hub="/encoding"
        items={ENCODING_TYPES.map((type) => ({
          label: ENCODING_CODECS[type].label,
          href: `/encoding/${type}`,
        }))}
      />
      {children}
    </>
  );
}
