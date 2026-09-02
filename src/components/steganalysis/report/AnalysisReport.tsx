import { LsbHistogram } from "@/components/steganalysis/charts/LsbHistogram";
import type { AnalysisReport as Report } from "@/lib/steganalysis/types";
import { SampleBanner } from "./SampleBanner";
import { Verdict } from "./Verdict";
import { FileSummary } from "./FileSummary";
import { TestBreakdown } from "./TestBreakdown";
import { Anomalies } from "./Anomalies";

/**
 * The analysis dashboard.
 *
 * Ordered as an analyst reads it: the verdict first, then what was analysed,
 * then the evidence behind the verdict — distribution, then per-test scores,
 * then container findings. Composition only; each section owns its own layout.
 */
export function AnalysisReport({ report }: { report: Report }) {
  return (
    <div className="space-y-5">
      {report.isSample && <SampleBanner />}

      <Verdict report={report} />
      <FileSummary report={report} />
      <LsbHistogram histograms={report.histograms} />
      <TestBreakdown tests={report.tests} />
      <Anomalies anomalies={report.anomalies} />
    </div>
  );
}

export default AnalysisReport;
