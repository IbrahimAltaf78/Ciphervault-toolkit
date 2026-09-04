 dev/stego-engine
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

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AudioLines, Image as ImageIcon, ScanSearch, Video } from "lucide-react";

export const metadata: Metadata = {
  title: "Steganography — CipherVault",
  description:
    "Hide payloads inside images, audio and video using LSB and frequency-domain embedding.",
};

/**
 * Hub for the media steganography tools.
 *
 * The four tool pages moved to /stego/* during the route migration but nothing
 * linked to them — this index is what makes them reachable.
 */
const TOOLS = [
  {
    href: "/stego/image/lsb",
    title: "Image — LSB",
    description:
      "Write payload bits into the least significant bit of each colour channel. Highest capacity, lowest robustness.",
    icon: ImageIcon,
    carrier: "PNG, BMP",
  },
  {
    href: "/stego/image/dct-dwt",
    title: "Image — DCT / DWT",
    description:
      "Embed in the frequency domain instead of the pixels, so the payload survives recompression.",
    icon: ImageIcon,
    carrier: "PNG, JPEG",
  },
  {
    href: "/stego/audio",
    title: "Audio",
    description:
      "Hide data in the sample stream of a lossless waveform, below the noise floor.",
    icon: AudioLines,
    carrier: "WAV",
  },
  {
    href: "/stego/video",
    title: "Video",
    description: "Distribute a payload across frames of a video container.",
    icon: Video,
    carrier: "MP4, AVI",
  },
] as const;

export default function StegoHubPage() {
  return (
    <div
      className="space-y-8"
      style={{ "--cv-accent": "#10b981" } as React.CSSProperties}
    >
      <header className="space-y-3">
        <p className="cv-label accent-text">Steganography</p>
        <h1 className="text-3xl font-bold tracking-tight">Hide a payload in media</h1>
        <p className="max-w-2xl text-muted">
          These tools run against the Python engine, which does the pixel and
          sample work. Files are processed in memory and returned in the response
          — nothing is written to disk.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="cv-card accent-ring group flex h-full flex-col rounded-xl border border-edge bg-surface/70 p-5 backdrop-blur-md"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="accent-soft accent-border accent-text flex size-10 items-center justify-center rounded-xl border">
                  <tool.icon aria-hidden className="size-5" />
                </span>
                <ArrowRight
                  aria-hidden
                  className="accent-text size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                />
              </div>

              <h2 className="mt-4 text-lg font-medium tracking-tight">{tool.title}</h2>
              <p className="mt-1.5 flex-1 text-muted">{tool.description}</p>
              <p className="cv-label mt-4 normal-case tracking-normal">
                Carrier: {tool.carrier}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <aside className="rounded-xl border border-edge bg-surface/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 font-medium tracking-tight">
              <ScanSearch aria-hidden className="size-4 text-rose-400" />
              Looking for the other direction?
            </h2>
            <p className="text-muted">
              Steganalysis tests a file for a payload it was not told about.
            </p>
          </div>
          <Link href="/steganalysis" className="cv-btn">
            Open steganalysis
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </div>
      </aside>
    </div>
  );
}
main
