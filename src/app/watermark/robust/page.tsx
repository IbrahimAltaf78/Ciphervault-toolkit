"use client";

import { useState, DragEvent, ChangeEvent } from "react";

export default function RobustWatermarkPage() {
    const [mode, setMode] = useState<"embed" | "extract">("embed");
    const [file, setFile] = useState<File | null>(null);
    const [watermarkKey, setWatermarkKey] = useState("");
    const [watermarkedFileUrl, setWatermarkedFileUrl] = useState<string | null>(null);
    const [extractedKey, setExtractedKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleTabSwitch = (newMode: "embed" | "extract") => {
        setMode(newMode);
        setError(null);
        setExtractedKey(null);
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

        if (mode === "embed" && !watermarkKey.trim()) {
            setError("Please enter a watermark key or payload string.");
            return;
        }

        setLoading(true);
        setError(null);
        setExtractedKey(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            if (mode === "embed") {
                formData.append("watermark_key", watermarkKey);

                const res = await fetch("http://localhost:8000/api/watermark/robust/embed", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) {
                    const errJson = await res.json().catch(() => null);
                    throw new Error(errJson?.detail || `Server status ${res.status}`);
                }

                const blob = await res.blob();
                if (watermarkedFileUrl) URL.revokeObjectURL(watermarkedFileUrl);
                setWatermarkedFileUrl(URL.createObjectURL(blob));
            } else {
                const res = await fetch("http://localhost:8000/api/watermark/robust/extract", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) {
                    const errJson = await res.json().catch(() => null);
                    throw new Error(errJson?.detail || `Server status ${res.status}`);
                }

                const data = await res.json();
                setExtractedKey(data.extracted_key || "No key detected.");
            }
        } catch (err: any) {
            setError(err.message || "Request failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Robust Watermarking (DCT Domain)</h1>
                <p className="text-slate-400 text-sm mt-1">
                    Embed robust watermarks into frequency components (DCT) resilient to JPEG compression and scaling.
                </p>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-4 border-b border-slate-800 pb-3">
                <button
                    onClick={() => handleTabSwitch("embed")}
                    className={`font-semibold pb-1 transition ${mode === "embed"
                            ? "text-cyan-400 border-b-2 border-cyan-400"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                >
                    1. Embed Robust Watermark
                </button>
                <button
                    onClick={() => handleTabSwitch("extract")}
                    className={`font-semibold pb-1 transition ${mode === "extract"
                            ? "text-cyan-400 border-b-2 border-cyan-400"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                >
                    2. Extract Watermark
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

            {/* Input Key (Embed Mode Only) */}
            {mode === "embed" && (
                <div className="space-y-2">
                    <label className="text-sm text-slate-300 font-medium">Robust Seed / Watermark Text</label>
                    <input
                        type="text"
                        value={watermarkKey}
                        onChange={(e) => setWatermarkKey(e.target.value)}
                        placeholder="e.g. CIPHER-VAULT-2026"
                        className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none transition"
                    />
                </div>
            )}

            {/* Submit Action Button */}
            <button
                onClick={handleSubmit}
                disabled={loading || !file}
                className="w-full py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
                {loading
                    ? "Processing..."
                    : mode === "embed"
                        ? "Embed Robust Watermark"
                        : "Extract Watermark"}
            </button>

            {/* Error Container */}
            {error && (
                <div className="p-4 bg-red-950/50 border border-red-800/60 rounded-xl text-red-400 text-sm overflow-x-auto">
                    {error}
                </div>
            )}

            {/* Download Embed Result */}
            {watermarkedFileUrl && mode === "embed" && (
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                    <h2 className="text-lg font-semibold text-white">Watermarked Output</h2>
                    <div className="flex justify-center bg-slate-950 p-4 rounded-xl">
                        <img
                            src={watermarkedFileUrl}
                            alt="Robust Watermarked Image"
                            className="max-h-96 rounded-lg object-contain"
                        />
                    </div>
                    <a
                        href={watermarkedFileUrl}
                        download={`robust_${file?.name.split(".")[0] || "image"}.png`}
                        className="inline-block w-full text-center py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition"
                    >
                        Download Watermarked File
                    </a>
                </div>
            )}

            {/* Extracted Key Result */}
            {extractedKey && mode === "extract" && (
                <div className="p-6 bg-slate-900 border border-emerald-800/60 rounded-2xl space-y-2">
                    <h2 className="text-sm text-emerald-400 font-semibold">Extracted Watermark Payload:</h2>
                    <div className="p-4 bg-slate-950 rounded-xl font-mono text-cyan-300 text-lg break-all border border-slate-800">
                        {extractedKey}
                    </div>
                </div>
            )}
        </div>
    );
}