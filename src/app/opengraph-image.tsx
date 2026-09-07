import { ImageResponse } from "next/og";

/**
 * Social preview card.
 *
 * Pasting a link to this app anywhere — a chat, an issue, a submission — showed
 * nothing but the bare URL. This is the card that appears instead, and it
 * carries the same claim as the hero so the two do not diverge.
 */
export const alt = "CipherVault — hide anything, reveal everything";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 80px",
          background: "#050a06",
          color: "#d9ffe4",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#22c55e",
          }}
        >
          CipherVault Solutions
        </div>

        <div style={{ display: "flex", fontSize: 84, fontWeight: 800, color: "#2f7a44", marginTop: 28 }}>
          Hide anything.
        </div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 800, color: "#4ade80" }}>
          Reveal everything.
        </div>

        <div style={{ display: "flex", fontSize: 26, color: "#2f7a44", marginTop: 34 }}>
          Encryption · Steganography · Text hiding · Encoding · Covert channels · Watermarking
        </div>
      </div>
    ),
    size,
  );
}
