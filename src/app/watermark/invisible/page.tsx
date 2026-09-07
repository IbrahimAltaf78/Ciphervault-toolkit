"use client";

import { useState, DragEvent, ChangeEvent } from "react";

export default function InvisibleWatermarkPage() {
    const [mode, setMode] = useState<"embed" | "extract">("embed");
    const [file, setFile] = useState<File | null>(null);
    const [secretData, setSecretData] = useState("");
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [extractedMessage, setExtractedMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Reset states when switching tabs
    const handleTabSwitch = (newMode: "embed" | "extract") => {
        setMode(newMode);
        setError(null);
        setExtractedMessage(null);
    };

    // File Drag & Drop Handling
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
        if (mode === "embed" && !secretData.trim()) {
            setError("Please provide secret text payload to embed.");
            return;
        }

        setLoading(true);
        setError(null);
        setExtractedMessage(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            if (mode === "embed") {
                formData.append("secret_data", secretData);
                const res = await fetch("http://localhost:8000/api/watermark/invisible/embed", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) {
                    const errorJson = await res.json().catch(() => null);
                    throw new Error(errorJson?.detail || `Server returned error status ${res.status}`);
                }

                const blob = await res.blob();
                if (resultUrl) URL.revokeObjectURL(resultUrl);
                setResultUrl(URL.createObjectURL(blob));
            } else {
                const res = await fetch("http://localhost:8000/api/watermark/invisible/extract", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) {
                    const errorJson = await res.json().catch(() => null);
                    throw new Error(errorJson?.detail || `Server returned error status ${res.status}`);
                }

                const data = await res.json();
                if (data.success) {
                    setExtractedMessage(data.secret_data);
                } else {
                    setExtractedMessage(data.detail || "No watermark detected.");
                }
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold text-white">Invisible Watermarking (LSB)</h1>
            <p className="text-phos-dim text-sm">
                Hide or extract secret text inside image pixel data with zero visible distortion.
            </p>

            {/* Mode Selector Tabs */}
            <div className="flex gap-4 border-b border-phos-line pb-3">
                <button
                    onClick={() => handleTabSwitch("embed")}
                    className={`font-semibold pb-1 transition ${mode === "embed"
                            ? "text-phos-hot border-b-2 border-phos-hot"
                            : "text-phos-dim hover:text-phos-white"
                        }`}
                >
                    Embed Watermark
                </button>
                <button
                    onClick={() => handleTabSwitch("extract")}
                    className={`font-semibold pb-1 transition ${mode === "extract"
                            ? "text-phos-hot border-b-2 border-phos-hot"
                            : "text-phos-dim hover:text-phos-white"
                        }`}
                >
                    Extract Watermark
                </button>
            </div>

            {/* Drag & Drop Upload Container */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer bg-phos-deep/50 ${isDragging
                        ? "border-phos-hot bg-phos-deep/20"
                        : file
                            ? "border-emerald-500/50 bg-phos-panel/60"
                            : "border-phos-line hover:border-phos-line"
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
                        <p className="text-phos-dim text-xs">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • Click or drag to replace
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="text-phos-dim font-medium text-base">
                            Drag and drop your image here
                        </div>
                        <p className="text-phos-dim text-xs">or click to browse from your device</p>
                    </div>
                )}
            </div>

            {/* Secret Payload Input (Embed mode only) */}
            {mode === "embed" && (
                <div className="space-y-2">
                    <label className="text-phos-dim text-sm font-medium">Secret Payload</label>
                    <input
                        type="text"
                        value={secretData}
                        onChange={(e) => setSecretData(e.target.value)}
                        placeholder="Secret message to hide..."
                        className="w-full bg-phos-panel border border-phos-line focus:border-phos rounded-xl p-3 text-white outline-none transition"
                    />
                </div>
            )}

            {/* Action Button */}
            <button
                onClick={handleSubmit}
                disabled={loading || !file || (mode === "embed" && !secretData.trim())}
                className="w-full py-3 bg-phos text-phos-deep font-semibold rounded-xl hover:bg-phos-hot disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
                {loading
                    ? "Processing..."
                    : mode === "embed"
                        ? "Embed Watermark"
                        : "Extract Watermark"}
            </button>

            {/* Error Message Display */}
            {error && (
                <div className="p-4 bg-red-950/50 border border-red-800/60 rounded-xl text-red-400 text-sm overflow-x-auto">
                    {error}
                </div>
            )}

            {/* Embed Result */}
            {resultUrl && mode === "embed" && (
                <div className="p-6 bg-phos-panel border border-phos-line rounded-2xl space-y-4">
                    <h2 className="text-lg font-semibold text-white">Stego Image Generated</h2>
                    <div className="flex justify-center bg-phos-deep p-4 rounded-xl">
                        <img
                            src={resultUrl}
                            alt="Watermarked Stego Output"
                            className="max-h-96 rounded-lg object-contain"
                        />
                    </div>
                    <a
                        href={resultUrl}
                        download={`stego_${file?.name.split(".")[0] || "image"}.png`}
                        className="inline-block w-full text-center py-3 bg-emerald-500 hover:bg-emerald-400 text-phos-deep font-bold rounded-xl transition"
                    >
                        Download Watermarked Image (.png)
                    </a>
                </div>
            )}

            {/* Extract Result */}
            {extractedMessage && mode === "extract" && (
                <div className="p-6 bg-phos-panel border border-phos-line rounded-2xl space-y-2">
                    <h2 className="text-phos-dim text-sm font-medium">Extracted Result</h2>
                    <div className="p-4 bg-phos-deep border border-phos-line rounded-xl text-phos-hot font-mono text-base break-all">
                        {extractedMessage}
                    </div>
                </div>
            )}
        </div>
    );
}