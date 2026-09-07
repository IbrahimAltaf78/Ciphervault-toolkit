'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Lock, Key, Upload, Download, RefreshCw, ShieldCheck, HardDrive, KeyRound, Eye, Layers } from 'lucide-react';

// Web Crypto API Helper Functions for AES-GCM
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(passphrase),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt.buffer as ArrayBuffer,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

async function encryptPayload(text: string, passphrase: string): Promise<string> {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);

    const encryptedContent = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
        key,
        enc.encode(text)
    );

    const combined = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedContent), salt.length + iv.length);

    return btoa(String.fromCharCode(...combined));
}

async function decryptPayload(base64Payload: string, passphrase: string): Promise<string> {
    const combined = Uint8Array.from(atob(base64Payload), (c) => c.charCodeAt(0));

    if (combined.length < 28) {
        throw new Error('Payload is too short to contain encrypted data.');
    }

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    const key = await deriveKey(passphrase, salt);

    try {
        const decryptedContent = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
            key,
            ciphertext.buffer as ArrayBuffer
        );
        return new TextDecoder().decode(decryptedContent);
    } catch {
        throw new Error('Incorrect passphrase or corrupted payload.');
    }
}

// Interactive Bit-Plane Viewer Component
function BitPlaneViewer({ imageUrl }: { imageUrl: string }) {
    const [selectedBit, setSelectedBit] = useState<number>(0);
    const [selectedChannel, setSelectedChannel] = useState<'all' | 'r' | 'g' | 'b'>('all');
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!imageUrl || !canvasRef.current) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;

        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const rBit = (data[i] >> selectedBit) & 1;
                const gBit = (data[i + 1] >> selectedBit) & 1;
                const bBit = (data[i + 2] >> selectedBit) & 1;

                let valR = rBit ? 255 : 0;
                let valG = gBit ? 255 : 0;
                let valB = bBit ? 255 : 0;

                if (selectedChannel === 'r') {
                    valG = 0;
                    valB = 0;
                } else if (selectedChannel === 'g') {
                    valR = 0;
                    valB = 0;
                } else if (selectedChannel === 'b') {
                    valR = 0;
                    valG = 0;
                }

                data[i] = valR;
                data[i + 1] = valG;
                data[i + 2] = valB;
            }

            ctx.putImageData(imageData, 0, 0);
        };
    }, [imageUrl, selectedBit, selectedChannel]);

    return (
        <div className="bg-phos-deep border border-phos-line rounded-lg p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-phos-line pb-3">
                <span className="text-xs font-medium text-phos-dim flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-phos-hot" /> Visual Bit-Plane Inspector
                </span>

                <div className="flex items-center gap-1">
                    <span className="text-xs text-phos-dim mr-1">Bit:</span>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((bit) => (
                        <button
                            key={bit}
                            onClick={() => setSelectedBit(bit)}
                            className={`px-2 py-0.5 text-xs rounded transition-colors ${selectedBit === bit
                                ? 'bg-phos text-phos-deep font-bold'
                                : 'bg-phos-panel text-phos-dim hover:text-phos-white'
                                }`}
                        >
                            {bit}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1">
                    <span className="text-xs text-phos-dim mr-1">Channel:</span>
                    {(['all', 'r', 'g', 'b'] as const).map((ch) => (
                        <button
                            key={ch}
                            onClick={() => setSelectedChannel(ch)}
                            className={`px-2 py-0.5 text-xs rounded uppercase font-medium transition-colors ${selectedChannel === ch
                                ? 'bg-phos text-phos-deep font-bold'
                                : 'bg-phos-panel text-phos-dim hover:text-phos-white'
                                }`}
                        >
                            {ch}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-center overflow-auto max-h-80 bg-phos-panel/50 p-2 rounded">
                <canvas ref={canvasRef} className="max-w-full h-auto object-contain rounded" />
            </div>
            <p className="text-[11px] text-phos-dim text-center">
                Bit 0 is the Least Significant Bit (LSB). Random noise patterns in Bit 0 usually indicate embedded hidden payloads.
            </p>
        </div>
    );
}

export default function ImageStegoPage() {
    const [mode, setMode] = useState<'hide' | 'extract'>('hide');
    const [file, setFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [secretText, setSecretText] = useState<string>('');
    const [passphrase, setPassphrase] = useState<string>('');
    const [extractedText, setExtractedText] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [stegoImageUrl, setStegoImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [maxCapacityBytes, setMaxCapacityBytes] = useState<number>(0);
    const [showInspector, setShowInspector] = useState<boolean>(false);

    // Clean up memory when imagePreview or stegoImageUrl changes
    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
            if (stegoImageUrl) URL.revokeObjectURL(stegoImageUrl);
        };
    }, [imagePreview, stegoImageUrl]);

    const switchMode = (newMode: 'hide' | 'extract') => {
        setMode(newMode);
        setFile(null);
        setImagePreview(null);
        setSecretText('');
        setPassphrase('');
        setExtractedText('');
        setStegoImageUrl(null);
        setError(null);
        setMaxCapacityBytes(0);
        setShowInspector(false);
    };

    useEffect(() => {
        const preventGlobalDrop = (e: DragEvent) => e.preventDefault();
        window.addEventListener('dragover', preventGlobalDrop);
        window.addEventListener('drop', preventGlobalDrop);
        return () => {
            window.removeEventListener('dragover', preventGlobalDrop);
            window.removeEventListener('drop', preventGlobalDrop);
        };
    }, []);

    const processSelectedFile = (selectedFile: File) => {
        if (!selectedFile.type.match(/^image\/(png|bmp)$/i)) {
            setError('Please upload a lossless image format (.png or .bmp).');
            return;
        }

        setFile(selectedFile);
        const url = URL.createObjectURL(selectedFile);
        setImagePreview(url);
        setExtractedText('');
        setStegoImageUrl(null);
        setError(null);

        // Load image to calculate capacity & prevent memory leak by revoking URL
        const img = new Image();
        img.src = url;
        img.onload = () => {
            const totalBytes = Math.floor((img.width * img.height * 3) / 8) - 32;
            setMaxCapacityBytes(Math.max(0, totalBytes));
        };
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processSelectedFile(e.target.files[0]);
        }
    };

    const handleHide = async () => {
        if (!file || !secretText) {
            setError('Please select an image and enter a secret message.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let payloadToEmbed = secretText;
            if (passphrase.trim()) {
                const encryptedB64 = await encryptPayload(secretText, passphrase);
                payloadToEmbed = `ENC:${encryptedB64}`;
            }

            const payloadBytes = new TextEncoder().encode(payloadToEmbed).length;
            if (payloadBytes > maxCapacityBytes && maxCapacityBytes > 0) {
                throw new Error(`Encrypted payload exceeds image capacity (${payloadBytes} / ${maxCapacityBytes} bytes).`);
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('text', payloadToEmbed);

            const response = await fetch('http://localhost:8000/api/stego/image/hide', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Failed to encode image.');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setStegoImageUrl(url);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred while encoding image.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExtract = async () => {
        if (!file) {
            setError('Please select a stego PNG image first.');
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/api/stego/image/extract', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Failed to extract data.');
            }

            const data: { extracted_text?: string; message?: string } = await response.json();
            const rawPayload = data.extracted_text || data.message || '';

            if (rawPayload.startsWith('ENC:')) {
                if (!passphrase.trim()) {
                    throw new Error('This message is encrypted. Please enter the passphrase to decrypt it.');
                }
                const encryptedB64 = rawPayload.replace(/^ENC:/, '');
                const decrypted = await decryptPayload(encryptedB64, passphrase);
                setExtractedText(decrypted);
            } else {
                setExtractedText(rawPayload || 'No hidden message found.');
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred while extracting text.');
            }
        } finally {
            setLoading(false);
        }
    };

    const payloadLength = passphrase.trim()
        ? new TextEncoder().encode(`ENC:${secretText}`).length + 28
        : new TextEncoder().encode(secretText).length;

    const capacityPercentage = maxCapacityBytes > 0 ? Math.min(100, (payloadLength / maxCapacityBytes) * 100) : 0;

    return (
        <div className="min-h-screen bg-phos-deep text-phos-white p-6 md:p-10">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <ImageIcon className="text-phos-hot" /> Image Steganography
                    </h1>
                    <p className="text-phos-dim mt-1">
                        Hide and reveal secret text inside PNG bit planes with optional AES-GCM encryption.
                    </p>
                </div>

                {/* Tab Controls */}
                <div className="flex border-b border-phos-line gap-4">
                    <button
                        onClick={() => switchMode('hide')}
                        className={`pb-3 font-medium transition-colors flex items-center gap-2 border-b-2 ${mode === 'hide'
                            ? 'border-phos-hot text-phos-hot'
                            : 'border-transparent text-phos-dim hover:text-phos-white'
                            }`}
                    >
                        <Lock className="w-4 h-4" /> Hide Data
                    </button>
                    <button
                        onClick={() => switchMode('extract')}
                        className={`pb-3 font-medium transition-colors flex items-center gap-2 border-b-2 ${mode === 'extract'
                            ? 'border-phos-hot text-phos-hot'
                            : 'border-transparent text-phos-dim hover:text-phos-white'
                            }`}
                    >
                        <Key className="w-4 h-4" /> Extract Data
                    </button>
                </div>

                {error && (
                    <div className="bg-red-950/50 border border-red-500/50 text-red-300 p-4 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-phos-panel border border-phos-line p-6 rounded-xl space-y-6">
                    {/* File Upload Section */}
                    <div className="space-y-2">
                        <label className="text-sm text-phos-dim font-medium">Upload Image (PNG/BMP)</label>
                        <div
                            onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                                if (e.dataTransfer.files?.length) processSelectedFile(e.dataTransfer.files[0]);
                            }}
                            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer ${isDragging
                                ? 'border-phos bg-phos/10'
                                : 'border-phos-line bg-phos-deep/50 hover:border-phos/50'
                                }`}
                        >
                            <input
                                key={mode}
                                type="file"
                                accept="image/png, image/bmp"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="pointer-events-none flex flex-col items-center justify-center">
                                <Upload className="w-6 h-6 text-phos-dim mb-1" />
                                <span className="text-xs text-phos-dim">
                                    {file ? file.name : 'Click to upload or drag .png file'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {imagePreview && (
                        <div className="p-4 bg-phos-deep border border-phos-line rounded-lg space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-phos-dim flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-phos-hot" /> Carrier Image Preview
                                </p>
                                <button
                                    onClick={() => setShowInspector(!showInspector)}
                                    className="text-xs bg-phos-panel hover:bg-phos-line border border-phos-line text-phos-hot px-3 py-1 rounded flex items-center gap-1.5 transition-colors"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    {showInspector ? 'Hide Bit Inspector' : 'Inspect Bit Planes'}
                                </button>
                            </div>

                            <div className="flex justify-center bg-phos-panel/40 p-2 rounded">
                                <img src={imagePreview} alt="Carrier Preview" className="max-h-64 rounded object-contain" />
                            </div>

                            {showInspector && <BitPlaneViewer imageUrl={imagePreview} />}
                        </div>
                    )}

                    {/* HIDE MODE */}
                    {mode === 'hide' && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between items-center text-sm font-medium mb-1">
                                    <label className="text-phos-dim">Secret Text to Hide</label>
                                    {file && maxCapacityBytes > 0 && (
                                        <span className={`text-xs flex items-center gap-1 ${payloadLength > maxCapacityBytes ? 'text-red-400 font-semibold' : 'text-phos-dim'}`}>
                                            <HardDrive className="w-3.5 h-3.5" />
                                            {payloadLength} / {maxCapacityBytes} bytes ({capacityPercentage.toFixed(1)}%)
                                        </span>
                                    )}
                                </div>

                                <textarea
                                    rows={4}
                                    value={secretText}
                                    onChange={(e) => setSecretText(e.target.value)}
                                    placeholder="Enter secret message to encode inside pixel bit planes..."
                                    className="w-full bg-phos-deep border border-phos-line rounded-lg p-3 text-sm focus:outline-none focus:border-phos text-phos-white"
                                />

                                {file && maxCapacityBytes > 0 && (
                                    <div className="w-full bg-phos-deep h-1.5 rounded-full overflow-hidden border border-phos-line mt-2">
                                        <div
                                            className={`h-full transition-all duration-300 ${payloadLength > maxCapacityBytes ? 'bg-red-500' : capacityPercentage > 85 ? 'bg-amber-400' : 'bg-phos'}`}
                                            style={{ width: `${Math.min(100, capacityPercentage)}%` }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-phos-dim font-medium flex items-center gap-2">
                                    <KeyRound className="w-4 h-4 text-amber-400" /> Encryption Passphrase (Optional)
                                </label>
                                <input
                                    type="password"
                                    value={passphrase}
                                    onChange={(e) => setPassphrase(e.target.value)}
                                    placeholder="Enter a passphrase to encrypt your secret payload..."
                                    className="w-full bg-phos-deep border border-phos-line rounded-lg p-2.5 text-sm focus:outline-none focus:border-phos text-phos-white"
                                />
                            </div>

                            <button
                                onClick={handleHide}
                                disabled={loading || !file || !secretText || payloadLength > maxCapacityBytes}
                                className="w-full bg-phos hover:bg-phos disabled:bg-phos-line disabled:text-phos-dim font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Hide Text into Image'}
                            </button>

                            {stegoImageUrl && (
                                <div className="p-4 bg-phos-deep border border-emerald-500/40 rounded-lg space-y-4 mt-4">
                                    <p className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5" /> Encoding Complete! Stego Image Output:
                                    </p>
                                    <div className="flex justify-center bg-phos-panel/40 p-2 rounded">
                                        <img src={stegoImageUrl} alt="Stego Output" className="max-h-64 rounded object-contain" />
                                    </div>
                                    <a
                                        href={stegoImageUrl}
                                        download={`stego_${file?.name || 'image.png'}`}
                                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Download className="w-4 h-4" /> Download Stego Image
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* EXTRACT MODE */}
                    {mode === 'extract' && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm text-phos-dim font-medium flex items-center gap-2">
                                    <KeyRound className="w-4 h-4 text-amber-400" /> Decryption Passphrase
                                </label>
                                <input
                                    type="password"
                                    value={passphrase}
                                    onChange={(e) => setPassphrase(e.target.value)}
                                    placeholder="Enter passphrase if the hidden data was encrypted..."
                                    className="w-full bg-phos-deep border border-phos-line rounded-lg p-2.5 text-sm focus:outline-none focus:border-phos text-phos-white"
                                />
                            </div>

                            <button
                                onClick={handleExtract}
                                disabled={loading || !file}
                                className="w-full bg-phos hover:bg-phos disabled:bg-phos-line disabled:text-phos-dim font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Extract Hidden Text'}
                            </button>

                            {extractedText && (
                                <div className="space-y-2 mt-4">
                                    <label className="text-sm font-medium text-phos-hot flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" /> Extracted Secret Payload:
                                    </label>
                                    <textarea
                                        readOnly
                                        value={extractedText}
                                        rows={4}
                                        className="w-full bg-phos-deep border border-phos-line rounded-lg p-3 font-mono text-sm text-phos-white focus:outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}