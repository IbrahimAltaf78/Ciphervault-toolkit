"use client";

import { useState, DragEvent, ChangeEvent } from "react";

interface VerificationReport {
    is_authentic: boolean;
    tamper_percentage?: number;
    message: string;
    tamper_map_url?: string | null;
}

export default function FragileWatermarkPage() {
    const [mode, setMode] = useState<"embed" | "verify">("embed");
    const [file, setFile] = useState<File | null>(null);
    const [report, setReport] = useState<VerificationReport | null>(null);
    const [embedResultUrl, setEmbedResultUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleTabSwitch = (newMode: "embed" | "verify") => {
        setMode(newMode);
        setError(null);
        setReport(null);
    };

    const handleFileSelect = (selectedFile: File) => {
        if (selectedFile && selectedFile.type.startsWith("image/")) {
            setFile(selectedFile);
            setError(null);
        } else {
            setError("Please upload a valid image file (PNG, JPEG, WEBP).");
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        setReport(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            if (mode === "embed") {
                const res = await fetch("http://localhost:8000/api/watermark/fragile/embed", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) {
                    const errJson = await res.json().catch(() => null);
                    throw new Error(errJson?.detail || `Server status ${res.status}`);
                }

                const blob = await res.blob();
                if (embedResultUrl) URL.revokeObjectURL(embedResultUrl);
                setEmbedResultUrl(URL.createObjectURL(blob));
            } else {
                const res = await fetch("http://localhost:8000/api/watermark/fragile/verify", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) {
                    const errJson = await res.json().catch(() => null);
                    throw new Error(errJson?.detail || `Server status ${res.status}`);
                }

                const data: VerificationReport = await res.json();
                setReport(data);
            }
        } catch (err: any) {
            setError(err.message || "Request failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold text-white">Fragile Watermarking & Verification</h1>
            <p className="text-slate-400 text-sm">
                Embed cryptographically sensitive block-hashes into images to detect any pixel tampering.
            </p>

            {/* Mode Switcher Tabs */}
            <div className="flex gap-4 border-b border-slate-800 pb-3">
                <button
                    onClick={() => handleTabSwitch("embed")}
                    className={`font-semibold pb-1 transition ${mode === "embed"
                            ? "text-cyan-400 border-b-2 border-cyan-400"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                >
                    1. Embed Fragile Mark
                </button>
                <button
                    onClick={() => handleTabSwitch("verify")}
                    className={`font-semibold pb-1 transition ${mode === "verify"
                            ? "text-cyan-400 border-b-2 border-cyan-400"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                >
                    2. Verify Integrity
                </button>
            </div>

            {/* Drag & Drop File Container */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer bg-slate-950/50 ${isDragging
                        ? "border-cyan-400 bg-cyan-950/20"
                        : file
                            ? "border-emerald-500/50 bg-slate-900/60"
                            : "border-slate-800 hover:border-slate-700"
                    }`}
            >
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {file ? (
                    <div className="space-y-2">
                        <div className="text-emerald-400 font-semibold text-lg">
                            ✓ Selected File: {file.name}
                        </div>
                        <p className="text-slate-500 text-xs">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • Click or drag to replace
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="text-slate-300 font-medium text-base">
                            Drag and drop your image here
                        </div>
                        <p className="text-slate-500 text-xs">or click to browse from your device</p>
                    </div>
                )}
            </div>

            {/* Submit Action Button */}
            <button
                onClick={handleSubmit}
                disabled={loading || !file}
                className="w-full py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
                {loading
                    ? "Processing..."
                    : mode === "embed"
                        ? "Embed Fragile Watermark"
                        : "Verify File Integrity"}
            </button>

            {/* Error Container */}
            {error && (
                <div className="p-4 bg-red-950/50 border border-red-800/60 rounded-xl text-red-400 text-sm overflow-x-auto">
                    {error}
                </div>
            )}

            {/* Embed Success Section */}
            {embedResultUrl && mode === "embed" && (
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                    <h2 className="text-lg font-semibold text-white">Fragile Marked Output</h2>
                    <div className="flex justify-center bg-slate-950 p-4 rounded-xl">
                        <img
                            src={embedResultUrl}
                            alt="Fragile Watermarked Image"
                            className="max-h-96 rounded-lg object-contain"
                        />
                    </div>
                    <a
                        href={embedResultUrl}
                        download={`fragile_${file?.name.split(".")[0] || "image"}.png`}
                        className="inline-block w-full text-center py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition"
                    >
                        Download Watermarked PNG
                    </a>
                </div>
            )}

            {/* Verification Report Output */}
            {report && mode === "verify" && (
                <div
                    className={`p-6 rounded-2xl border space-y-3 ${report.is_authentic
                            ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-300"
                            : "bg-red-950/40 border-red-800/80 text-red-300"
                        }`}
                >
                    <h2 className="font-bold text-xl flex items-center gap-2">
                        {report.is_authentic ? "✓ File Authentic" : "⚠ Tampering Detected"}
                    </h2>
                    <p className="text-sm opacity-90">{report.message}</p>

                    {report.tamper_percentage !== undefined && (
                        <p className="text-xs font-mono">Tamper Ratio: {report.tamper_percentage}%</p>
                    )}

                    {report.tamper_map_url && (
                        <div className="pt-2 space-y-2">
                            <p className="text-xs font-semibold text-red-400">Tampered Region Overlay (Red):</p>
                            <div className="flex justify-center bg-slate-950 p-4 rounded-xl border border-red-900/50">
                                <img
                                    src={report.tamper_map_url}
                                    alt="Tamper Map"
                                    className="max-h-80 rounded-lg object-contain"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}