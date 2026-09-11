"use client";

import React, { useState, ChangeEvent, FormEvent, DragEvent, useRef } from "react";
import { Upload, Lock, Shield, Eye, Download, AlertCircle, RefreshCw, Volume2 } from "lucide-react";
import { describeError } from "@/lib/errors";
import { API_BASE_URL } from "@/lib/backend";


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

            const res = await fetch(`${API_BASE_URL}/api/stego/audio/wav/hide`, {
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
        } catch (err: unknown) {
            setErrorMsg(describeError(err));
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

            const res = await fetch(`${API_BASE_URL}/api/stego/audio/wav/extract`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || data.success === false) {
                throw data.detail || data.error || data;
            }

            setExtractedResult(data.data?.secretText ?? data.secretText ?? "");
        } catch (err: unknown) {
            setErrorMsg(describeError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="text-phos-white py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#60A5FA]">
                        Audio Steganography
                    </h1>
                    <p className="text-xs text-muted">
                        Hide and reveal text payloads inside WAV audio sample byte layers.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => handleTabChange("hide")}
                        className={`px-6 py-2.5 text-xs font-bold rounded-lg transition-colors ${activeTab === "hide"
                                ? "bg-[#60A5FA] text-[#07080a]"
                                : "bg-phos-deep/40 text-[#60A5FA] hover:bg-phos-faint/40"
                            }`}
                    >
                        Hide Data
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange("extract")}
                        className={`px-6 py-2.5 text-xs font-bold rounded-lg transition-colors ${activeTab === "extract"
                                ? "bg-[#60A5FA] text-[#07080a]"
                                : "bg-phos-deep/40 text-[#60A5FA] hover:bg-phos-faint/40"
                            }`}
                    >
                        Extract Data
                    </button>
                </div>

                {/* Form Container */}
                <div className="bg-phos-deep/20 border border-edge/40 rounded-xl p-6 space-y-5">
                    {/* File Upload Box */}
                    <div>
                        <label className="block text-xs font-semibold text-[#60A5FA] uppercase tracking-wider mb-2">
                            {activeTab === "hide" ? "Upload Carrier Audio (WAV)" : "Upload Stego Audio (WAV)"}
                        </label>
                        <label
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${isDragging
                                    ? "border-[#60A5FA] bg-phos-faint/30"
                                    : "border-edge/60 bg-phos-deep/40 hover:border-[#60A5FA]"
                                }`}
                        >
                            <Upload className={`h-8 w-8 mb-2 ${isDragging ? "text-[#60A5FA]" : "text-muted/70"}`} />
                            <span className="text-xs font-medium text-phos-white text-center break-all">
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
                        <div className="space-y-2 bg-phos-void/80 p-4 rounded-lg border border-edge/50">
                            <span className="text-xs font-semibold text-[#60A5FA] flex items-center gap-1.5">
                                <Volume2 className="h-4 w-4" /> Selected Audio Preview
                            </span>
                            <audio controls src={audioPreviewUrl} className="w-full h-10" />
                        </div>
                    )}

                    {/* Tab Actions */}
                    {activeTab === "hide" ? (
                        <form onSubmit={handleHideSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#60A5FA] uppercase tracking-wider mb-2">
                                    Secret Text to Hide
                                </label>
                                <textarea
                                    rows={4}
                                    value={secretText}
                                    onChange={(e) => setSecretText(e.target.value)}
                                    placeholder="Enter secret message to embed in audio..."
                                    className="w-full rounded-lg bg-phos-deep/80 border border-edge p-3 text-xs text-phos-white focus:outline-none focus:border-[#60A5FA]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#60A5FA] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Shield className="h-3.5 w-3.5 text-[#60A5FA]" />
                                    Encryption Passphrase (Optional)
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Optional passphrase..."
                                    className="w-full rounded-lg bg-phos-deep/80 border border-edge p-2.5 text-xs text-phos-white focus:outline-none focus:border-[#60A5FA]"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !selectedFile}
                                className="w-full py-3 px-4 rounded-lg bg-[#60A5FA] hover:bg-[#60A5FA] disabled:opacity-50 text-[#07080a] font-bold text-xs transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                                {loading ? "Embedding..." : "Hide Text into Audio"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleExtractSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#60A5FA] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Shield className="h-3.5 w-3.5 text-[#60A5FA]" />
                                    Decryption Passphrase (If encrypted)
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter passphrase if payload was encrypted..."
                                    className="w-full rounded-lg bg-phos-deep/80 border border-edge p-2.5 text-xs text-phos-white focus:outline-none focus:border-[#60A5FA]"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !selectedFile}
                                className="w-full py-3 px-4 rounded-lg bg-[#60A5FA] hover:bg-[#60A5FA] disabled:opacity-50 text-[#07080a] font-bold text-xs transition-colors flex items-center justify-center gap-2"
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
                    <div className="bg-phos-deep/30 border border-edge/60 rounded-xl p-5 space-y-3">
                        <h3 className="text-sm font-bold text-[#60A5FA]">Stego Audio Generated</h3>
                        <audio controls src={stegoAudioResult} className="w-full h-10" />
                        <a
                            href={stegoAudioResult}
                            download={downloadFilename}
                            className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-phos-deep hover:bg-phos-faint text-[#60A5FA] font-semibold text-xs border border-phos-edge/50 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Download Stego Audio
                        </a>
                    </div>
                )}

                {/* Extracted Payload Output */}
                {extractedResult !== null && activeTab === "extract" && (
                    <div className="bg-phos-deep/30 border border-edge/60 rounded-xl p-5 space-y-2">
                        <h3 className="text-xs font-bold text-[#60A5FA] uppercase tracking-wider">
                            Extracted Payload
                        </h3>
                        <div className="p-3 rounded-lg bg-phos-void border border-edge/50 text-phos-white font-mono text-xs whitespace-pre-wrap break-all">
                            {extractedResult || "(No text found)"}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}