import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BinaryRain } from "@/components/layout/BinaryRain";
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
        className={`${inter.variable} ${jetbrainsMono.variable} flex min-h-dvh flex-col bg-phos-void antialiased`}
      >
        {/* The binary field sits behind every page, fixed to the viewport so it
            stays put while the page scrolls — a backdrop that scrolls away
            reads as content, and this is atmosphere. Masked toward the centre
            so it never competes with the text on top of it. */}
        <div aria-hidden className="phos-backdrop">
          <BinaryRain columns={34} depth={90} />
        </div>

        <div className="phos-above flex min-h-dvh flex-col">
          <Navbar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-5 sm:py-6">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}