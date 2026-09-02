"use client";

import { useState, useRef, useEffect } from "react";

export default function VideoStegoPage() {
    const [tab, setTab] = useState<"hide" | "extract">("hide");
    const [file, setFile] = useState<File | null>(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
    const [secretText, setSecretText] = useState("");
    const [extractedText, setExtractedText] = useState("");
    const [loading, setLoading] = useState(false);
    const [stegoVideoUrl, setStegoVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Clean up created object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
            if (stegoVideoUrl) URL.revokeObjectURL(stegoVideoUrl);
        };
    }, [filePreviewUrl, stegoVideoUrl]);

    const handleTabChange = (newTab: "hide" | "extract") => {
        setTab(newTab);
        setError(null);
        setExtractedText("");
    };

    const handleFileSelect = (selectedFile: File) => {
        if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
        if (stegoVideoUrl) URL.revokeObjectURL(stegoVideoUrl);

        setFile(selectedFile);
        setFilePreviewUrl(URL.createObjectURL(selectedFile));
        setStegoVideoUrl(null);
        setError(null);
    };

    const handleSubmit = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            if (tab === "hide") {
                formData.append("secret_text", secretText);
                const res = await fetch("http://localhost:8000/api/stego/video/hide", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) {
                    throw new Error("Failed to encode hidden text into video.");
                }

                const blob = await res.blob();
                if (stegoVideoUrl) URL.revokeObjectURL(stegoVideoUrl);

                // Store Blob URL in state instead of auto-downloading
                const url = URL.createObjectURL(blob);
                setStegoVideoUrl(url);
            } else {
                const res = await fetch("http://localhost:8000/api/stego/video/extract", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) {
                    throw new Error("Failed to extract hidden text from video.");
                }

                const data = await res.json();
                setExtractedText(data.secret_text || data.extracted_text || "No hidden payload found.");
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred during processing.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Tab Switcher */}
            <div className="flex space-x-4 border-b border-slate-700 mb-6">
                <button
                    onClick={() => handleTabChange("hide")}
                    className={`pb-2 px-4 font-medium transition-colors ${tab === "hide"
                            ? "border-b-2 border-cyan-400 text-cyan-400"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                >
                    🔒 Hide Data
                </button>
                <button
                    onClick={() => handleTabChange("extract")}
                    className={`pb-2 px-4 font-medium transition-colors ${tab === "extract"
                            ? "border-b-2 border-cyan-400 text-cyan-400"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                >
                    🔑 Extract Data
                </button>
            </div>

            {error && (
                <div className="bg-red-950/50 border border-red-500/50 text-red-300 p-4 rounded-xl mb-6 text-sm">
                    {error}
                </div>
            )}

            {/* Drag & Drop File Input */}
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
                }}
                className="border-2 border-dashed border-cyan-500/30 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-400 transition mb-6"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/avi,video/mp4"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                <p className="text-slate-300 font-medium">
                    {file ? file.name : "Click to upload or drag .avi / .mp4 video file"}
                </p>
            </div>

            {/* Source Video Preview */}
            {filePreviewUrl && (
                <div className="mb-6 bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                    <p className="text-xs text-slate-400 font-medium">Original Video Preview:</p>
                    <video controls src={filePreviewUrl} className="w-full max-h-64 rounded-lg bg-black" />
                </div>
            )}

            {tab === "hide" ? (
                <div className="space-y-4 mb-6">
                    <textarea
                        value={secretText}
                        onChange={(e) => setSecretText(e.target.value)}
                        placeholder="Enter secret message to embed..."
                        rows={4}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-400"
                    />
                </div>
            ) : (
                extractedText && (
                    <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-4 text-cyan-300 mb-6">
                        <p className="font-semibold text-sm mb-1">Extracted Payload:</p>
                        <p className="font-mono text-slate-100 break-words">{extractedText}</p>
                    </div>
                )
            )}

            <button
                onClick={handleSubmit}
                disabled={loading || !file || (tab === "hide" && !secretText)}
                className="w-full py-3 bg-cyan-500 text-black font-semibold rounded-xl hover:bg-cyan-400 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed mb-6"
            >
                {loading
                    ? "Processing..."
                    : tab === "hide"
                        ? "Hide Text into Video"
                        : "Extract Text from Video"}
            </button>

            {/* Output Stego Video & Manual Download Action */}
            {tab === "hide" && stegoVideoUrl && (
                <div className="p-4 bg-slate-900 border border-emerald-500/40 rounded-xl space-y-4">
                    <p className="text-sm font-semibold text-emerald-400">
                        Encoding Complete! Preview or download your output video below:
                    </p>
                    <video controls src={stegoVideoUrl} className="w-full max-h-64 rounded-lg bg-black" />
                    <div>
                        <a
                            href={stegoVideoUrl}
                            download={`stego_${file?.name || "video.mp4"}`}
                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        >
                            Download Stego Video
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}