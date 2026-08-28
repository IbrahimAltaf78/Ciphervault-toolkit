'use client';

import React, { useState, useEffect } from 'react';
import { hideDataInImage, extractDataFromImage } from '../lib/api';

interface ImageStegoUIProps {
    initialAlgorithm?: 'lsb' | 'dwt';
}

export default function ImageStegoUI({ initialAlgorithm = 'lsb' }: ImageStegoUIProps) {
    const [mode, setMode] = useState<'hide' | 'extract'>('hide');
    const [algorithm, setAlgorithm] = useState<'lsb' | 'dwt'>(initialAlgorithm);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [secretText, setSecretText] = useState('');
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        setAlgorithm(initialAlgorithm);
    }, [initialAlgorithm]);

    const handleFileSelect = (selectedFile: File | null) => {
        if (!selectedFile) {
            setFile(null);
            setPreviewUrl(null);
            return;
        }

        if (selectedFile.type === 'image/jpeg' || selectedFile.name.match(/\.(jpg|jpeg)$/i)) {
            setError('JPEG format rejected: Compression destroys steganographic data. Please upload lossless PNG or BMP files.');
            setFile(null);
            setPreviewUrl(null);
            return;
        }

        setError(null);
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select or drop a valid PNG/BMP image file.');
            return;
        }

        setLoading(true);
        setError(null);
        setResultImage(null);
        setExtractedText(null);

        try {
            if (mode === 'hide') {
                if (!secretText) throw new Error('Secret text is required.');
                const res = await hideDataInImage(file, secretText, algorithm);
                setResultImage(res.image);
            } else {
                const res = await extractDataFromImage(file, algorithm);
                setExtractedText(res.secretText);
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800">
            <h2 className="text-2xl font-bold mb-6 text-center text-indigo-400">
                Image Steganography ({algorithm.toUpperCase()})
            </h2>

            <div className="flex justify-center gap-4 mb-6">
                <button
                    type="button"
                    onClick={() => setMode('hide')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${mode === 'hide' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                >
                    Hide Data
                </button>
                <button
                    type="button"
                    onClick={() => setMode('extract')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${mode === 'extract' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                >
                    Extract Data
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">Algorithm</label>
                    <select
                        value={algorithm}
                        onChange={(e) => setAlgorithm(e.target.value as 'lsb' | 'dwt')}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                    >
                        <option value="lsb">LSB (Least Significant Bit)</option>
                        <option value="dwt">DWT (Discrete Wavelet Transform)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">
                        {mode === 'hide' ? 'Upload Cover Image (PNG/BMP)' : 'Upload Stego Image (PNG/BMP)'}
                    </label>

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer ${isDragging
                                ? 'border-indigo-500 bg-indigo-500/10'
                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                            }`}
                    >
                        <input
                            type="file"
                            accept="image/png, image/bmp"
                            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {previewUrl ? (
                            <div className="space-y-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={previewUrl} alt="Cover Preview" className="max-h-40 mx-auto rounded border border-slate-700 object-contain" />
                                <p className="text-xs text-slate-400">{file?.name}</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-300">
                                    Drag & drop image here, or <span className="text-indigo-400 underline">browse</span>
                                </p>
                                <p className="text-xs text-slate-500">Supports PNG or BMP (JPEG auto-rejected)</p>
                            </div>
                        )}
                    </div>
                </div>

                {mode === 'hide' && (
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-300">Secret Text</label>
                        <textarea
                            rows={3}
                            value={secretText}
                            onChange={(e) => setSecretText(e.target.value)}
                            placeholder="Enter text to conceal..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                        />
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
                >
                    {loading ? 'Processing...' : mode === 'hide' ? 'Encode Secret Image' : 'Extract Hidden Text'}
                </button>
            </form>

            {error && (
                <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
                    {error}
                </div>
            )}

            {resultImage && (
                <div className="mt-6 text-center">
                    <h3 className="text-lg font-semibold text-emerald-400 mb-2">Stego Image Generated</h3>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resultImage} alt="Stego Result" className="max-h-64 mx-auto rounded-lg border border-slate-700 mb-4 object-contain" />
                    <a
                        href={resultImage}
                        download="stego_image.png"
                        className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
                    >
                        Download Image
                    </a>
                </div>
            )}

            {extractedText && (
                <div className="mt-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
                    <h3 className="text-sm font-medium text-slate-400 mb-1">Extracted Secret Message:</h3>
                    <p className="text-emerald-400 text-lg font-mono break-all">{extractedText}</p>
                </div>
            )}
        </div>
    );
}