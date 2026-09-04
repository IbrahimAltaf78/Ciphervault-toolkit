"use client";

import React, { useState } from "react";
import { hideDataInImage, extractDataFromImage } from "@/lib/api";

export default function StegoPage() {
    const [mode, setMode] = useState<"hide" | "extract" | "analyze">("hide");
    const [algorithm, setAlgorithm] = useState<"lsb" | "dwt">("lsb");
    const [file, setFile] = useState<File | null>(null);
    const [secretText, setSecretText] = useState("");
    const [password, setPassword] = useState("");
    const [useEncryption, setUseEncryption] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleEmbed = async () => {
        if (!file) return setError("Please select an image file first.");
        if (!secretText) return setError("Please enter a secret message.");

        setLoading(true);
        setError(null);
        try {
            const data = await hideDataInImage(
                file,
                secretText,
                algorithm,
                useEncryption ? password : undefined
            );
            setResult(data);
        } catch (err: any) {
            setError(err.message || "Failed to embed payload.");
        } finally {
            setLoading(false);
        }
    };

    const handleExtract = async () => {
        if (!file) return setError("Please upload a stego image.");

        setLoading(true);
        setError(null);
        try {
            const data = await extractDataFromImage(
                file,
                algorithm,
                password || undefined
            );
            setResult(data);
        } catch (err: any) {
            setError(err.message || "Failed to extract payload.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 flex flex-col items-center">
            <div className="max-w-3xl w-full space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Steganography Workspace</h1>
                    <p className="text-slate-400 text-sm">
                        Embed confidential data, recover secret payloads, or analyze carriers for anomalies.
                    </p>
                </div>

                {/* Main Tabs */}
                <div className="flex justify-center space-x-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800 w-fit mx-auto">
                    <button
                        onClick={() => { setMode("hide"); setResult(null); setError(null); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === "hide" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                            }`}
                    >
                        🔒 Hide Payload
                    </button>
                    <button
                        onClick={() => { setMode("extract"); setResult(null); setError(null); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === "extract" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                            }`}
                    >
                        🔓 Extract Payload
                    </button>
                </div>

                {/* Algorithm Selection */}
                <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <span className="text-sm font-medium text-slate-300">Algorithm Selection:</span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setAlgorithm("lsb")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${algorithm === "lsb"
                                    ? "bg-blue-600 border-blue-500 text-white shadow-lg"
                                    : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                                }`}
                        >
                            LSB (Least Significant Bit)
                        </button>
                        <button
                            type="button"
                            onClick={() => setAlgorithm("dwt")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${algorithm === "dwt"
                                    ? "bg-blue-600 border-blue-500 text-white shadow-lg"
                                    : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                                }`}
                        >
                            DWT (Discrete Wavelet Transform)
                        </button>
                    </div>
                </div>

                {/* Dropzone */}
                <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/30 rounded-xl p-8 text-center cursor-pointer relative">
                    <input
                        type="file"
                        accept="image/png, image/jpeg, image/bmp"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-2">
                        <div className="text-slate-400 text-2xl">⬆</div>
                        <p className="text-sm font-medium text-slate-300">
                            {file ? file.name : "Click or drag file here to upload carrier media"}
                        </p>
                        <p className="text-xs text-slate-500">Supports PNG, JPG, BMP</p>
                    </div>
                </div>

                {/* Hide Payload Form */}
                {mode === "hide" && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                                Secret Message Payload
                            </label>
                            <textarea
                                value={secretText}
                                onChange={(e) => setSecretText(e.target.value)}
                                placeholder="Enter secret message to embed..."
                                className="w-full h-28 bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="enc"
                                checked={useEncryption}
                                onChange={(e) => setUseEncryption(e.target.checked)}
                                className="rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-0"
                            />
                            <label htmlFor="enc" className="text-xs text-slate-300">
                                AES-256 Encryption
                            </label>
                        </div>

                        {useEncryption && (
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter encryption password"
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
                            />
                        )}

                        <button
                            onClick={handleEmbed}
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 rounded-lg font-semibold text-sm transition-colors"
                        >
                            {loading ? "Embedding..." : `Embed Secret (${algorithm.toUpperCase()})`}
                        </button>
                    </div>
                )}

                {/* Extract Payload Form */}
                {mode === "extract" && (
                    <div className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Decryption password (if encrypted)"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
                        />

                        <button
                            onClick={handleExtract}
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 rounded-lg font-semibold text-sm transition-colors"
                        >
                            {loading ? "Extracting..." : `Extract Payload (${algorithm.toUpperCase()})`}
                        </button>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="p-4 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* Results Display */}
                {result && (
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
                        <h3 className="font-semibold text-sm text-blue-400">Result:</h3>
                        {result.image && (
                            <div className="space-y-2">
                                <img src={result.image} alt="Stego Result" className="max-h-64 rounded mx-auto" />
                                <a
                                    href={result.image}
                                    download={result.filename || "stego_image.png"}
                                    className="block text-center text-xs text-blue-400 underline hover:text-blue-300"
                                >
                                    Download Output Image
                                </a>
                            </div>
                        )}
                        {result.secretText && (
                            <div className="p-3 bg-slate-950 rounded text-slate-200 text-sm font-mono border border-slate-800">
                                {result.secretText}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}