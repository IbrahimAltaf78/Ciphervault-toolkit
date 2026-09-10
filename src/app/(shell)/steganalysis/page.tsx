"use client";

import React, { useState } from "react";
import { analyzeFile } from "@/lib/steganalysis/api";
import { FxScan } from "@/components/viz/ModuleFx";
import type { AnalysisReport, MetadataAnomaly } from "@/lib/steganalysis/types";

// Static mock data for "Sample: carrier"
const MOCK_CARRIER_REPORT: AnalysisReport = {
  file: {
    name: "sample-carrier.png",
    type: "image/png",
    size: "1.61 MB",
    dimensions: "800 × 600",
    analyzedAt: "08/09/2026, 16:44:12",
  },
  threatLevel: "CRITICAL THREAT",
  embeddingLikelihood: 94,
  summary:
    "Chi-square and RS analysis both indicate a payload occupying most of the LSB plane, concentrated in the first two thirds of the image.",
  lsbDistribution: {
    red: { zero: 50.0, one: 50.0 },
    green: { zero: 50.0, one: 50.0 },
    blue: { zero: 50.0, one: 50.0 },
  },
  tests: [
    {
      id: "chi-square",
      name: "Chi-square attack",
      description: "Compares adjacent value pairs against the distribution expected of untouched pixels.",
      value: "p = 0.9991 — 98%",
      score: 98,
      status: "critical",
    },
    {
      id: "rs-analysis",
      name: "RS analysis",
      description: "Measures how groups of pixels respond to a flipping mask; embedding disturbs the ratio.",
      value: "estimated 0.18 bpp — 91%",
      score: 91,
      status: "critical",
    },
    {
      id: "sample-pairs",
      name: "Sample pairs",
      description: "Estimates embedding rate from transitions between neighbouring sample values.",
      value: "rate 0.16 — 88%",
      score: 88,
      status: "critical",
    },
    {
      id: "lsb-entropy",
      name: "LSB plane entropy",
      description: "A natural low bit plane is noisy but structured; a payload pushes it toward pure randomness.",
      value: "7.88 / 8.00 bits — 85%",
      score: 85,
      status: "critical",
    },
  ],
  anomalies: [
    {
      title: "Data appended after IEND",
      description: "4,096 bytes follow the PNG end-of-stream marker. Decoders ignore this region entirely.",
      severity: "CRITICAL",
    },
    {
      title: "Software tag rewritten",
      description: "iTXt chunk names a tool inconsistent with the gamma EXIF block.",
      severity: "WARNING",
    },
    {
      title: "Modification precedes creation",
      description: "The file mtime is 3 hours earlier than the embedded capture timestamp.",
      severity: "WARNING",
    },
    {
      title: "No colour profile",
      description: "Common in re-encoded files; on its own not evidence of anything.",
      severity: "INFO",
    },
  ],
};

// Static mock data for "Sample: clean"
const MOCK_CLEAN_REPORT: AnalysisReport = {
  file: {
    name: "sample-original.png",
    type: "image/png",
    size: "1.25 MB",
    dimensions: "800 × 600",
    analyzedAt: "08/09/2026, 16:42:44",
  },
  threatLevel: "CLEAN THREAT",
  embeddingLikelihood: 7,
  summary: "Value pairs follow the distribution expected of an untouched image, and no test disagrees.",
  lsbDistribution: {
    red: { zero: 50.0, one: 50.0 },
    green: { zero: 50.0, one: 50.0 },
    blue: { zero: 50.0, one: 50.0 },
  },
  tests: [
    {
      id: "chi-square",
      name: "Chi-square attack",
      description: "Compares adjacent value pairs against the distribution expected of untouched pixels.",
      value: "p = 0.0002 — 4%",
      score: 4,
      status: "clean",
    },
    {
      id: "rs-analysis",
      name: "RS analysis",
      description: "Measures how groups of pixels respond to a flipping mask; embedding disturbs the ratio.",
      value: "estimated 0.01 bpp — 8%",
      score: 8,
      status: "clean",
    },
    {
      id: "sample-pairs",
      name: "Sample pairs",
      description: "Estimates embedding rate from transitions between neighbouring sample values.",
      value: "rate 0.02 — 6%",
      score: 6,
      status: "clean",
    },
    {
      id: "lsb-entropy",
      name: "LSB plane entropy",
      description: "A natural low bit plane is noisy but structured; a payload pushes it toward pure randomness.",
      value: "7.41 / 8.00 bits — 11%",
      score: 11,
      status: "clean",
    },
  ],
  anomalies: [
    {
      title: "sRGB profile present",
      description: "Matches the encoder named in the metadata.",
      severity: "INFO",
    },
  ],
};

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
    setReport(MOCK_CARRIER_REPORT);
    setIsSampleReport(true);
    setErrorMessage(null);
  };

  const handleLoadSampleClean = () => {
    setSelectedFile(null);
    setReport(MOCK_CLEAN_REPORT);
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
    if (!dims) return "undefined × undefined";
    if (typeof dims === "string") return dims;
    if (typeof dims === "object" && dims !== null && "width" in dims && "height" in dims) {
      return `${dims.width} × ${dims.height}`;
    }
    return String(dims);
  };

  const isCritical = report ? (report.embeddingLikelihood ?? 0) > 50 : false;
  const redDist = report?.lsbDistribution?.red || { zero: 50.0, one: 50.0 };
  const greenDist = report?.lsbDistribution?.green || { zero: 50.0, one: 50.0 };
  const blueDist = report?.lsbDistribution?.blue || { zero: 50.0, one: 50.0 };
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
              accept="image/png,image/jpeg,image/bmp,audio/wav"
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
                <p className="text-[10px] text-muted">PNG, BMP, TIFF, WEBP, WAV, FLAC or AIFF — up to 10 MB</p>
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
                  <strong>Sample report.</strong> These figures are illustrative, generated to exercise the dashboard while the detection engine is being built. Nothing here reflects a real file.
                </span>
              </div>
            )}

            {/* Threat Level Summary Banner */}
            <div className={`border rounded-md p-5 bg-phos-panel flex justify-between items-start ${isCritical ? "border-red-900/60" : "border-edge"}`}>
              <div className="space-y-3 max-w-2xl">
                <span className={`px-2 py-0.5 text-[10px] border rounded font-semibold tracking-wide ${isCritical ? "border-red-600 text-red-400 bg-red-950/40" : "border-[#60A5FA] text-[#60A5FA] bg-phos-faint"}`}>
                  {report.threatLevel ?? "CLEAN THREAT"}
                </span>
                <p className="text-foreground text-xs leading-relaxed">{report.summary}</p>

                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-phos-deep rounded-full overflow-hidden">
                    <div
                      style={{ width: `${report.embeddingLikelihood ?? 0}%` }}
                      className={`h-full transition-all duration-500 ${isCritical ? "bg-red-500" : "bg-[#60A5FA]"}`}
                    ></div>
                  </div>
                  <p className="text-[10px] text-muted">
                    {isCritical ? "Multiple tests agree that a payload is present." : "No statistical evidence of embedding."}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-5xl font-extrabold tracking-tight ${isCritical ? "text-red-500" : "text-[#60A5FA]"}`}>
                  {report.embeddingLikelihood ?? 0}%
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
                <span className="text-foreground font-bold block">{report.file?.analyzedAt ?? "08/09/2026, 16:42:02"}</span>
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
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-[#60A5FA] font-semibold">Red</span>
                      <span className="text-phos-edge">{redDist.zero.toFixed(1)}% / {redDist.one.toFixed(1)}% — even</span>
                    </div>
                    <div className="w-full h-2 bg-phos-deep rounded overflow-hidden flex">
                      <div style={{ width: `${redDist.zero}%` }} className="bg-blue-600 h-full"></div>
                      <div style={{ width: `${redDist.one}%` }} className="bg-orange-600 h-full"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-[#60A5FA] font-semibold">Green</span>
                      <span className="text-phos-edge">{greenDist.zero.toFixed(1)}% / {greenDist.one.toFixed(1)}% — even</span>
                    </div>
                    <div className="w-full h-2 bg-phos-deep rounded overflow-hidden flex">
                      <div style={{ width: `${greenDist.zero}%` }} className="bg-blue-600 h-full"></div>
                      <div style={{ width: `${greenDist.one}%` }} className="bg-orange-600 h-full"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-[#60A5FA] font-semibold">Blue</span>
                      <span className="text-phos-edge">{blueDist.zero.toFixed(1)}% / {blueDist.one.toFixed(1)}% — even</span>
                    </div>
                    <div className="w-full h-2 bg-phos-deep rounded overflow-hidden flex">
                      <div style={{ width: `${blueDist.zero}%` }} className="bg-blue-600 h-full"></div>
                      <div style={{ width: `${blueDist.one}%` }} className="bg-orange-600 h-full"></div>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-muted pt-1">
                  A natural channel sits away from an even split. Every channel landing on 50/50 means the low bit plane has been overwritten.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-edge">
                <div className="text-center space-y-1">
                  <div className="flex justify-between text-[10px] text-muted">
                    <span>RED</span>
                    <span>peak 9,600</span>
                  </div>
                  <svg className="w-full h-16 text-blue-500/80" viewBox="0 0 100 40" fill="none" stroke="currentColor">
                    <path d="M 0 38 Q 50 2 100 38" strokeWidth="1.5" fill="rgba(59,130,246,0.15)" />
                  </svg>
                </div>
                <div className="text-center space-y-1">
                  <div className="flex justify-between text-[10px] text-muted">
                    <span>GREEN</span>
                    <span>peak 10,400</span>
                  </div>
                  <svg className="w-full h-16 text-blue-500/80" viewBox="0 0 100 40" fill="none" stroke="currentColor">
                    <path d="M 0 38 Q 50 2 100 38" strokeWidth="1.5" fill="rgba(59,130,246,0.15)" />
                  </svg>
                </div>
                <div className="text-center space-y-1">
                  <div className="flex justify-between text-[10px] text-muted">
                    <span>BLUE</span>
                    <span>peak 9,100</span>
                  </div>
                  <svg className="w-full h-16 text-blue-500/80" viewBox="0 0 100 40" fill="none" stroke="currentColor">
                    <path d="M 0 38 Q 50 2 100 38" strokeWidth="1.5" fill="rgba(59,130,246,0.15)" />
                  </svg>
                </div>
              </div>

              <div className="pt-2">
                <button className="text-[10px] text-phos-edge hover:text-[#60A5FA] font-semibold flex items-center gap-1 cursor-pointer">
                  ■ VIEW AS TABLE
                </button>
              </div>
            </div>

            {/* Detection Tests Section */}
            <div className="border border-edge bg-phos-panel rounded-md p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-phos-white">Detection tests</h3>
                <p className="text-muted text-[11px]">
                  Each test targets a different embedding style, so they can and do disagree — the aggregate score above weighs them together.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {(report.tests || []).map((test) => {
                  const testCritical = test.score > 50;
                  return (
                    <div key={test.id} className="space-y-1.5 border-b border-edge pb-3 last:border-none">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-phos-white">{test.name}</span>
                        <span className={testCritical ? "text-red-400 font-semibold" : "text-muted"}>{test.value}</span>
                      </div>
                      <div className="w-full h-1.5 bg-phos-deep rounded-full overflow-hidden">
                        <div
                          style={{ width: `${test.score}%` }}
                          className={`h-full ${testCritical ? "bg-red-500" : "bg-[#60A5FA]"}`}
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