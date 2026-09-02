'use client';

import React, { useState, useEffect } from 'react';

export default function AudioStegoUI() {
    const [mode, setMode] = useState<'hide' | 'extract'>('hide');
    const [file, setFile] = useState<File | null>(null);
    const [secretText, setSecretText] = useState('');
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // FIX: Global listener prevents Chrome/Edge from opening dropped files in a new tab
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
        setSecretText('');
        setExtractedText(null);
        setError(null);
    };

    const handleFileSelect = (selectedFile: File | null) => {
        if (!selectedFile) {
            setFile(null);
            return;
        }

        if (!selectedFile.name.match(/\.wav$/i)) {
            setError('Invalid file format. Please upload a standard uncompressed .WAV file.');
            setFile(null);
            return;
        }

        setError(null);
        setFile(selectedFile);
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
            setError('Please upload a WAV audio file.');
            return;
        }

        setLoading(true);
        setError(null);
        setExtractedText(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            if (mode === 'hide') {
                if (!secretText) throw new Error('Secret text is required.');
                formData.append('secret_text', secretText);

                const res = await fetch('http://localhost:8000/api/stego/audio/hide', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    const errorDetail = await res.json().catch(() => null);
                    throw new Error(errorDetail?.detail || 'Failed to hide message in audio');
                }

                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'stego_audio.wav';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                const res = await fetch('http://localhost:8000/api/stego/audio/extract', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    const errorDetail = await res.json().catch(() => null);
                    throw new Error(errorDetail?.detail || 'Failed to extract message from audio');
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
        <div className="max-w-2xl mx-auto p-6 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800">
            <h2 className="text-2xl font-bold mb-2 text-center text-cyan-400">
                Audio Steganography
            </h2>
            <p className="text-xs text-slate-400 text-center mb-6">
                Embed and extract hidden text payloads inside uncompressed WAV audio signals using LSB modification.
            </p>

            <div className="flex justify-center gap-4 mb-6">
                <button
                    type="button"
                    onClick={() => handleModeSwitch('hide')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${mode === 'hide' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                >
                    Hide Data
                </button>
                <button
                    type="button"
                    onClick={() => handleModeSwitch('extract')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${mode === 'extract' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                >
                    Extract Data
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">
                        {mode === 'hide' ? 'Upload WAV Audio File' : 'Upload Stego WAV File'}
                    </label>

                    <div
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${isDragging
                                ? 'border-cyan-500 bg-cyan-500/10'
                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                            }`}
                    >
                        <input
                            key={mode}
                            type="file"
                            accept="audio/wav, .wav"
                            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="pointer-events-none space-y-2">
                            <svg className="w-8 h-8 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-sm font-medium text-slate-300">
                                {file ? file.name : 'Click to upload or drag .wav file'}
                            </p>
                            <p className="text-xs text-slate-500">Supports uncompressed .WAV audio</p>
                        </div>
                    </div>
                </div>

                {mode === 'hide' && (
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-300">Secret Text to Hide</label>
                        <textarea
                            rows={3}
                            value={secretText}
                            onChange={(e) => setSecretText(e.target.value)}
                            placeholder="Enter secret message to encode inside audio samples..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                        />
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !file}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
                >
                    {loading ? 'Processing Audio...' : mode === 'hide' ? 'Hide Text into Audio' : 'Extract Hidden Text'}
                </button>
            </form>

            {error && (
                <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
                    {error}
                </div>
            )}

            {mode === 'extract' && extractedText && (
                <div className="mt-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
                    <h3 className="text-sm font-medium text-slate-400 mb-1">Extracted Secret Message:</h3>
                    <p className="text-cyan-400 text-lg font-mono break-all">{extractedText}</p>
                </div>
            )}
        </div>
    );
}