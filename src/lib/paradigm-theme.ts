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
  cryptography: "#8b5cf6", // Electric Violet
  steganography: "#10b981", // Emerald Green
  "text-hiding": "#06b6d4", // Cyber Cyan
  encoding: "#3b82f6", // Cobalt Blue
  "covert-channels": "#f59e0b", // Amber Gold
  watermarking: "#ec4899", // Neon Pink
};

/** Inline style that scopes an accent to a subtree. */
export function accentStyle(paradigm: Paradigm): CSSProperties {
  return { "--cv-accent": PARADIGM_ACCENT[paradigm] } as CSSProperties;
}
