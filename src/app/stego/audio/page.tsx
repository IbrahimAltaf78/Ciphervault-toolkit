'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Music,
    Lock,
    Key,
    Upload,
    Download,
    RefreshCw,
    FileAudio,
    ShieldCheck,
    HardDrive,
    KeyRound,
    Activity,
} from 'lucide-react';

// Web Audio API Waveform Component
function AudioWaveform({
    fileOrUrl,
    height = 80,
    waveColor = '#22d3ee',
    backgroundColor = '#020617',
}: {
    fileOrUrl: File | string | null;
    height?: number;
    waveColor?: string;
    backgroundColor?: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!fileOrUrl || !canvasRef.current) return;

        let animationFrameId: number;
        let audioCtx: AudioContext | null = null;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const renderWaveform = async () => {
            try {
                let arrayBuffer: ArrayBuffer;
                if (typeof fileOrUrl === 'string') {
                    const response = await fetch(fileOrUrl);
                    arrayBuffer = await response.arrayBuffer();
                } else {
                    arrayBuffer = await fileOrUrl.arrayBuffer();
                }

                const AudioContextClass =
                    window.AudioContext ||
                    (window as unknown as { webkitAudioContext: typeof AudioContext })
                        .webkitAudioContext;
                audioCtx = new AudioContextClass();

                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                const channelData = audioBuffer.getChannelData(0);

                const dpr = window.devicePixelRatio || 1;
                const displayWidth = canvas.offsetWidth || 300;

                canvas.width = displayWidth * dpr;
                canvas.height = height * dpr;
                ctx.scale(dpr, dpr);

                const width = displayWidth;
                const amp = height / 2;

                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, width, height);

                const step = Math.ceil(channelData.length / width);
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = waveColor;
                ctx.beginPath();

                for (let i = 0; i < width; i++) {
                    let min = 1.0;
                    let max = -1.0;

                    for (let j = 0; j < step; j++) {
                        const datum = channelData[i * step + j];
                        if (datum !== undefined) {
                            if (datum < min) min = datum;
                            if (datum > max) max = datum;
                        }
                    }

                    const x = i;
                    const yMin = (1 + min) * amp;
                    const yMax = (1 + max) * amp;

                    ctx.moveTo(x, yMin);
                    ctx.lineTo(x, yMax);
                }

                ctx.stroke();
            } catch (err) {
                console.error('Failed to render waveform:', err);
            } finally {
                if (audioCtx && audioCtx.state !== 'closed') {
                    await audioCtx.close();
                }
            }
        };

        animationFrameId = requestAnimationFrame(() => {
            renderWaveform();
        });

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (audioCtx && audioCtx.state !== 'closed') {
                audioCtx.close();
            }
        };
    }, [fileOrUrl, height, waveColor, backgroundColor]);

    if (!fileOrUrl) return null;

    return (
        <div className="w-full overflow-hidden rounded-lg border border-phos-line bg-phos-deep p-2">
            <canvas
                ref={canvasRef}
                style={{ height: `${height}px` }}
                className="w-full block"
            />
        </div>
    );
}

// Web Crypto API Helper Functions for AES-GCM
async function deriveKey(
    passphrase: string,
    salt: Uint8Array
): Promise<CryptoKey> {
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

async function encryptPayload(
    text: string,
    passphrase: string
): Promise<string> {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);

    const encryptedContent = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
        key,
        enc.encode(text)
    );

    const combined = new Uint8Array(
        salt.length + iv.length + encryptedContent.byteLength
    );
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedContent), salt.length + iv.length);

    return btoa(String.fromCharCode(...combined));
}

async function decryptPayload(
    base64Payload: string,
    passphrase: string
): Promise<string> {
    let combined: Uint8Array;
    try {
        combined = Uint8Array.from(atob(base64Payload), (c) => c.charCodeAt(0));
    } catch {
        throw new Error('Invalid base64 structure in encrypted payload.');
    }

    if (combined.length < 28) {
        throw new Error('Payload is too short to contain valid encrypted data.');
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

export default function AudioStegoPage() {
    const [mode, setMode] = useState<'hide' | 'extract'>('hide');
    const [file, setFile] = useState<File | null>(null);
    const [audioPreview, setAudioPreview] = useState<string | null>(null);
    const [secretText, setSecretText] = useState<string>('');
    const [passphrase, setPassphrase] = useState<string>('');
    const [extractedText, setExtractedText] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [stegoAudioUrl, setStegoAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [maxCapacityBytes, setMaxCapacityBytes] = useState<number>(0);

    // Clean up object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            if (audioPreview) URL.revokeObjectURL(audioPreview);
            if (stegoAudioUrl) URL.revokeObjectURL(stegoAudioUrl);
        };
    }, [audioPreview, stegoAudioUrl]);

    const switchMode = (newMode: 'hide' | 'extract') => {
        if (audioPreview) URL.revokeObjectURL(audioPreview);
        if (stegoAudioUrl) URL.revokeObjectURL(stegoAudioUrl);

        setMode(newMode);
        setFile(null);
        setAudioPreview(null);
        setSecretText('');
        setPassphrase('');
        setExtractedText('');
        setStegoAudioUrl(null);
        setError(null);
        setMaxCapacityBytes(0);
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

    const calculateWavCapacity = async (audioFile: File) => {
        try {
            const arrayBuffer = await audioFile.slice(0, 44).arrayBuffer();
            const view = new DataView(arrayBuffer);
            const isRiff =
                String.fromCharCode(...new Uint8Array(arrayBuffer, 0, 4)) === 'RIFF';
            const isWave =
                String.fromCharCode(...new Uint8Array(arrayBuffer, 8, 4)) === 'WAVE';

            if (!isRiff || !isWave) {
                const approxBytes = Math.floor((audioFile.size - 44) / 8);
                setMaxCapacityBytes(Math.max(0, approxBytes));
                return;
            }

            const numChannels = view.getUint16(22, true);
            const bitsPerSample = view.getUint16(34, true);
            const bytesPerSample = bitsPerSample / 8;
            const dataSizeBytes = audioFile.size - 44;
            const totalSamples =
                dataSizeBytes / (bytesPerSample * (numChannels || 1));
            const usableCapacityBytes = Math.floor(totalSamples / 8) - 32;
            setMaxCapacityBytes(Math.max(0, usableCapacityBytes));
        } catch {
            const fallbackCapacity = Math.floor((audioFile.size - 44) / 16);
            setMaxCapacityBytes(Math.max(0, fallbackCapacity));
        }
    };

    const processSelectedFile = (selectedFile: File) => {
        if (!selectedFile.name.match(/\.wav$/i)) {
            setError('Please upload a valid .wav audio file.');
            return;
        }

        if (audioPreview) URL.revokeObjectURL(audioPreview);
        if (stegoAudioUrl) URL.revokeObjectURL(stegoAudioUrl);

        setFile(selectedFile);
        setAudioPreview(URL.createObjectURL(selectedFile));
        setExtractedText('');
        setStegoAudioUrl(null);
        setError(null);

        if (mode === 'hide') {
            calculateWavCapacity(selectedFile);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processSelectedFile(e.target.files[0]);
        }
    };

    const handleHide = async () => {
        if (!file || !secretText) {
            setError('Please provide a valid .wav file and secret text.');
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
                throw new Error(
                    `Payload exceeds file capacity (${payloadBytes} / ${maxCapacityBytes} bytes).`
                );
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('text', payloadToEmbed);

            const response = await fetch('http://localhost:8000/api/stego/audio/hide', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Failed to encode audio');
            }

            const blob = await response.blob();
            if (stegoAudioUrl) URL.revokeObjectURL(stegoAudioUrl);
            const url = URL.createObjectURL(blob);
            setStegoAudioUrl(url);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred while encoding audio.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExtract = async () => {
        if (!file) {
            setError('Please select a stego .wav file first.');
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(
                'http://localhost:8000/api/stego/audio/extract',
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Failed to extract data');
            }

            const data: { extracted_text?: string; message?: string } =
                await response.json();
            const rawPayload = data.extracted_text || data.message || '';

            if (rawPayload.startsWith('ENC:')) {
                if (!passphrase.trim()) {
                    throw new Error(
                        'This message is encrypted. Please enter the passphrase to decrypt it.'
                    );
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

    const capacityPercentage =
        maxCapacityBytes > 0
            ? Math.min(100, (payloadLength / maxCapacityBytes) * 100)
            : 0;

    return (
        <div className="min-h-screen bg-phos-deep text-phos-white p-6 md:p-10">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Music className="text-phos-hot" /> Audio Steganography
                    </h1>
                    <p className="text-phos-dim mt-1">
                        Embed and extract hidden text payloads inside uncompressed WAV audio signals using LSB modification.
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
                        <label className="text-sm text-phos-dim font-medium">
                            Upload WAV Audio File
                        </label>
                        <div
                            onDragEnter={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                                if (e.dataTransfer.files?.length)
                                    processSelectedFile(e.dataTransfer.files[0]);
                            }}
                            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer ${isDragging
                                    ? 'border-phos bg-phos/10'
                                    : 'border-phos-line bg-phos-deep/50 hover:border-phos/50'
                                }`}
                        >
                            <input
                                key={mode}
                                type="file"
                                accept="audio/wav, audio/x-wav, .wav"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="pointer-events-none flex flex-col items-center justify-center">
                                <Upload className="w-6 h-6 text-phos-dim mb-1" />
                                <span className="text-xs text-phos-dim">
                                    {file ? file.name : 'Click to upload or drag .wav file'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {audioPreview && (
                        <div className="p-4 bg-phos-deep border border-phos-line rounded-lg space-y-3">
                            <p className="text-xs font-medium text-phos-dim flex items-center gap-2">
                                <FileAudio className="w-4 h-4 text-phos-hot" /> Selected Audio Preview:
                            </p>
                            <audio controls src={audioPreview} className="w-full" />

                            <div className="space-y-1 pt-1">
                                <p className="text-xs text-phos-dim flex items-center gap-1.5 font-medium">
                                    <Activity className="w-3.5 h-3.5 text-phos-hot" /> Carrier Signal Waveform:
                                </p>
                                <AudioWaveform fileOrUrl={file} height={70} waveColor="#22d3ee" />
                            </div>
                        </div>
                    )}

                    {/* HIDE MODE */}
                    {mode === 'hide' && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between items-center text-sm font-medium mb-1">
                                    <label className="text-phos-dim">Secret Text to Hide</label>
                                    {file && maxCapacityBytes > 0 && (
                                        <span
                                            className={`text-xs flex items-center gap-1 ${payloadLength > maxCapacityBytes
                                                    ? 'text-red-400 font-semibold'
                                                    : 'text-phos-dim'
                                                }`}
                                        >
                                            <HardDrive className="w-3.5 h-3.5" />
                                            {payloadLength} / {maxCapacityBytes} bytes ({capacityPercentage.toFixed(1)}%)
                                        </span>
                                    )}
                                </div>

                                <textarea
                                    rows={4}
                                    value={secretText}
                                    onChange={(e) => setSecretText(e.target.value)}
                                    placeholder="Enter secret message to encode inside audio samples..."
                                    className="w-full bg-phos-deep border border-phos-line rounded-lg p-3 text-sm focus:outline-none focus:border-phos text-phos-white"
                                />

                                {file && maxCapacityBytes > 0 && (
                                    <div className="w-full bg-phos-deep h-1.5 rounded-full overflow-hidden border border-phos-line mt-2">
                                        <div
                                            className={`h-full transition-all duration-300 ${payloadLength > maxCapacityBytes
                                                    ? 'bg-red-500'
                                                    : capacityPercentage > 85
                                                        ? 'bg-amber-400'
                                                        : 'bg-phos'
                                                }`}
                                            style={{
                                                width: `${Math.min(100, capacityPercentage)}%`,
                                            }}
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
                                disabled={
                                    loading ||
                                    !file ||
                                    !secretText ||
                                    payloadLength > maxCapacityBytes
                                }
                                className="w-full bg-phos hover:bg-phos disabled:bg-phos-line disabled:text-phos-dim font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Hide Text into Audio'
                                )}
                            </button>

                            {stegoAudioUrl && (
                                <div className="p-4 bg-phos-deep border border-emerald-500/40 rounded-lg space-y-4 mt-4">
                                    <p className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5" /> Encoding Complete! Stego-Audio Output:
                                    </p>
                                    <audio controls src={stegoAudioUrl} className="w-full" />

                                    <div className="space-y-1 pt-1">
                                        <p className="text-xs text-phos-dim flex items-center gap-1.5 font-medium">
                                            <Activity className="w-3.5 h-3.5 text-emerald-400" /> Stego Signal Waveform:
                                        </p>
                                        <AudioWaveform
                                            fileOrUrl={stegoAudioUrl}
                                            height={70}
                                            waveColor="#10b981"
                                        />
                                    </div>

                                    <a
                                        href={stegoAudioUrl}
                                        download={`stego_${file?.name || 'audio.wav'}`}
                                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Download className="w-4 h-4" /> Download Stego Audio
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
                                className="w-full bg-phos hover:bg-phos disabled:bg-phos-line disabled:text-phos-dim font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Extract Hidden Text'
                                )}
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