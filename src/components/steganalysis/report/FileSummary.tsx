import { formatBytes } from "@/lib/steganalysis/format";
import type { AnalysisReport } from "@/lib/steganalysis/types";

/**
 * What was analysed.
 *
 * Present so a report is still meaningful once it has been copied out of the
 * page — a verdict with no record of the file it describes is not evidence of
 * anything.
 */
export function FileSummary({ report }: { report: AnalysisReport }) {
  const facts = [
    { label: "File", value: report.file.name },
    { label: "Type", value: report.file.mimeType },
    { label: "Size", value: formatBytes(report.file.sizeBytes) },
    report.file.dimensions
      ? {
          label: "Dimensions",
          value: `${report.file.dimensions.width} x ${report.file.dimensions.height}`,
        }
      : null,
    report.file.durationMs
      ? { label: "Duration", value: `${(report.file.durationMs / 1000).toFixed(1)}s` }
      : null,
    { label: "Analysed", value: new Date(report.analyzedAt).toLocaleString() },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <dl className="grid gap-x-6 gap-y-3 rounded-xl border border-edge bg-background/40 p-5 sm:grid-cols-2 lg:grid-cols-3">
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt className="cv-label">{fact.label}</dt>
          <dd className="mt-0.5 truncate font-mono text-xs" title={fact.value}>
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default FileSummary;
