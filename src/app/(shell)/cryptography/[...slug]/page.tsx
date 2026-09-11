import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CryptoTool } from "@/components/cryptography/CryptoTool";
import { CRYPTO_TOOLS, CRYPTO_TOOL_IDS, toolFromSlug } from "@/lib/crypto";

interface RouteParams {
  params: Promise<{ slug: string[] }>;
}

/**
 * A catch-all rather than a fixed folder per tool, because the paths are not a
 * uniform depth: seven sit under a family segment (symmetric/aes) and hybrid
 * sits at the top. One route driven by the registry covers both.
 */
export function generateStaticParams() {
  return CRYPTO_TOOL_IDS.map((id) => ({ slug: CRYPTO_TOOLS[id].path.split("/") }));
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const tool = toolFromSlug(slug);
  if (!tool) return { title: "Not found" };

  return {
    title: `${tool.label} — Cryptography`,
    description: tool.tagline,
  };
}

export default async function CryptographyToolPage({ params }: RouteParams) {
  const { slug } = await params;
  const tool = toolFromSlug(slug);
  if (!tool) notFound();

  return <CryptoTool id={tool.id} />;
}
