/**
 * Chart series colours.
 *
 * These are data-mark colours and are kept apart from the paradigm accents in
 * DESIGN.md, which are UI chrome — a series must stay readable regardless of
 * which module the chart happens to sit in.
 *
 * Deliberately NOT the literal red/green/blue of the channels they describe.
 * That pairing is the obvious choice for RGB data and the worst available one:
 * red against green separates at roughly ΔE 3.7 under deuteranopia, far below
 * the ΔE 8 floor, so a red-green colour-blind analyst could not tell two
 * channels apart. Channel identity is carried by the panel heading instead, and
 * these two hues clear every check on the dark surface (worst adjacent ΔE 26.8).
 */

/** Slot 1 — used for single-series panels and for the LSB = 0 share. */
export const SERIES_PRIMARY = "#3987e5";

/** Slot 2 — used for the LSB = 1 share. */
export const SERIES_SECONDARY = "#d95926";

/** Crosshair and axis ink; a text token, never a series colour. */
export const AXIS_INK = "#94a3b8";

/** Surface behind the marks, for the 2px ring on overlapping shapes. */
export const CHART_SURFACE = "#0f172a";
