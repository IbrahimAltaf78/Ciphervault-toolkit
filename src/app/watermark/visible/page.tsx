"use client";

import { useState, DragEvent, ChangeEvent } from "react";

export default function VisibleWatermarkPage() {
    const [file, setFile] = useState<File | null>(null);
    const [watermarkText, setWatermarkText] = useState("");
    const [watermarkedImageUrl, setWatermarkedImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // File Handling
    const handleFileSelect = (selectedFile: File) => {
        if (selectedFile && selectedFile.type.startsWith("image/")) {
            setFile(selectedFile);
            setError(null);
        } else {
            setError("Please select a valid image file (PNG, JPEG, WEBP).");
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

    // API Submission
    const handleApplyWatermark = async () => {
        if (!file || !watermarkText) return;
        setLoading(true);
        setError(null);

        const formData = new FormData();
        // Updated field names based on FastAPI validation schema
        formData.append("base_image", file);
        formData.append("file", file);
        formData.append("text", watermarkText);
        formData.append("watermark_text", watermarkText);

        try {
            const res = await fetch("http://localhost:8000/api/watermark/visible/embed", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                const errorMessage = errorData?.detail
                    ? typeof errorData.detail === "string"
                        ? errorData.detail
                        : JSON.stringify(errorData.detail)
                    : `Server returned status ${res.status}`;
                throw new Error(errorMessage);
            }

            const blob = await res.blob();
            if (watermarkedImageUrl) URL.revokeObjectURL(watermarkedImageUrl);
            setWatermarkedImageUrl(URL.createObjectURL(blob));
        } catch (err: any) {
            setError(err.message || "Failed to embed visible watermark.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold text-white">Visible Watermarking</h1>
            <p className="text-phos-dim text-sm">
                Overlay text directly onto your image using in-memory byte processing.
            </p>

            {/* Drag & Drop Box */}
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

            {/* Watermark Input */}
            <div className="space-y-2">
                <label className="text-phos-dim text-sm font-medium">Watermark Text</label>
                <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="Enter visible watermark text..."
                    className="w-full bg-phos-panel border border-phos-line focus:border-phos rounded-xl p-3 text-white outline-none transition"
                />
            </div>

            {/* Embed Button */}
            <button
                onClick={handleApplyWatermark}
                disabled={loading || !file || !watermarkText.trim()}
                className="w-full py-3 bg-phos text-phos-deep font-semibold rounded-xl hover:bg-phos-hot disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
                {loading ? "Embedding Watermark..." : "Embed Visible Watermark"}
            </button>

            {/* Error Feedback */}
            {error && (
                <div className="p-4 bg-red-950/50 border border-red-800/60 rounded-xl text-red-400 text-sm overflow-x-auto">
                    {error}
                </div>
            )}

            {/* Result Display & Download */}
            {watermarkedImageUrl && (
                <div className="p-6 bg-phos-panel border border-phos-line rounded-2xl space-y-4">
                    <h2 className="text-lg font-semibold text-white">Watermarked Output</h2>
                    <div className="flex justify-center bg-phos-deep p-4 rounded-xl">
                        <img
                            src={watermarkedImageUrl}
                            alt="Watermarked Result"
                            className="max-h-96 rounded-lg object-contain"
                        />
                    </div>
                    <a
                        href={watermarkedImageUrl}
                        download={`watermarked_${file?.name || "image.png"}`}
                        className="inline-block w-full text-center py-3 bg-emerald-500 hover:bg-emerald-400 text-phos-deep font-bold rounded-xl transition"
                    >
                        Download Watermarked Image
                    </a>
                </div>
            )}
        </div>
    );
}