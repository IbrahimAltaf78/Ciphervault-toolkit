import { ModuleNav } from "@/components/shared/ModuleNav";

/** The four carriers the steganography hub lists, in the same order. */
const TOOLS = [
  { label: "Image — LSB", href: "/stego/image/lsb" },
  { label: "Image — DCT / DWT", href: "/stego/image/dct-dwt" },
  { label: "Audio", href: "/stego/audio" },
  { label: "Video", href: "/stego/video" },
];

/** Chip row across the carriers, above every steganography tool page. */
export default function StegoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ModuleNav label="Steganography tools" hub="/stego" items={TOOLS} />
      {children}
    </>
  );
}
