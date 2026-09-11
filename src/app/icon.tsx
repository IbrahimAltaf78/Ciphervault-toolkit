import { ImageResponse } from "next/og";

/**
 * Favicon, generated at build time.
 *
 * Black tile, the site's blue, and one mark: "CV" over a short bar. The bar
 * is what turns two letters into a logo at 16px — without it the glyphs read
 * as a stray text label in the tab strip. Colours are the site tokens
 * (#07080a ground, #60A5FA accent), so the tab matches the page it opens.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0d1522 0%, #05070a 100%)",
          borderRadius: 7,
          border: "1.5px solid #60A5FA",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#60A5FA",
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: -1,
            lineHeight: 1,
            marginTop: 1,
          }}
        >
          CV
        </div>
        <div
          style={{
            display: "flex",
            width: 14,
            height: 2,
            marginTop: 3,
            borderRadius: 1,
            background: "#60A5FA",
          }}
        />
      </div>
    ),
    size,
  );
}
