"use client";

import React, { useState } from "react";
import { analyzeFile } from "@/lib/steganalysis/api";
import { SAMPLE_CARRIER_REPORT, SAMPLE_CLEAN_REPORT } from "@/lib/steganalysis/samples";
import { ACCEPT_ATTRIBUTE } from "@/lib/steganalysis/validation";
import { FxScan } from "@/components/viz/ModuleFx";
import type { AnalysisReport, MetadataAnomaly } from "@/lib/steganalysis/types";

export default function StegananalysisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSampleReport, setIsSampleReport] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage(null);
    }
    // Clear it, or choosing the same file again (say after Reset) fires no change.
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
      e.dataTransfer.clearData();
    }
  };

  const handleRunAnalysis = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await analyzeFile(selectedFile);

      if (!result.ok) {
        setErrorMessage(result.error);
      } else {
        setReport(result.report);
        setIsSampleReport(false);
      }
    } catch {
      setErrorMessage("An unexpected error occurred during backend analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSampleCarrier = () => {
    setSelectedFile(null);
    setReport(SAMPLE_CARRIER_REPORT);
    setIsSampleReport(true);
    setErrorMessage(null);
  };

  const handleLoadSampleClean = () => {
    setSelectedFile(null);
    setReport(SAMPLE_CLEAN_REPORT);
    setIsSampleReport(true);
    setErrorMessage(null);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setReport(null);
    setIsSampleReport(false);
    setErrorMessage(null);
  };

  const renderDimensions = (dims: string | { width: number; height: number } | undefined) => {
    if (!dims) return "—";
    if (typeof dims === "string") return dims;
    if (typeof dims === "object" && dims !== null && "width" in dims && "height" in dims) {
      return `${dims.width} × ${dims.height}`;
    }
    return String(dims);
  };

  // The engine's own bands: over 75 is a finding, over 40 is worth a look.
  const likelihood = report?.embeddingLikelihood ?? 0;
  const isCritical = likelihood > 75;
  const isSuspicious = !isCritical && likelihood > 40;
  const verdict = isCritical
    ? "Strong evidence of a hidden payload."
    : isSuspicious
      ? "Some evidence — not conclusive on its own."
      : "No evidence of embedding.";

  // Image reports carry red, green and blue; audio reports one channel.
  const channelLabel = (key: string) => (key === "audio" ? "Samples" : key.charAt(0).toUpperCase() + key.slice(1));
  const lsbRows = Object.entries(report?.lsbDistribution ?? {}).flatMap(([key, dist]) =>
    dist ? [{ key, label: channelLabel(key), zero: dist.zero, one: dist.one }] : [],
  );
  const histograms = Object.entries(report?.histograms ?? {});
  const anomaliesList = report?.anomalies || [];

  return (
    // No gutter, width or min-height of its own: the shell supplies all
    // three, and this page setting its own made it narrower than every other
    // module and left a screen of dead space under the report panel.
    <div className="text-muted font-mono text-xs">
      <div className="space-y-6">

        {/* Module Header — the detector pass, then the name, then one line.
            The long explanation this page used to open with is what the tests
            themselves say further down. */}
        <FxScan />

        <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
          <div>
            <p className="cv-label accent-text">Module 02 · Steganalysis</p>
            <h1 className="mt-2">Detect what was hidden</h1>
          </div>
          <p className="max-w-sm text-sm text-muted">
            Statistical tests over the pixel or sample data, plus a metadata sweep.
          </p>
        </header>

        {/* Suspect File Input Card */}
        <div className="border border-edge bg-phos-panel rounded-md p-4 space-y-4 shadow-lg shadow-black/50">
          <div className="flex items-start gap-3">
            <div className="p-2 border border-edge bg-phos-faint rounded text-[#60A5FA] mt-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-phos-white">Suspect file</h2>
              <p className="text-muted text-[11px]">One dropzone for both media types — the kind is detected from the file itself.</p>
            </div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border border-dashed rounded p-6 text-center transition-all ${isDragging
                ? "border-[#60A5FA] bg-phos-faint shadow-inner shadow-black/40"
                : "border-edge bg-phos-void hover:border-[#60A5FA]"
              }`}
          >
            <input
              type="file"
              id="suspectFileInput"
              className="hidden"
              accept={ACCEPT_ATTRIBUTE}
              onChange={handleFileChange}
            />
            {selectedFile ? (
              <div className="flex items-center justify-between bg-phos-deep border border-edge px-4 py-2.5 rounded">
                <div className="flex items-center gap-3 text-left">
                  <span className="p-1.5 border border-edge rounded bg-phos-faint text-[#60A5FA]">📄</span>
                  <div>
                    <p className="font-bold text-phos-white truncate max-w-xl">{selectedFile.name}</p>
                    <p className="text-[10px] text-muted">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB - {selectedFile.type || "file"}
                    </p>
                  </div>
                </div>
                <label
                  htmlFor="suspectFileInput"
                  className="cursor-pointer px-2.5 py-1 text-[10px] border border-edge bg-phos-faint hover:bg-phos-faint text-foreground rounded"
                >
                  Choose another
                </label>
              </div>
            ) : (
              <label htmlFor="suspectFileInput" className="cursor-pointer space-y-2 block">
                <div className="flex justify-center text-phos-edge">
                  <svg className={`w-6 h-6 transition-transform ${isDragging ? "scale-125 text-[#60A5FA]" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <p className={`font-semibold ${isDragging ? "text-phos-white" : "text-foreground"}`}>
                  {isDragging ? "Drop your file here" : "Drop a suspect image or audio file"}
                </p>
                <p className="text-[10px] text-muted">PNG, BMP, TIFF, WEBP or WAV — up to 10 MB</p>
                <span className="inline-block px-3 py-1 mt-2 text-[10px] border border-edge bg-phos-faint hover:bg-phos-faint text-foreground rounded">
                  Browse files
                </span>
              </label>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunAnalysis}
                disabled={!selectedFile || isLoading}
                className="px-3 py-1.5 border border-[#60A5FA] bg-phos-faint hover:bg-phos-faint text-phos-white font-semibold rounded disabled:opacity-40 cursor-pointer"
              >
                {isLoading ? "Running analysis..." : "Run analysis"}
              </button>
              <button
                onClick={handleLoadSampleCarrier}
                className="px-3 py-1.5 border border-edge bg-phos-deep hover:bg-phos-faint text-[#60A5FA] rounded cursor-pointer"
              >
                Sample: carrier
              </button>
              <button
                onClick={handleLoadSampleClean}
                className="px-3 py-1.5 border border-edge bg-phos-deep hover:bg-phos-faint text-[#60A5FA] rounded cursor-pointer"
              >
                Sample: clean
              </button>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 border border-edge bg-phos-void hover:bg-phos-faint text-phos-edge hover:text-[#60A5FA] rounded cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="border border-red-600/60 bg-red-950/30 p-3 rounded text-red-400 text-[11px] flex items-center gap-2">
            <span>🚨</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Standby State (When no analysis has been run) */}
        {!report && (
          <div className="border border-edge bg-phos-deep rounded-md p-12 text-center space-y-2">
            <p className="text-[#60A5FA] font-semibold text-xs">No steganalysis report loaded</p>
            <p className="text-muted text-[11px] max-w-md mx-auto">
              Select a file above and click <strong className="text-muted">Run analysis</strong>, or load a sample preset (<strong className="text-muted">Sample: carrier</strong> / <strong className="text-muted">Sample: clean</strong>) to view findings.
            </p>
          </div>
        )}

        {/* Report Results (Rendered only when report exists) */}
        {report && (
          <>
            {/* Warning Banner (Sample Mode Only) */}
            {isSampleReport && (
              <div className="border border-amber-600/60 bg-amber-950/20 p-3 rounded text-amber-500 text-[11px] flex items-center gap-2">
                <span>⚠️</span>
                <span>
                  <strong>Sample report</strong> — a bundled test file, analysed ahead of time.
                </span>
              </div>
            )}

            {/* Threat Level Summary Banner */}
            <div className={`border rounded-md p-5 bg-phos-panel flex justify-between items-start gap-4 ${isCritical ? "border-red-900/60" : isSuspicious ? "border-amber-900/60" : "border-edge"}`}>
              <div className="space-y-3 max-w-2xl">
                <span className={`px-2 py-0.5 text-[10px] border rounded font-semibold tracking-wide ${isCritical ? "border-red-600 text-red-400 bg-red-950/40" : isSuspicious ? "border-amber-600 text-amber-400 bg-amber-950/40" : "border-[#60A5FA] text-[#60A5FA] bg-phos-faint"}`}>
                  {report.threatLevel ?? "CLEAN"}
                </span>
                <p className="text-foreground text-xs leading-relaxed">{report.summary}</p>

                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-phos-deep rounded-full overflow-hidden">
                    <div
                      style={{ width: `${likelihood}%` }}
                      className={`h-full transition-all duration-500 ${isCritical ? "bg-red-500" : isSuspicious ? "bg-amber-500" : "bg-[#60A5FA]"}`}
                    ></div>
                  </div>
                  <p className="text-[10px] text-muted">{verdict}</p>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-5xl font-extrabold tracking-tight ${isCritical ? "text-red-500" : isSuspicious ? "text-amber-400" : "text-[#60A5FA]"}`}>
                  {likelihood}%
                </span>
                <p className="text-[9px] tracking-widest uppercase text-muted font-semibold mt-1">EMBEDDING LIKELIHOOD</p>
              </div>
            </div>

            {/* File Metadata Bar */}
            <div className="border border-edge bg-phos-panel rounded-md p-3 grid grid-cols-5 gap-2 text-[10px]">
              <div>
                <span className="text-muted block uppercase tracking-wider font-semibold">FILE</span>
                <span className="text-foreground font-bold truncate block">{report.file?.name ?? selectedFile?.name ?? "N/A"}</span>
              </div>
              <div>
                <span className="text-muted block uppercase tracking-wider font-semibold">TYPE</span>
                <span className="text-foreground font-bold block">{report.file?.type ?? selectedFile?.type ?? "image/png"}</span>
              </div>
              <div>
                <span className="text-muted block uppercase tracking-wider font-semibold">SIZE</span>
                <span className="text-foreground font-bold block">{report.file?.size ?? "N/A"}</span>
              </div>
              <div>
                <span className="text-muted block uppercase tracking-wider font-semibold">DIMENSIONS</span>
                <span className="text-foreground font-bold block">{renderDimensions(report.file?.dimensions)}</span>
              </div>
              <div>
                <span className="text-muted block uppercase tracking-wider font-semibold">ANALYSED</span>
                <span className="text-foreground font-bold block">{report.file?.analyzedAt ?? "—"}</span>
              </div>
            </div>

            {/* LSB Distribution Section */}
            <div className="border border-edge bg-phos-panel rounded-md p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-semibold text-phos-white">LSB distribution</h3>
                  <p className="text-muted text-[11px]">Sample values across each channel, and how the low bit divides.</p>
                </div>
                <div className="flex items-center gap-4 text-[10px]">
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <span className="w-2 h-2 bg-blue-500 rounded-sm inline-block"></span> LSB = 0
                  </span>
                  <span className="flex items-center gap-1.5 text-orange-400">
                    <span className="w-2 h-2 bg-orange-500 rounded-sm inline-block"></span> LSB = 1
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-[10px] tracking-widest text-muted font-semibold block uppercase">LOW BIT BALANCE</span>

                <div className="space-y-2.5">
                  {lsbRows.map((row) => (
                    <div key={row.key}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-[#60A5FA] font-semibold">{row.label}</span>
                        <span className="text-phos-edge">
                          {row.zero.toFixed(1)}% / {row.one.toFixed(1)}% — {Math.abs(row.zero - 50) < 1 ? "even" : "skewed"}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-phos-deep rounded overflow-hidden flex">
                        <div style={{ width: `${row.zero}%` }} className="bg-blue-600 h-full"></div>
                        <div style={{ width: `${row.one}%` }} className="bg-orange-600 h-full"></div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-muted pt-1">
                  Photos and recordings sit near 50/50 anyway — the split alone proves nothing. The tests below do the detecting.
                </p>
              </div>

              {histograms.length > 0 && (
                <div
                  className="grid gap-4 pt-4 border-t border-edge"
                  style={{ gridTemplateColumns: `repeat(${histograms.length}, minmax(0, 1fr))` }}
                >
                  {histograms.map(([key, bins]) => {
                    const peak = Math.max(1, ...bins);
                    const step = 100 / Math.max(1, bins.length - 1);
                    const line = bins.map((count, i) => `L ${(i * step).toFixed(2)} ${(38 - (count / peak) * 34).toFixed(2)}`).join(" ");
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted uppercase">
                          <span>{channelLabel(key)}</span>
                          <span>peak {peak.toLocaleString()}</span>
                        </div>
                        <svg className="w-full h-16 text-blue-500/80" viewBox="0 0 100 40" preserveAspectRatio="none" fill="none" stroke="currentColor">
                          <path d={`M 0 38 ${line} L 100 38 Z`} strokeWidth="1" vectorEffect="non-scaling-stroke" fill="rgba(59,130,246,0.15)" />
                        </svg>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detection Tests Section */}
            <div className="border border-edge bg-phos-panel rounded-md p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-phos-white">Detection tests</h3>
                <p className="text-muted text-[11px]">
                  Each test targets a different embedding style, so they can disagree — the score above follows the strongest evidence.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {(report.tests || []).map((test) => {
                  const testCritical = test.status === "critical";
                  const testWarning = test.status === "warning";
                  return (
                    <div key={test.id} className="space-y-1.5 border-b border-edge pb-3 last:border-none">
                      <div className="flex justify-between items-center gap-4 text-xs">
                        <span className="font-bold text-phos-white">{test.name}</span>
                        <span className={`text-right ${testCritical ? "text-red-400 font-semibold" : testWarning ? "text-amber-400" : "text-muted"}`}>{test.value}</span>
                      </div>
                      <div className="w-full h-1.5 bg-phos-deep rounded-full overflow-hidden">
                        <div
                          style={{ width: `${test.score}%` }}
                          className={`h-full ${testCritical ? "bg-red-500" : testWarning ? "bg-amber-500" : "bg-[#60A5FA]"}`}
                        ></div>
                      </div>
                      <p className="text-[10px] text-muted">{test.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metadata Anomalies Section */}
            <div className="border border-edge bg-phos-panel rounded-md p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-phos-white">Metadata anomalies</h3>
                <p className="text-muted text-[11px]">Container-level findings, outside the pixel or sample data.</p>
              </div>

              <div className="space-y-2.5 pt-1">
                {anomaliesList.length === 0 ? (
                  <div className="p-3 border border-edge bg-phos-void rounded flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-bold text-phos-white text-xs">No metadata anomalies detected</p>
                      <p className="text-[10px] text-muted">Container markers and header chunks appear consistent.</p>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-semibold border rounded border-phos-edge text-[#60A5FA] bg-phos-faint">
                      INFO
                    </span>
                  </div>
                ) : (
                  anomaliesList.map((anomaly: MetadataAnomaly, idx: number) => {
                    const isCrit = anomaly.severity === "CRITICAL";
                    const isWarn = anomaly.severity === "WARNING";
                    return (
                      <div
                        key={idx}
                        className="p-3 border border-edge bg-phos-void rounded flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-phos-white text-xs">{anomaly.title}</p>
                          <p className="text-[10px] text-muted">{anomaly.description}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[9px] font-semibold border rounded ${isCrit
                              ? "border-red-600/80 text-red-400 bg-red-950/40"
                              : isWarn
                                ? "border-amber-600/80 text-amber-400 bg-amber-950/40"
                                : "border-phos-edge text-[#60A5FA] bg-phos-faint"
                            }`}
                        >
                          {anomaly.severity}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* The status bar that used to sit here is the shell's Footer — this
            page was drawing a second copy of it directly above the real one. */}

      </div>
    </div>
  );
}