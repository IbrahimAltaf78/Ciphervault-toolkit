import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TextHidingTool } from "@/components/text-hiding/TextHidingTool";
import {
  TEXT_HIDING_TECHNIQUES,
  TEXT_HIDING_TYPES,
  isTextHidingType,
} from "@/lib/text-hiding";

interface RouteParams {
  params: Promise<{ technique: string }>;
}

/** Prerenders all six technique routes at build time. */
export function generateStaticParams() {
  return TEXT_HIDING_TYPES.map((technique) => ({ technique }));
}

export async function generateMetadata({
  params,
}: RouteParams): Promise<Metadata> {
  const { technique } = await params;
  if (!isTextHidingType(technique)) return { title: "Not found — CipherVault" };

  const spec = TEXT_HIDING_TECHNIQUES[technique];
  return {
    title: `${spec.label} Text Hiding — CipherVault`,
    description: spec.tagline,
  };
}

export default async function TextHidingTechniquePage({ params }: RouteParams) {
  const { technique } = await params;
  if (!isTextHidingType(technique)) notFound();

  return <TextHidingTool technique={technique} />;
}
