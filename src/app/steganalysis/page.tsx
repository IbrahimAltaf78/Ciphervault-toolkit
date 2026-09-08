"use client";

import React, { useState } from "react";
import { analyzeFile } from "@/lib/steganalysis/api";
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
    <div className="min-h-screen bg-[#050806] text-emerald-500 font-mono text-xs p-6 selection:bg-emerald-950 selection:text-emerald-200">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Module Header */}
        <div className="space-y-1">
          <span className="text-[10px] tracking-widest text-emerald-600 uppercase font-semibold">STEGANALYSIS</span>
          <h1 className="text-2xl font-bold text-emerald-100 tracking-tight">Detect what was hidden</h1>
          <p className="text-emerald-700/80 max-w-3xl leading-relaxed text-[11px]">
            The rest of CipherVault hides payloads. This is the other side of the desk: statistical tests over the pixel or
            sample data, plus a sweep of the container metadata, to judge whether a file is carrying something.
          </p>
        </div>

        {/* Suspect File Input Card */}
        <div className="border border-emerald-900/40 bg-[#080d0a]/90 rounded-md p-4 space-y-4 shadow-lg shadow-black/50">
          <div className="flex items-start gap-3">
            <div className="p-2 border border-emerald-800/50 bg-emerald-950/30 rounded text-emerald-400 mt-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-emerald-200">Suspect file</h2>
              <p className="text-emerald-700 text-[11px]">One dropzone for both media types — the kind is detected from the file itself.</p>
            </div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border border-dashed rounded p-6 text-center transition-all ${isDragging
                ? "border-emerald-400 bg-emerald-950/40 shadow-inner shadow-emerald-500/20"
                : "border-emerald-900/60 bg-[#040705] hover:border-emerald-700/60"
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
              <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-900/40 px-4 py-2.5 rounded">
                <div className="flex items-center gap-3 text-left">
                  <span className="p-1.5 border border-emerald-800/40 rounded bg-emerald-950/60 text-emerald-400">📄</span>
                  <div>
                    <p className="font-bold text-emerald-200 truncate max-w-xl">{selectedFile.name}</p>
                    <p className="text-[10px] text-emerald-700">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB - {selectedFile.type || "file"}
                    </p>
                  </div>
                </div>
                <label
                  htmlFor="suspectFileInput"
                  className="cursor-pointer px-2.5 py-1 text-[10px] border border-emerald-800/50 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 rounded"
                >
                  Choose another
                </label>
              </div>
            ) : (
              <label htmlFor="suspectFileInput" className="cursor-pointer space-y-2 block">
                <div className="flex justify-center text-emerald-600">
                  <svg className={`w-6 h-6 transition-transform ${isDragging ? "scale-125 text-emerald-400" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <p className={`font-semibold ${isDragging ? "text-emerald-200" : "text-emerald-300"}`}>
                  {isDragging ? "Drop your file here" : "Drop a suspect image or audio file"}
                </p>
                <p className="text-[10px] text-emerald-700">PNG, BMP, TIFF, WEBP, WAV, FLAC or AIFF — up to 10 MB</p>
                <span className="inline-block px-3 py-1 mt-2 text-[10px] border border-emerald-800/60 bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-300 rounded">
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
                className="px-3 py-1.5 border border-emerald-600/80 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 font-semibold rounded disabled:opacity-40 cursor-pointer"
              >
                {isLoading ? "Running analysis..." : "Run analysis"}
              </button>
              <button
                onClick={handleLoadSampleCarrier}
                className="px-3 py-1.5 border border-emerald-900/60 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 rounded cursor-pointer"
              >
                Sample: carrier
              </button>
              <button
                onClick={handleLoadSampleClean}
                className="px-3 py-1.5 border border-emerald-900/60 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 rounded cursor-pointer"
              >
                Sample: clean
              </button>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 border border-emerald-900/60 bg-zinc-950 hover:bg-emerald-950/30 text-emerald-600 hover:text-emerald-400 rounded cursor-pointer"
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
          <div className="border border-emerald-900/30 bg-[#080d0a]/40 rounded-md p-12 text-center space-y-2">
            <p className="text-emerald-400 font-semibold text-xs">No steganalysis report loaded</p>
            <p className="text-emerald-700 text-[11px] max-w-md mx-auto">
              Select a file above and click <strong className="text-emerald-500">Run analysis</strong>, or load a sample preset (<strong className="text-emerald-500">Sample: carrier</strong> / <strong className="text-emerald-500">Sample: clean</strong>) to view findings.
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
            <div className={`border rounded-md p-5 bg-[#080d0a]/90 flex justify-between items-start ${isCritical ? "border-red-900/60" : "border-emerald-900/40"}`}>
              <div className="space-y-3 max-w-2xl">
                <span className={`px-2 py-0.5 text-[10px] border rounded font-semibold tracking-wide ${isCritical ? "border-red-600 text-red-400 bg-red-950/40" : "border-emerald-500 text-emerald-400 bg-emerald-950/40"}`}>
                  {report.threatLevel ?? "CLEAN THREAT"}
                </span>
                <p className="text-emerald-300/90 text-xs leading-relaxed">{report.summary}</p>

                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${report.embeddingLikelihood ?? 0}%` }}
                      className={`h-full transition-all duration-500 ${isCritical ? "bg-red-500" : "bg-emerald-500"}`}
                    ></div>
                  </div>
                  <p className="text-[10px] text-emerald-700">
                    {isCritical ? "Multiple tests agree that a payload is present." : "No statistical evidence of embedding."}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-5xl font-extrabold tracking-tight ${isCritical ? "text-red-500" : "text-emerald-400"}`}>
                  {report.embeddingLikelihood ?? 0}%
                </span>
                <p className="text-[9px] tracking-widest uppercase text-emerald-700 font-semibold mt-1">EMBEDDING LIKELIHOOD</p>
              </div>
            </div>

            {/* File Metadata Bar */}
            <div className="border border-emerald-900/40 bg-[#080d0a]/90 rounded-md p-3 grid grid-cols-5 gap-2 text-[10px]">
              <div>
                <span className="text-emerald-700 block uppercase tracking-wider font-semibold">FILE</span>
                <span className="text-emerald-300 font-bold truncate block">{report.file?.name ?? selectedFile?.name ?? "N/A"}</span>
              </div>
              <div>
                <span className="text-emerald-700 block uppercase tracking-wider font-semibold">TYPE</span>
                <span className="text-emerald-300 font-bold block">{report.file?.type ?? selectedFile?.type ?? "image/png"}</span>
              </div>
              <div>
                <span className="text-emerald-700 block uppercase tracking-wider font-semibold">SIZE</span>
                <span className="text-emerald-300 font-bold block">{report.file?.size ?? "N/A"}</span>
              </div>
              <div>
                <span className="text-emerald-700 block uppercase tracking-wider font-semibold">DIMENSIONS</span>
                <span className="text-emerald-300 font-bold block">{renderDimensions(report.file?.dimensions)}</span>
              </div>
              <div>
                <span className="text-emerald-700 block uppercase tracking-wider font-semibold">ANALYSED</span>
                <span className="text-emerald-300 font-bold block">{report.file?.analyzedAt ?? "08/09/2026, 16:42:02"}</span>
              </div>
            </div>

            {/* LSB Distribution Section */}
            <div className="border border-emerald-900/40 bg-[#080d0a]/90 rounded-md p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-semibold text-emerald-200">LSB distribution</h3>
                  <p className="text-emerald-700 text-[11px]">Sample values across each channel, and how the low bit divides.</p>
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
                <span className="text-[10px] tracking-widest text-emerald-700 font-semibold block uppercase">LOW BIT BALANCE</span>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-emerald-400 font-semibold">Red</span>
                      <span className="text-emerald-600">{redDist.zero.toFixed(1)}% / {redDist.one.toFixed(1)}% — even</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-900 rounded overflow-hidden flex">
                      <div style={{ width: `${redDist.zero}%` }} className="bg-blue-600 h-full"></div>
                      <div style={{ width: `${redDist.one}%` }} className="bg-orange-600 h-full"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-emerald-400 font-semibold">Green</span>
                      <span className="text-emerald-600">{greenDist.zero.toFixed(1)}% / {greenDist.one.toFixed(1)}% — even</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-900 rounded overflow-hidden flex">
                      <div style={{ width: `${greenDist.zero}%` }} className="bg-blue-600 h-full"></div>
                      <div style={{ width: `${greenDist.one}%` }} className="bg-orange-600 h-full"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-emerald-400 font-semibold">Blue</span>
                      <span className="text-emerald-600">{blueDist.zero.toFixed(1)}% / {blueDist.one.toFixed(1)}% — even</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-900 rounded overflow-hidden flex">
                      <div style={{ width: `${blueDist.zero}%` }} className="bg-blue-600 h-full"></div>
                      <div style={{ width: `${blueDist.one}%` }} className="bg-orange-600 h-full"></div>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-emerald-700/80 pt-1">
                  A natural channel sits away from an even split. Every channel landing on 50/50 means the low bit plane has been overwritten.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-emerald-950">
                <div className="text-center space-y-1">
                  <div className="flex justify-between text-[10px] text-emerald-700">
                    <span>RED</span>
                    <span>peak 9,600</span>
                  </div>
                  <svg className="w-full h-16 text-blue-500/80" viewBox="0 0 100 40" fill="none" stroke="currentColor">
                    <path d="M 0 38 Q 50 2 100 38" strokeWidth="1.5" fill="rgba(59,130,246,0.15)" />
                  </svg>
                </div>
                <div className="text-center space-y-1">
                  <div className="flex justify-between text-[10px] text-emerald-700">
                    <span>GREEN</span>
                    <span>peak 10,400</span>
                  </div>
                  <svg className="w-full h-16 text-blue-500/80" viewBox="0 0 100 40" fill="none" stroke="currentColor">
                    <path d="M 0 38 Q 50 2 100 38" strokeWidth="1.5" fill="rgba(59,130,246,0.15)" />
                  </svg>
                </div>
                <div className="text-center space-y-1">
                  <div className="flex justify-between text-[10px] text-emerald-700">
                    <span>BLUE</span>
                    <span>peak 9,100</span>
                  </div>
                  <svg className="w-full h-16 text-blue-500/80" viewBox="0 0 100 40" fill="none" stroke="currentColor">
                    <path d="M 0 38 Q 50 2 100 38" strokeWidth="1.5" fill="rgba(59,130,246,0.15)" />
                  </svg>
                </div>
              </div>

              <div className="pt-2">
                <button className="text-[10px] text-emerald-600 hover:text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer">
                  ■ VIEW AS TABLE
                </button>
              </div>
            </div>

            {/* Detection Tests Section */}
            <div className="border border-emerald-900/40 bg-[#080d0a]/90 rounded-md p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-emerald-200">Detection tests</h3>
                <p className="text-emerald-700 text-[11px]">
                  Each test targets a different embedding style, so they can and do disagree — the aggregate score above weighs them together.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {(report.tests || []).map((test) => {
                  const testCritical = test.score > 50;
                  return (
                    <div key={test.id} className="space-y-1.5 border-b border-emerald-950 pb-3 last:border-none">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-emerald-200">{test.name}</span>
                        <span className={testCritical ? "text-red-400 font-semibold" : "text-emerald-500"}>{test.value}</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${test.score}%` }}
                          className={`h-full ${testCritical ? "bg-red-500" : "bg-emerald-500"}`}
                        ></div>
                      </div>
                      <p className="text-[10px] text-emerald-700">{test.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metadata Anomalies Section */}
            <div className="border border-emerald-900/40 bg-[#080d0a]/90 rounded-md p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-emerald-200">Metadata anomalies</h3>
                <p className="text-emerald-700 text-[11px]">Container-level findings, outside the pixel or sample data.</p>
              </div>

              <div className="space-y-2.5 pt-1">
                {anomaliesList.length === 0 ? (
                  <div className="p-3 border border-emerald-900/30 bg-[#040705] rounded flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-bold text-emerald-200 text-xs">No metadata anomalies detected</p>
                      <p className="text-[10px] text-emerald-700">Container markers and header chunks appear consistent.</p>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-semibold border rounded border-emerald-700/60 text-emerald-400 bg-emerald-950/40">
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
                        className="p-3 border border-emerald-900/30 bg-[#040705] rounded flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-emerald-200 text-xs">{anomaly.title}</p>
                          <p className="text-[10px] text-emerald-700">{anomaly.description}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[9px] font-semibold border rounded ${isCrit
                              ? "border-red-600/80 text-red-400 bg-red-950/40"
                              : isWarn
                                ? "border-amber-600/80 text-amber-400 bg-amber-950/40"
                                : "border-emerald-700/60 text-emerald-400 bg-emerald-950/40"
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

        {/* Status Bar Footer */}
        <div className="border-t border-emerald-950 pt-4 flex items-center justify-between text-[10px] text-emerald-700 font-semibold tracking-wider uppercase">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-500">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> SYSTEM NOMINAL
            </span>
            <span>BUILD V1.0</span>
            <span>MODULES 6 ONLINE</span>
            <span>EXECUTION CLIENT-SIDE</span>
            <span>STORAGE NONE</span>
          </div>
          <div className="flex items-center gap-4 text-emerald-800">
            <span>FORENSICS</span>
            <span>CRYPTO</span>
            <span>© CIPHERVAULT SOLUTIONS</span>
          </div>
        </div>

      </div>
    </div>
  );
}