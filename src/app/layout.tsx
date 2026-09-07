import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BinaryRain } from "@/components/layout/BinaryRain";
import { CommandPalette } from "@/components/layout/CommandPalette";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ciphervault.local'),
  title: {
    default: 'CipherVault — Hide anything, reveal everything',
    // Every tool page sets its own title and gets the suite name appended,
    // so a browser full of tabs stays readable.
    template: '%s · CipherVault',
  },
  description:
    'Encryption, steganography, text hiding, encoding, covert channels and watermarking — six paradigms in one stateless workspace.',
  keywords: [
    'steganography', 'steganalysis', 'cryptography', 'AES', 'RSA',
    'zero-width unicode', 'LSB', 'digital watermarking', 'encoding',
  ],
  openGraph: {
    type: 'website',
    siteName: 'CipherVault',
    title: 'CipherVault — Hide anything, reveal everything',
    description:
      'Six data-hiding and cryptography paradigms in one workspace. Every tool runs both ways.',
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} flex min-h-dvh flex-col bg-phos-void antialiased`}
      >
        {/* First stop in the tab order, visible only once focused. Without it
            a keyboard or screen-reader user tabs through the whole header on
            every page before reaching the tool they came for. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:border-phos focus:bg-phos-deep focus:px-4 focus:py-2 focus:text-phos-hot"
        >
          Skip to content
        </a>

        {/* The binary field sits behind every page, fixed to the viewport so it
            stays put while the page scrolls — a backdrop that scrolls away
            reads as content, and this is atmosphere. Masked toward the centre
            so it never competes with the text on top of it. */}
        <div aria-hidden className="phos-backdrop">
          <BinaryRain columns={34} depth={90} />
        </div>

        <div className="phos-above flex min-h-dvh flex-col">
          <Navbar />
          <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-5 sm:py-6">
            {children}
          </main>
          <Footer />
        </div>

        {/* Sits outside the page flow: it is an overlay, and its trigger is
            pinned to the viewport rather than to any one screen. */}
        <CommandPalette />
      </body>
    </html>
  );
}