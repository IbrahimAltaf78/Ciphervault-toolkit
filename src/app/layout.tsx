import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CipherVault — Data Hiding & Cryptography Toolkit",
  description:
    "Cryptography, steganography, encoding and covert-channel tools in one stateless workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} flex min-h-dvh flex-col antialiased`}
      >
        {/* Ambient survey grid + aurora bloom, painted behind all content. */}
        <div aria-hidden className="cv-backdrop">
          <div className="cv-grid" />
          <div
            className="cv-aurora size-[38rem] bg-crypto"
            style={{ top: "-14rem", left: "-10rem" }}
          />
          <div
            className="cv-aurora size-[32rem] bg-encoding"
            style={{ top: "-8rem", right: "-8rem", animationDelay: "-6s" }}
          />
          <div
            className="cv-aurora size-[26rem] bg-texthide"
            style={{ top: "22rem", left: "38%", animationDelay: "-12s" }}
          />
        </div>

        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
