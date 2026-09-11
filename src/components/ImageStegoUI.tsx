"use client";

import React, { useState, ChangeEvent, FormEvent, DragEvent, useRef } from "react";
import { Upload, Lock, Shield, Eye, Download, AlertCircle, RefreshCw } from "lucide-react";

interface ImageStegoUIProps {
    initialAlgorithm?: string;
}

// Safely converts FastAPI 422 arrays & nested objects into readable strings
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

/** What each algorithm does to the carrier, in one line. */
const IMAGE_DESCRIPTIONS: Record<string, string> = {
    lsb: "Hide and reveal text payloads in the least significant bit of each pixel's colour channels.",
    dct: "Hide and reveal text payloads in the image's frequency coefficients, so they survive re-compression.",
    dwt: "Hide and reveal text payloads in the wavelet sub-bands, so they survive re-compression.",
};

export default function ImageStegoUI({ initialAlgorithm = "lsb" }: ImageStegoUIProps) {
    const [activeTab, setActiveTab] = useState<"hide" | "extract">("hide");
    const [algorithm, setAlgorithm] = useState(initialAlgorithm);

    // Input states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [secretText, setSecretText] = useState("");
    const [password, setPassword] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    // Response states
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [stegoImageResult, setStegoImageResult] = useState<string | null>(null);
    const [downloadFilename, setDownloadFilename] = useState("stego_image.png");
    const [extractedResult, setExtractedResult] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Reset inputs and results when switching tabs
    const handleTabChange = (tab: "hide" | "extract") => {
        setActiveTab(tab);
        setSelectedFile(null);
        setPreviewUrl(null);
        setSecretText("");
        setPassword("");
        setErrorMsg(null);
        setStegoImageResult(null);
        setExtractedResult(null);
        setIsDragging(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const processFile = (file: File) => {
        setErrorMsg(null);
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setStegoImageResult(null);
        setExtractedResult(null);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    // Drag and Drop Event Handlers
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
            setErrorMsg("Please upload a cover image first.");
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
            formData.append("image", selectedFile);
            formData.append("secretText", secretText);
            formData.append("algorithm", algorithm);
            if (password.trim()) {
                formData.append("password", password.trim());
            }

            const res = await fetch("http://127.0.0.1:8000/api/stego/image/hide", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || data.success === false) {
                throw data.detail || data.error || data;
            }

            setStegoImageResult(data.data?.image || data.image);
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
            setErrorMsg("Please upload the stego image to extract data from.");
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        try {
            const formData = new FormData();
            formData.append("image", selectedFile);
            formData.append("algorithm", algorithm);
            if (password.trim()) {
                formData.append("password", password.trim());
            }

            const res = await fetch("http://127.0.0.1:8000/api/stego/image/extract", {
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
        <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-extrabold text-[#60A5FA]">
                    Image Steganography ({algorithm.toUpperCase()})
                </h1>
                {/* One line on what this carrier does, matching the audio and
                    video tools. It follows the algorithm picker, because LSB
                    and the frequency methods make different promises. */}
                <p className="text-xs text-muted">
                    {IMAGE_DESCRIPTIONS[algorithm] ?? IMAGE_DESCRIPTIONS.lsb}
                </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex justify-center gap-3">
                <button
                    type="button"
                    onClick={() => handleTabChange("hide")}
                    className={`px-5 py-2 text-xs font-semibold rounded-lg transition-colors ${activeTab === "hide"
                            ? "bg-[#60A5FA] text-[#07080a] font-bold"
                            : "bg-phos-deep/40 text-[#60A5FA] hover:bg-phos-faint/40"
                        }`}
                >
                    Hide Data
                </button>
                <button
                    type="button"
                    onClick={() => handleTabChange("extract")}
                    className={`px-5 py-2 text-xs font-semibold rounded-lg transition-colors ${activeTab === "extract"
                            ? "bg-[#60A5FA] text-[#07080a] font-bold"
                            : "bg-phos-deep/40 text-[#60A5FA] hover:bg-phos-faint/40"
                        }`}
                >
                    Extract Data
                </button>
            </div>

            <div className="bg-phos-deep/20 border border-edge/40 rounded-xl p-6 space-y-5">
                {/* Algorithm Selection */}
                <div>
                    <label className="block text-xs font-semibold text-[#60A5FA] uppercase tracking-wider mb-2">
                        Algorithm
                    </label>
                    <select
                        value={algorithm}
                        onChange={(e) => setAlgorithm(e.target.value)}
                        className="w-full rounded-lg bg-phos-deep/80 border border-edge p-2.5 text-xs text-phos-white focus:outline-none focus:border-[#60A5FA]"
                    >
                        <option value="lsb">LSB (Least Significant Bit)</option>
                        <option value="dwt">DWT (Discrete Wavelet Transform)</option>
                    </select>
                </div>

                {/* Drag & Drop File Area */}
                <div>
                    <label className="block text-xs font-semibold text-[#60A5FA] uppercase tracking-wider mb-2">
                        {activeTab === "hide" ? "Upload Cover Image (PNG/BMP)" : "Upload Stego Image (PNG/BMP)"}
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
                                    ? "Drop image here..."
                                    : `Click or drag & drop ${activeTab === "hide" ? "cover" : "stego"} image file`}
                        </span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png, image/bmp, image/jpeg"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>
                </div>

                {/* Preview */}
                {previewUrl && (
                    <div className="flex justify-center bg-phos-void/80 p-3 rounded-lg border border-edge/50 max-h-48 overflow-hidden">
                        <img src={previewUrl} alt="Preview" className="object-contain max-h-40 rounded" />
                    </div>
                )}

                {/* Form Controls */}
                {activeTab === "hide" ? (
                    <form onSubmit={handleHideSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-[#60A5FA] uppercase tracking-wider mb-2">
                                Secret Text
                            </label>
                            <textarea
                                rows={3}
                                value={secretText}
                                onChange={(e) => setSecretText(e.target.value)}
                                placeholder="Enter secret text to encode..."
                                className="w-full rounded-lg bg-phos-deep/80 border border-edge p-3 text-xs text-phos-white focus:outline-none focus:border-[#60A5FA]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#60A5FA] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Shield className="h-3.5 w-3.5 text-[#60A5FA]" />
                                Passphrase (Optional)
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Optional AES passphrase..."
                                className="w-full rounded-lg bg-phos-deep/80 border border-edge p-2.5 text-xs text-phos-white focus:outline-none focus:border-[#60A5FA]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !selectedFile}
                            className="w-full py-3 px-4 rounded-lg bg-[#60A5FA] hover:bg-[#60A5FA] disabled:opacity-50 text-[#07080a] font-bold text-xs transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                            {loading ? "Encoding..." : "Encode Secret Image"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleExtractSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-[#60A5FA] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Shield className="h-3.5 w-3.5 text-[#60A5FA]" />
                                Passphrase (If encrypted)
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter passphrase..."
                                className="w-full rounded-lg bg-phos-deep/80 border border-edge p-2.5 text-xs text-phos-white focus:outline-none focus:border-[#60A5FA]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !selectedFile}
                            className="w-full py-3 px-4 rounded-lg bg-[#60A5FA] hover:bg-[#60A5FA] disabled:opacity-50 text-[#07080a] font-bold text-xs transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                            {loading ? "Extracting..." : "Extract Text from Image"}
                        </button>
                    </form>
                )}

                {/* Clean Error Message Display */}
                {errorMsg && (
                    <div className="rounded-lg bg-red-950/70 border border-red-800 p-3 text-xs text-red-200 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        <div className="break-all font-mono">{errorMsg}</div>
                    </div>
                )}
            </div>

            {/* Encoded Result */}
            {stegoImageResult && activeTab === "hide" && (
                <div className="bg-phos-deep/30 border border-edge/60 rounded-xl p-5 space-y-3 text-center">
                    <h3 className="text-sm font-bold text-[#60A5FA]">Stego Image Ready</h3>
                    <div className="flex justify-center bg-phos-void p-3 rounded-lg border border-edge/50">
                        <img src={stegoImageResult} alt="Stego Output" className="max-h-48 object-contain rounded" />
                    </div>
                    <a
                        href={stegoImageResult}
                        download={downloadFilename}
                        className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-phos-deep hover:bg-phos-faint text-[#60A5FA] font-semibold text-xs border border-phos-edge/50 transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Download Encoded Image
                    </a>
                </div>
            )}

            {/* Extracted Output Result */}
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
    );
}