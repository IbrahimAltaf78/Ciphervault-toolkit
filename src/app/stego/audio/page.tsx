"use client";

import React, { useState, ChangeEvent, FormEvent, DragEvent, useRef } from "react";
import { Upload, Lock, Shield, Eye, Download, AlertCircle, RefreshCw, Music, Volume2 } from "lucide-react";

const formatError = (err: any): string => {
    if (!err) return "An unexpected error occurred.";
    if (typeof err === "string") return err;

    if (Array.isArray(err)) {
        return err
            .map((item) => {
                if (typeof item === "object" && item !== null) {
                    const loc = item.loc ? item.loc.join(" -> ") : "";
                    const msg = item.msg || JSON.stringify(item);
                    return loc ? `${loc}: ${msg}` : msg;
                }
                return String(item);
            })
            .join(" | ");
    }

    if (typeof err === "object") {
        if (err.detail) return formatError(err.detail);
        if (err.message) return formatError(err.message);
        if (err.error) return formatError(err.error);
        return JSON.stringify(err);
    }

    return String(err);
};

export default function AudioStegoPage() {
    const [activeTab, setActiveTab] = useState<"hide" | "extract">("hide");

    // Input states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
    const [secretText, setSecretText] = useState("");
    const [password, setPassword] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    // Response states
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [stegoAudioResult, setStegoAudioResult] = useState<string | null>(null);
    const [downloadFilename, setDownloadFilename] = useState("stego_audio.wav");
    const [extractedResult, setExtractedResult] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleTabChange = (tab: "hide" | "extract") => {
        setActiveTab(tab);
        setSelectedFile(null);
        setAudioPreviewUrl(null);
        setSecretText("");
        setPassword("");
        setErrorMsg(null);
        setStegoAudioResult(null);
        setExtractedResult(null);
        setIsDragging(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const processFile = (file: File) => {
        setErrorMsg(null);
        setSelectedFile(file);
        setAudioPreviewUrl(URL.createObjectURL(file));
        setStegoAudioResult(null);
        setExtractedResult(null);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleHideSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            setErrorMsg("Please upload a WAV audio file first.");
            return;
        }
        if (!secretText.trim()) {
            setErrorMsg("Please enter secret text to hide.");
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        try {
            const formData = new FormData();
            formData.append("audio", selectedFile);
            formData.append("secretText", secretText);
            if (password.trim()) {
                formData.append("password", password.trim());
            }

            const res = await fetch("http://127.0.0.1:8000/api/stego/audio/wav/hide", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || data.success === false) {
                throw data.detail || data.error || data;
            }

            setStegoAudioResult(data.data?.audio || data.audio);
            if (data.data?.filename || data.filename) {
                setDownloadFilename(data.data?.filename || data.filename);
            }
        } catch (err: any) {
            setErrorMsg(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleExtractSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            setErrorMsg("Please upload the stego audio file to extract data from.");
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        try {
            const formData = new FormData();
            formData.append("audio", selectedFile);
            if (password.trim()) {
                formData.append("password", password.trim());
            }

            const res = await fetch("http://127.0.0.1:8000/api/stego/audio/wav/extract", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || data.success === false) {
                throw data.detail || data.error || data;
            }

            setExtractedResult(data.data?.secretText ?? data.secretText ?? "");
        } catch (err: any) {
            setErrorMsg(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                        <Music className="h-4 w-4" />
                        <span>LSB Audio Steganography</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-emerald-400">
                        Audio Steganography
                    </h1>
                    <p className="text-xs text-slate-400">
                        Hide and reveal text payloads inside WAV audio sample byte layers.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => handleTabChange("hide")}
                        className={`px-6 py-2.5 text-xs font-bold rounded-lg transition-colors ${activeTab === "hide"
                                ? "bg-emerald-500 text-slate-950"
                                : "bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40"
                            }`}
                    >
                        Hide Data
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange("extract")}
                        className={`px-6 py-2.5 text-xs font-bold rounded-lg transition-colors ${activeTab === "extract"
                                ? "bg-emerald-500 text-slate-950"
                                : "bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40"
                            }`}
                    >
                        Extract Data
                    </button>
                </div>

                {/* Form Container */}
                <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-6 space-y-5">
                    {/* File Upload Box */}
                    <div>
                        <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">
                            {activeTab === "hide" ? "Upload Carrier Audio (WAV)" : "Upload Stego Audio (WAV)"}
                        </label>
                        <label
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${isDragging
                                    ? "border-emerald-400 bg-emerald-900/30"
                                    : "border-emerald-800/60 bg-emerald-950/40 hover:border-emerald-500"
                                }`}
                        >
                            <Upload className={`h-8 w-8 mb-2 ${isDragging ? "text-emerald-400" : "text-emerald-500/70"}`} />
                            <span className="text-xs font-medium text-emerald-200 text-center break-all">
                                {selectedFile
                                    ? selectedFile.name
                                    : isDragging
                                        ? "Drop audio file here..."
                                        : `Click or drag & drop ${activeTab === "hide" ? "carrier" : "stego"} WAV audio file`}
                            </span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="audio/wav, audio/x-wav, audio/mp3"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* Audio Player Preview */}
                    {audioPreviewUrl && (
                        <div className="space-y-2 bg-slate-950/80 p-4 rounded-lg border border-emerald-900/50">
                            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                                <Volume2 className="h-4 w-4" /> Selected Audio Preview
                            </span>
                            <audio controls src={audioPreviewUrl} className="w-full h-10" />
                        </div>
                    )}

                    {/* Tab Actions */}
                    {activeTab === "hide" ? (
                        <form onSubmit={handleHideSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">
                                    Secret Text to Hide
                                </label>
                                <textarea
                                    rows={4}
                                    value={secretText}
                                    onChange={(e) => setSecretText(e.target.value)}
                                    placeholder="Enter secret message to embed in audio..."
                                    className="w-full rounded-lg bg-emerald-950/80 border border-emerald-800 p-3 text-xs text-emerald-100 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                                    Encryption Passphrase (Optional)
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Optional passphrase..."
                                    className="w-full rounded-lg bg-emerald-950/80 border border-emerald-800 p-2.5 text-xs text-emerald-100 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !selectedFile}
                                className="w-full py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                                {loading ? "Embedding..." : "Hide Text into Audio"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleExtractSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                                    Decryption Passphrase (If encrypted)
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter passphrase if payload was encrypted..."
                                    className="w-full rounded-lg bg-emerald-950/80 border border-emerald-800 p-2.5 text-xs text-emerald-100 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !selectedFile}
                                className="w-full py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                {loading ? "Extracting..." : "Extract Text from Audio"}
                            </button>
                        </form>
                    )}

                    {/* Error Message Box */}
                    {errorMsg && (
                        <div className="rounded-lg bg-red-950/70 border border-red-800 p-3 text-xs text-red-200 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                            <div className="break-all font-mono">{errorMsg}</div>
                        </div>
                    )}
                </div>

                {/* Generated Stego Audio Output */}
                {stegoAudioResult && activeTab === "hide" && (
                    <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-xl p-5 space-y-3">
                        <h3 className="text-sm font-bold text-emerald-400">Stego Audio Generated</h3>
                        <audio controls src={stegoAudioResult} className="w-full h-10" />
                        <a
                            href={stegoAudioResult}
                            download={downloadFilename}
                            className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-400 font-semibold text-xs border border-emerald-700/50 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Download Stego Audio
                        </a>
                    </div>
                )}

                {/* Extracted Payload Output */}
                {extractedResult !== null && activeTab === "extract" && (
                    <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-xl p-5 space-y-2">
                        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                            Extracted Payload
                        </h3>
                        <div className="p-3 rounded-lg bg-slate-950 border border-emerald-900/50 text-emerald-100 font-mono text-xs whitespace-pre-wrap break-all">
                            {extractedResult || "(No text found)"}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}