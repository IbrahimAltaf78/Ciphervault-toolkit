import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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

/**
 * Root layout — fonts, tokens, and nothing else.
 *
 * The application chrome (navbar, gutter, footer) lives in `(shell)/layout.tsx`
 * rather than here, because the cover page at `/` is full-bleed and must not
 * carry a navbar. A route group gives it a layout of its own without changing
 * a single URL: `(shell)/stego` is still served at `/stego`.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-dvh bg-phos-void antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
