/**
 * Paradigm accent registry — the single source of truth for module colouring,
 * mirroring the accent table in DESIGN.md.
 *
 * Components spread `accentStyle(paradigm)` onto their root element, which sets
 * the `--cv-accent` custom property. The `.accent-*` classes in globals.css read
 * that variable, so no component ever hardcodes a paradigm colour.
 */
import type { CSSProperties } from "react";
import type { Paradigm } from "@/types";

export const PARADIGM_ACCENT: Record<Paradigm, string> = {
  // The phosphor theme is monochrome: every paradigm resolves to the same
  // green, and module identity is carried by the icon and the label instead of
  // the hue. The map is kept rather than deleted so components that set
  // `--cv-accent` per module keep working, and so a future theme can give the
  // paradigms their own colours back by editing this one table.
  cryptography: "#60A5FA",
  steganography: "#60A5FA",
  "text-hiding": "#60A5FA",
  encoding: "#60A5FA",
  "covert-channels": "#60A5FA",
  watermarking: "#60A5FA",
  steganalysis: "#60A5FA",
};

/** Inline style that scopes an accent to a subtree. */
export function accentStyle(paradigm: Paradigm): CSSProperties {
  return { "--cv-accent": PARADIGM_ACCENT[paradigm] } as CSSProperties;
}
