/**
 * Client for the steganalysis endpoint.
 *
 * Follows the response envelope the rest of the backend uses:
 * { success, data, error: { message } }.
 */
import type { AnalysisReport } from "./types";
import { checkFile } from "./validation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const ENDPOINT = `${API_BASE}/api/steganalysis/analyze`;

export type AnalyzeResult =
  | { ok: true; report: AnalysisReport }
  | { ok: false; error: string; engineOffline?: boolean };

/** Sends the file to the detection engine and returns its report. */
export async function analyzeFile(file: File): Promise<AnalyzeResult> {
  const check = checkFile(file);
  if (!check.ok) return { ok: false, error: check.error };

  const body = new FormData();
  body.append("file", file);
  body.append("kind", check.kind);

  let response: Response;
  try {
    response = await fetch(ENDPOINT, { method: "POST", body });
  } catch {
    return {
      ok: false,
      engineOffline: true,
      error: `Cannot reach the detection engine at ${API_BASE}. Start the backend, or load the sample report to review the dashboard.`,
    };
  }

  let payload: { success?: boolean; data?: AnalysisReport; error?: { message?: string } };
  try {
    payload = await response.json();
  } catch {
    return { ok: false, error: "The engine returned a response that was not valid JSON." };
  }

  if (!response.ok || !payload.success || !payload.data) {
    return {
      ok: false,
      error: payload.error?.message ?? `Analysis failed (HTTP ${response.status}).`,
    };
  }

  return { ok: true, report: payload.data };
}