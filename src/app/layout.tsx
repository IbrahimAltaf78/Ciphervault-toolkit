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
        className={`${inter.variable} ${jetbrainsMono.variable} flex min-h-dvh flex-col bg-phos-void antialiased`}
      >
        {/* The multi-hue aurora backdrop belonged to the six-accent palette.
            The phosphor theme is monochrome and each screen supplies its own
            light, so the page sits on a plain void instead. */}
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-5 sm:py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}