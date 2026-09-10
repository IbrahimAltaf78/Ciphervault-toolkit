"use client";

import React, { useState } from "react";

export default function VideoStegoPage() {
    // 1. Changed default active tab to "hide"
    const [activeTab, setActiveTab] = useState<"hide" | "extract">("hide");

    // Form states
    const [file, setFile] = useState<File | null>(null);
    const [secretText, setSecretText] = useState("");
    const [password, setPassword] = useState("");

    // Drag-and-drop state
    const [isDragging, setIsDragging] = useState(false);

    // UI state feedback
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [outputVideo, setOutputVideo] = useState<string | null>(null);
    const [outputFilename, setOutputFilename] = useState("stego_video.avi");
    const [extractedMessage, setExtractedMessage] = useState<string | null>(null);

    // Drag and Drop Event Handlers
    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            setFile(droppedFile);
            e.dataTransfer.clearData();
        }
    };

    const downloadBase64Video = (base64Data: string, filename: string) => {
        try {
            const base64String = base64Data.includes("base64,")
                ? base64Data.split("base64,")[1]
                : base64Data;

            const byteCharacters = atob(base64String);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "video/x-msvideo" });

            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename || "stego_video.avi";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (err) {
            setError("Failed to convert video file for download.");
        }
    };

    const handleTabChange = (tab: "hide" | "extract") => {
        setActiveTab(tab);
        setFile(null);
        setSecretText("");
        setPassword("");
        setError(null);
        setSuccess(null);
        setOutputVideo(null);
        setExtractedMessage(null);
        setIsDragging(false);
    };

    const handleHideSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return setError("Please select a video carrier file.");
        if (!secretText) return setError("Please enter a secret message to embed.");

        setLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append("video", file);
        formData.append("secretText", secretText);
        if (password) formData.append("password", password);

        try {
            const res = await fetch("http://127.0.0.1:8000/api/stego/video/hide", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (!res.ok || data.success === false) {
                throw new Error(data.error?.message || data.detail || "Embedding failed.");
            }

            setOutputVideo(data.data.video);
            setOutputFilename(data.data.filename || "stego_video.avi");
            setSuccess("Payload hidden in video successfully!");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExtractSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return setError("Please select a stego video file.");

        if (file.size === 0) {
            return setError("Uploaded file is empty (0 bytes received). Please check your selected file.");
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        setExtractedMessage(null);

        const formData = new FormData();
        formData.append("video", file);
        if (password) formData.append("password", password);

        try {
            const res = await fetch("http://127.0.0.1:8000/api/stego/video/extract", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (!res.ok || data.success === false) {
                throw new Error(data.error?.message || data.detail || "Extraction failed.");
            }

            const finalSecret = data.data?.secretText || data.data?.secret_text || data.secret_text;

            if (!finalSecret) {
                throw new Error("Could not find hidden text or correct password was not provided.");
            }

            setExtractedMessage(finalSecret);
            setSuccess("Secret payload extracted successfully!");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="text-phos-white font-sans flex flex-col relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>

            {/* Main Content */}
            <main className="flex-1 relative z-10 flex flex-col items-center justify-start pt-12 px-4 pb-20 overflow-y-auto">
                <h1 className="text-2xl font-bold text-white mb-6">Video Steganography</h1>

                {/* Tab Buttons */}
                <div className="flex space-x-4 mb-8">
                    <button
                        onClick={() => handleTabChange("hide")}
                        className={`px-6 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === "hide"
                                ? "bg-[#60A5FA] text-black shadow-[0_0_10px_rgba(0,230,118,0.4)]"
                                : "bg-[#0b0e13] text-[#60A5FA] border border-[#212832] hover:bg-[#161c24]"
                            }`}
                    >
                        Hide Data
                    </button>
                    <button
                        onClick={() => handleTabChange("extract")}
                        className={`px-6 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === "extract"
                                ? "bg-[#60A5FA] text-black shadow-[0_0_10px_rgba(0,230,118,0.4)]"
                                : "bg-[#0b0e13] text-[#60A5FA] border border-[#212832] hover:bg-[#161c24]"
                            }`}
                    >
                        Extract Data
                    </button>
                </div>

                {/* Main Form Container */}
                <div className="bg-[#07080a] border border-[#212832] rounded-xl p-6 w-full max-w-2xl shadow-2xl">
                    {error && (
                        <div className="mb-5 p-3 bg-red-950/40 border border-red-800/80 rounded-md text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-5 p-3 bg-phos-deep/40 border border-[#60A5FA]/50 rounded-md text-[#60A5FA] text-sm">
                            {success}
                        </div>
                    )}

                    {activeTab === "hide" ? (
                        <form onSubmit={handleHideSubmit} className="space-y-6">

                            {/* Upload Area */}
                            <div>
                                <label className="block text-xs font-bold text-[#60A5FA] mb-2 tracking-wide uppercase">
                                    Upload Carrier Video (MP4/AVI)
                                </label>
                                <label
                                    htmlFor="video-upload"
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${isDragging
                                            ? "border-[#60A5FA] bg-[#161c24] scale-[1.01]"
                                            : "border-[#212832] bg-[#0b0e13] hover:bg-[#161c24]"
                                        }`}
                                >
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-8 h-8 mb-3 text-[#60A5FA]">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                                    </svg>
                                    <span className="text-sm font-medium text-[#60A5FA]">
                                        {file ? file.name : isDragging ? "Drop video here..." : "Click or drag & drop video file"}
                                    </span>
                                </label>
                                <input
                                    id="video-upload"
                                    type="file"
                                    accept="video/mp4,video/avi"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                            </div>

                            {/* Secret Text Area */}
                            <div>
                                <label className="block text-xs font-bold text-[#60A5FA] mb-2 tracking-wide uppercase">
                                    Secret Text
                                </label>
                                <textarea
                                    rows={3}
                                    value={secretText}
                                    onChange={(e) => setSecretText(e.target.value)}
                                    placeholder="Enter secret text to encode..."
                                    className="w-full bg-[#0b0e13] border border-[#212832] rounded-md p-3 text-sm text-[#60A5FA] focus:outline-none focus:border-[#60A5FA] placeholder-[#27303c] resize-none"
                                />
                            </div>

                            {/* Passphrase Input */}
                            <div>
                                <label className="flex items-center text-xs font-bold text-[#60A5FA] mb-2 tracking-wide uppercase">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5 mr-1.5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                    Passphrase (Optional)
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Optional AES passphrase..."
                                    className="w-full bg-[#0b0e13] border border-[#212832] rounded-md p-3 text-sm text-[#60A5FA] focus:outline-none focus:border-[#60A5FA] placeholder-[#27303c]"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center py-3 bg-[#27303c] hover:bg-[#3a4553] text-[#60A5FA] hover:text-white font-bold text-sm rounded-md transition-all"
                            >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4 mr-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                {loading ? "Embedding..." : "Encode Secret Video"}
                            </button>

                        </form>
                    ) : (
                        <form onSubmit={handleExtractSubmit} className="space-y-6">

                            {/* Upload Area */}
                            <div>
                                <label className="block text-xs font-bold text-[#60A5FA] mb-2 tracking-wide uppercase">
                                    Upload Stego Video (MP4/AVI)
                                </label>
                                <label
                                    htmlFor="stego-upload"
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${isDragging
                                            ? "border-[#60A5FA] bg-[#161c24] scale-[1.01]"
                                            : "border-[#212832] bg-[#0b0e13] hover:bg-[#161c24]"
                                        }`}
                                >
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-8 h-8 mb-3 text-[#60A5FA]">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                                    </svg>
                                    <span className="text-sm font-medium text-[#60A5FA]">
                                        {file ? file.name : isDragging ? "Drop video here..." : "Click or drag & drop stego video file"}
                                    </span>
                                </label>
                                <input
                                    id="stego-upload"
                                    type="file"
                                    accept="video/mp4,video/avi"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                            </div>

                            {/* Passphrase Input */}
                            <div>
                                <label className="flex items-center text-xs font-bold text-[#60A5FA] mb-2 tracking-wide uppercase">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5 mr-1.5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                    Passphrase (Required if encrypted)
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter decryption passphrase..."
                                    className="w-full bg-[#0b0e13] border border-[#212832] rounded-md p-3 text-sm text-[#60A5FA] focus:outline-none focus:border-[#60A5FA] placeholder-[#27303c]"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center py-3 bg-[#27303c] hover:bg-[#3a4553] text-[#60A5FA] hover:text-white font-bold text-sm rounded-md transition-all"
                            >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4 mr-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg>
                                {loading ? "Extracting..." : "Extract Data from Video"}
                            </button>
                        </form>
                    )}

                    {/* Output Areas */}
                    {outputVideo && activeTab === "hide" && (
                        <div className="mt-6 border-t border-[#212832] pt-6 text-center">
                            <button
                                onClick={() => downloadBase64Video(outputVideo, outputFilename)}
                                className="inline-flex items-center justify-center px-6 py-2.5 bg-[#60A5FA] text-black font-bold text-sm rounded-md hover:bg-[#60A5FA] transition-all shadow-[0_0_10px_rgba(0,230,118,0.3)]"
                            >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4 mr-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                Download Stego Video ({outputFilename})
                            </button>
                        </div>
                    )}

                    {extractedMessage && activeTab === "extract" && (
                        <div className="mt-6 border-t border-[#212832] pt-6">
                            <label className="block text-xs font-bold text-[#60A5FA] mb-2 tracking-wide uppercase">
                                Extracted Payload
                            </label>
                            <div className="bg-[#0b0e13] border border-[#60A5FA]/50 rounded-md p-4 text-sm text-[#60A5FA] font-mono whitespace-pre-wrap break-all shadow-[inset_0_0_10px_rgba(0,230,118,0.1)]">
                                {extractedMessage}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}