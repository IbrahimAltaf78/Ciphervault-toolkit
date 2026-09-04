/**
 * Status styling for verdicts and findings.
 *
 * These are reserved status colours: good / warning / serious / critical. They
 * are never reused as a series colour in the charts, so a red mark always means
 * "bad" and never "channel three".
 *
 * Every entry ships with an icon as well as a chip class. Colour alone is not an
 * encoding — a threat level that reads only as "the red one" is unusable to a
 * colour-blind analyst and to anyone printing the report.
 */
import {
  AlertTriangle,
  Info,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { AnomalySeverity, ThreatLevel } from "@/lib/steganalysis/types";

export interface StatusStyle {
  chip: string;
  bar: string;
  ink: string;
  icon: LucideIcon;
}

export const THREAT_STYLE: Record<ThreatLevel, StatusStyle> = {
  clean: {
    chip: "border-emerald-800 bg-emerald-950/60 text-emerald-400",
    bar: "bg-emerald-500",
    ink: "text-emerald-400",
    icon: ShieldCheck,
  },
  low: {
    chip: "border-lime-800 bg-lime-950/60 text-lime-400",
    bar: "bg-lime-500",
    ink: "text-lime-400",
    icon: ShieldCheck,
  },
  elevated: {
    chip: "border-amber-800 bg-amber-950/60 text-amber-400",
    bar: "bg-amber-500",
    ink: "text-amber-400",
    icon: AlertTriangle,
  },
  high: {
    chip: "border-orange-800 bg-orange-950/60 text-orange-400",
    bar: "bg-orange-500",
    ink: "text-orange-400",
    icon: ShieldAlert,
  },
  critical: {
    chip: "border-red-800 bg-red-950/60 text-red-400",
    bar: "bg-red-500",
    ink: "text-red-400",
    icon: ShieldAlert,
  },
};

export const SEVERITY_STYLE: Record<AnomalySeverity, { chip: string; icon: LucideIcon }> = {
  info: { chip: "border-edge bg-edge/40 text-muted", icon: Info },
  warning: { chip: "border-amber-800 bg-amber-950/60 text-amber-400", icon: AlertTriangle },
  critical: { chip: "border-red-800 bg-red-950/60 text-red-400", icon: ShieldAlert },
};

/** Band a single test score, for its inline bar. */
export function styleForScore(score: number): StatusStyle {
  if (score < 0.2) return THREAT_STYLE.clean;
  if (score < 0.6) return THREAT_STYLE.elevated;
  return THREAT_STYLE.critical;
}
