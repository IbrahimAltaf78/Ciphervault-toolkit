/** What a suspect file is, as far as the engine is concerned. */
export type SuspectKind = "image" | "audio";

export interface SuspectFile {
  name: string;
  type?: string;
  size?: string;
  dimensions?: string | { width: number; height: number };
  analyzedAt?: string;
}

export interface LsbChannelData {
  zero: number;
  one: number;
  lsb0?: number;
  lsb1?: number;
}

export interface LsbDistribution {
  red?: LsbChannelData;
  green?: LsbChannelData;
  blue?: LsbChannelData;
  audio?: LsbChannelData;
  [key: string]: LsbChannelData | undefined;
}

export interface DetectionTest {
  id: string;
  name: string;
  description: string;
  value: string;
  score: number;
  status: "critical" | "warning" | "clean";
}

export interface MetadataAnomaly {
  title: string;
  description: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
}

export interface AnalysisReport {
  file?: SuspectFile;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  dimensions?: string | { width: number; height: number };
  analyzedAt?: string;
  threatLevel?: string;
  embeddingLikelihood?: number;
  summary?: string;
  lsbDistribution?: LsbDistribution;
  channels?: Array<{ name: string; lsb0: number; lsb1: number; zero?: number; one?: number }>;
  /** Value counts per channel in 64 equal bins, keyed like lsbDistribution. */
  histograms?: Record<string, number[]>;
  tests?: DetectionTest[];
  anomalies?: MetadataAnomaly[];
}