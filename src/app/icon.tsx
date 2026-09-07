import { ImageResponse } from "next/og";

/**
 * Favicon, generated at build time.
 *
 * The project shipped with the Next.js template icon, so every open tab was
 * advertising the framework rather than the product. Generated rather than
 * drawn so it stays in step with the theme: one glyph, phosphor on void.
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
          alignItems: "center",
          justifyContent: "center",
          background: "#050a06",
          color: "#22c55e",
          fontSize: 22,
          fontWeight: 700,
          borderRadius: 6,
          border: "1px solid #1c4d2a",
        }}
      >
        CV
      </div>
    ),
    size,
  );
}
