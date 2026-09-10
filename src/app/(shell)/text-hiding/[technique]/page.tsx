"use client";

import { useParams } from "next/navigation";
import { TextHidingTool } from "@/components/text-hiding/TextHidingTool";
import type { TextHidingType } from "@/types";

export default function TextHidingTechniquePage() {
  const params = useParams();
  const technique = ((params?.technique as string) || "zero-width") as TextHidingType;

  return <TextHidingTool technique={technique} />;
}