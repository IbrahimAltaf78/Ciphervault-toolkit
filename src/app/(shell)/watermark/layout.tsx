import { ModuleNav } from "@/components/shared/ModuleNav";

const TOOLS = [
  { label: "Visible", href: "/watermark/visible" },
  { label: "Invisible", href: "/watermark/invisible" },
  { label: "Robust", href: "/watermark/robust" },
  { label: "Fragile", href: "/watermark/fragile" },
];

/** Chip row across the four marks, above every watermarking tool page. */
export default function WatermarkLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ModuleNav label="Watermarking tools" hub="/watermark" items={TOOLS} />
      {children}
    </>
  );
}
