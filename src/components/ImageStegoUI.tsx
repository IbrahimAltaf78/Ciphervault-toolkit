'use client';

import React, { useState, useEffect } from 'react';

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

    // Global listener to prevent the browser from opening dropped files in a new tab
    useEffect(() => {
        const preventGlobalDrop = (e: DragEvent) => {
            e.preventDefault();
        };

        window.addEventListener('dragover', preventGlobalDrop);
        window.addEventListener('drop', preventGlobalDrop);

        return () => {
            window.removeEventListener('dragover', preventGlobalDrop);
            window.removeEventListener('drop', preventGlobalDrop);
        };
    }, []);

    const handleModeSwitch = (newMode: 'hide' | 'extract') => {
        setMode(newMode);
        setFile(null);
        setPreviewUrl(null);
        setSecretText('');
        setResultImage(null);
        setExtractedText(null);
        setError(null);
    };

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

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            handleFileSelect(droppedFile);
            e.dataTransfer.clearData();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError(mode === 'hide' ? 'Please upload a cover image.' : 'Please upload the generated stego image.');
            return;
        }

        setLoading(true);
        setError(null);
        setResultImage(null);
        setExtractedText(null);

        try {
            const formData = new FormData();

            if (mode === 'hide') {
                if (!secretText) throw new Error('Secret text is required.');

                formData.append('file', file);
                formData.append('secret_text', secretText);
                formData.append('algorithm', algorithm);

                const res = await fetch('http://localhost:8000/api/stego/image/hide', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    const errorDetail = await res.json().catch(() => null);
                    throw new Error(errorDetail?.detail || 'Failed to hide message');
                }

                const blob = await res.blob();
                const imageObjectURL = URL.createObjectURL(blob);
                setResultImage(imageObjectURL);
            } else {
                formData.append('file', file);
                formData.append('algorithm', algorithm);

                const res = await fetch('http://localhost:8000/api/stego/image/extract', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    const errorDetail = await res.json().catch(() => null);
                    throw new Error(errorDetail?.detail || 'Failed to extract message');
                }

                const data = await res.json();
                setExtractedText(data.secret_text || data.text || data.message || JSON.stringify(data));
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
        <div className="max-w-2xl mx-auto p-6 bg-phos-panel text-white rounded-xl shadow-lg border border-phos-line">
            <h2 className="text-2xl font-bold mb-6 text-center text-phos-hot">
                Image Steganography ({algorithm.toUpperCase()})
            </h2>

            <div className="flex justify-center gap-4 mb-6">
                <button
                    type="button"
                    onClick={() => handleModeSwitch('hide')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${mode === 'hide' ? 'bg-phos text-white' : 'bg-phos-line text-phos-dim'
                        }`}
                >
                    Hide Data
                </button>
                <button
                    type="button"
                    onClick={() => handleModeSwitch('extract')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${mode === 'extract' ? 'bg-phos text-white' : 'bg-phos-line text-phos-dim'
                        }`}
                >
                    Extract Data
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-phos-dim">Algorithm</label>
                    <select
                        value={algorithm}
                        onChange={(e) => setAlgorithm(e.target.value as 'lsb' | 'dwt')}
                        className="w-full bg-phos-line border border-phos-line rounded-lg p-2.5 text-white"
                    >
                        <option value="lsb">LSB (Least Significant Bit)</option>
                        <option value="dwt">DWT (Discrete Wavelet Transform)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-phos-dim">
                        {mode === 'hide' ? 'Upload Cover Image (PNG/BMP)' : 'Upload Stego Image (PNG/BMP)'}
                    </label>

                    <div
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer ${isDragging
                            ? 'border-phos bg-phos/10'
                            : 'border-phos-line bg-phos-line/50 hover:border-phos-dim'
                            }`}
                    >
                        <input
                            key={mode}
                            type="file"
                            accept="image/png, image/bmp"
                            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {previewUrl ? (
                            <div className="space-y-2 pointer-events-none">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded border border-phos-line object-contain" />
                                <p className="text-xs text-phos-dim">{file?.name}</p>
                            </div>
                        ) : (
                            <div className="space-y-1 pointer-events-none">
                                <p className="text-sm font-medium text-phos-dim">
                                    {mode === 'hide'
                                        ? 'Drag & drop cover image here, or '
                                        : 'Drag & drop downloaded stego image here, or '}
                                    <span className="text-phos-hot underline">browse</span>
                                </p>
                                <p className="text-xs text-phos-dim">Supports PNG or BMP (JPEG auto-rejected)</p>
                            </div>
                        )}
                    </div>
                </div>

                {mode === 'hide' && (
                    <div>
                        <label className="block text-sm font-medium mb-1 text-phos-dim">Secret Text</label>
                        <textarea
                            rows={3}
                            value={secretText}
                            onChange={(e) => setSecretText(e.target.value)}
                            placeholder="Enter text to conceal..."
                            className="w-full bg-phos-line border border-phos-line rounded-lg p-2.5 text-white"
                        />
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-phos hover:bg-phos text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
                >
                    {loading ? 'Processing...' : mode === 'hide' ? 'Encode Secret Image' : 'Extract Hidden Text'}
                </button>
            </form>

            {error && (
                <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
                    {error}
                </div>
            )}

            {mode === 'hide' && resultImage && (
                <div className="mt-6 text-center">
                    <h3 className="text-lg font-semibold text-emerald-400 mb-2">Stego Image Generated</h3>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resultImage} alt="Stego Result" className="max-h-64 mx-auto rounded-lg border border-phos-line mb-4 object-contain" />
                    <a
                        href={resultImage}
                        download="stego_image.png"
                        className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
                    >
                        Download Image
                    </a>
                </div>
            )}

            {mode === 'extract' && extractedText && (
                <div className="mt-6 p-4 bg-phos-line border border-phos-line rounded-lg">
                    <h3 className="text-sm font-medium text-phos-dim mb-1">Extracted Secret Message:</h3>
                    <p className="text-emerald-400 text-lg font-mono break-all">{extractedText}</p>
                </div>
            )}
        </div>
    );
}