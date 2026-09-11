"use client";

import { useState, ChangeEvent, FormEvent, DragEvent, useRef } from "react";
import { Upload, Lock, Shield, Eye, Download, AlertCircle, RefreshCw } from "lucide-react";
import { describeError } from "@/lib/errors";
import { API_BASE_URL } from "@/lib/backend";

export default function ImageStegoPage() {
    const [activeTab, setActiveTab] = useState<"hide" | "extract">("hide");

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

    // Clear state when switching tabs
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

    // Drag and drop event handlers
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
            setErrorMsg("Please select an image file first.");
            return;
        }
        if (!secretText.trim()) {
            setErrorMsg("Please enter text to hide.");
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        try {
            const formData = new FormData();
            formData.append("image", selectedFile);
            formData.append("secretText", secretText);
            if (password.trim()) {
                formData.append("password", password.trim());
            }

            const res = await fetch(`${API_BASE_URL}/api/stego/image/hide`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || data.success === false) {
                throw new Error(data?.error?.message || data?.detail || "Failed to embed text into image.");
            }

            setStegoImageResult(data.data.image);
            if (data.data.filename) {
                setDownloadFilename(data.data.filename);
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
            setErrorMsg("Please select the stego image file (e.g. stego_lsb_...) to extract data from.");
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        try {
            const formData = new FormData();
            formData.append("image", selectedFile);
            if (password.trim()) {
                formData.append("password", password.trim());
            }

            const res = await fetch(`${API_BASE_URL}/api/stego/image/extract`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || data.success === false) {
                throw new Error(data?.error?.message || data?.detail || "Failed to extract text from image.");
            }

            setExtractedResult(data.data.secretText);
        } catch (err: unknown) {
            setErrorMsg(describeError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="text-phos-white py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-phos-white">
                        Image Steganography
                    </h1>
                    <p className="text-sm text-phos-dim">
                        Hide and reveal secret text inside PNG bit planes with optional AES-GCM encryption.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex border-b border-phos-line">
                    <button
                        onClick={() => handleTabChange("hide")}
                        className={`flex items-center gap-2 py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${activeTab === "hide"
                                ? "border-phos text-phos-hot"
                                : "border-transparent text-phos-dim hover:text-phos-white"
                            }`}
                    >
                        <Lock className="h-4 w-4" />
                        Hide Data
                    </button>
                    <button
                        onClick={() => handleTabChange("extract")}
                        className={`flex items-center gap-2 py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${activeTab === "extract"
                                ? "border-phos text-phos-hot"
                                : "border-transparent text-phos-dim hover:text-phos-white"
                            }`}
                    >
                        <Eye className="h-4 w-4" />
                        Extract Data
                    </button>
                </div>

                {/* Error Container */}
                {errorMsg && (
                    <div className="rounded-lg bg-red-950/50 border border-red-500/50 p-4 text-sm text-red-200 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                        <div className="break-all">{errorMsg}</div>
                    </div>
                )}

                {/* Form Area */}
                <div className="bg-phos-panel/60 border border-phos-line rounded-xl p-6 backdrop-blur-sm space-y-6">
                    {/* Image File Upload Area with Drag and Drop */}
                    <div>
                        <label className="block text-xs font-semibold text-phos-dim uppercase tracking-wider mb-2">
                            {activeTab === "hide" ? "Upload Carrier Image (PNG/BMP)" : "Upload Stego Image (PNG/BMP)"}
                        </label>
                        <label
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${isDragging
                                    ? "border-phos-hot bg-phos-deep/20"
                                    : "border-phos-line hover:border-phos/50 bg-phos-deep/40"
                                }`}
                        >
                            <Upload className={`h-8 w-8 mb-2 ${isDragging ? "text-phos-hot" : "text-phos-dim"}`} />
                            <span className="text-sm font-medium text-phos-dim">
                                {selectedFile
                                    ? selectedFile.name
                                    : isDragging
                                        ? "Drop image here..."
                                        : `Click or drag & drop ${activeTab === "hide" ? "carrier" : "stego"} image file`}
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

                    {/* Image Preview */}
                    {previewUrl && (
                        <div className="space-y-2">
                            <span className="text-xs font-semibold text-phos-dim uppercase tracking-wider">
                                {activeTab === "hide" ? "Carrier Image Preview" : "Stego Image Preview"}
                            </span>
                            <div className="flex justify-center bg-phos-deep rounded-lg border border-phos-line p-4 max-h-64 overflow-hidden">
                                <img src={previewUrl} alt="Preview" className="object-contain max-h-56 rounded" />
                            </div>
                        </div>
                    )}

                    {/* Tab: HIDE DATA */}
                    {activeTab === "hide" && (
                        <form onSubmit={handleHideSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-phos-dim uppercase tracking-wider mb-2">
                                    Secret Text to Hide
                                </label>
                                <textarea
                                    rows={4}
                                    value={secretText}
                                    onChange={(e) => setSecretText(e.target.value)}
                                    placeholder="Enter message to embed into image..."
                                    className="w-full rounded-lg bg-phos-deep border border-phos-line p-3 text-sm text-phos-white focus:outline-none focus:border-phos"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-phos-dim uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Shield className="h-3.5 w-3.5 text-phos-hot" />
                                    Encryption Passphrase (Optional)
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Optional password for AES-256-GCM..."
                                    className="w-full rounded-lg bg-phos-deep border border-phos-line p-3 text-sm text-phos-white focus:outline-none focus:border-phos"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !selectedFile}
                                className="w-full py-3 px-4 rounded-lg bg-phos hover:bg-phos-hot disabled:bg-phos-line disabled:text-phos-dim text-phos-deep font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
                                {loading ? "Processing..." : "Hide Text into Image"}
                            </button>
                        </form>
                    )}

                    {/* Tab: EXTRACT DATA */}
                    {activeTab === "extract" && (
                        <form onSubmit={handleExtractSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-phos-dim uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Shield className="h-3.5 w-3.5 text-phos-hot" />
                                    Decryption Passphrase (If encrypted)
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter passphrase if payload was encrypted..."
                                    className="w-full rounded-lg bg-phos-deep border border-phos-line p-3 text-sm text-phos-white focus:outline-none focus:border-phos"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !selectedFile}
                                className="w-full py-3 px-4 rounded-lg bg-phos hover:bg-phos-hot disabled:bg-phos-line disabled:text-phos-dim text-phos-deep font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Eye className="h-5 w-5" />}
                                {loading ? "Extracting..." : "Extract Text from Image"}
                            </button>
                        </form>
                    )}
                </div>

                {/* Results Display */}
                {stegoImageResult && activeTab === "hide" && (
                    <div className="bg-phos-panel/80 border border-phos/30 rounded-xl p-6 space-y-4">
                        <h3 className="text-lg font-bold text-phos-hot">Stego Image Generated</h3>
                        <div className="flex justify-center bg-phos-deep p-4 rounded-lg border border-phos-line">
                            <img src={stegoImageResult} alt="Stego Result" className="max-h-64 object-contain rounded" />
                        </div>
                        <a
                            href={stegoImageResult}
                            download={downloadFilename}
                            className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-phos-line hover:bg-phos-line text-phos-hot font-semibold border border-phos/20 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Download Stego Image
                        </a>
                    </div>
                )}

                {extractedResult !== null && activeTab === "extract" && (
                    <div className="bg-phos-panel/80 border border-phos/30 rounded-xl p-6 space-y-3">
                        <h3 className="text-lg font-bold text-phos-hot">Extracted Payload</h3>
                        <div className="p-4 rounded-lg bg-phos-deep border border-phos-line text-phos-white font-mono text-sm whitespace-pre-wrap break-all">
                            {extractedResult || "(No text found)"}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}