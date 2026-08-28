import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EncodingTool } from "@/components/encoding/EncodingTool";
import { ENCODING_CODECS, ENCODING_TYPES, isEncodingType } from "@/lib/encoding";

interface RouteParams {
  params: Promise<{ type: string }>;
}

/** Prerenders all six sub-technique routes at build time. */
export function generateStaticParams() {
  return ENCODING_TYPES.map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: RouteParams): Promise<Metadata> {
  const { type } = await params;
  if (!isEncodingType(type)) return { title: "Not found — CipherVault" };

  const codec = ENCODING_CODECS[type];
  return {
    title: `${codec.label} Encoder & Decoder — CipherVault`,
    description: codec.tagline,
  };
}

export default async function EncodingTypePage({ params }: RouteParams) {
  const { type } = await params;
  if (!isEncodingType(type)) notFound();

  return <EncodingTool type={type} />;
}
