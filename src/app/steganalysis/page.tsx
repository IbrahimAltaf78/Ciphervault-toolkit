import type { Metadata } from "next";
import { SteganalysisWorkbench } from "@/components/steganalysis/SteganalysisWorkbench";

export const metadata: Metadata = {
  title: "Steganalysis — CipherVault",
  description:
    "Detect hidden payloads in images and audio: chi-square, RS analysis, LSB histograms and metadata anomalies.",
};

export default function SteganalysisPage() {
  return <SteganalysisWorkbench />;
}
