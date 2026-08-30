'use client';

import { useState } from 'react';

export default function AudioStegoPage() {
    const [mode, setMode] = useState<'hide' | 'extract'>('hide');
    const [file, setFile] = useState<File | null>(null);
    const [audioPreview, setAudioPreview] = useState<string | null>(null);
    const [secretText, setSecretText] = useState('');
    const [extractedText, setExtractedText] = useState('');
    const [loading, setLoading] = useState(false);
    const [stegoAudioUrl, setStegoAudioUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setAudioPreview(URL.createObjectURL(selectedFile));
            setExtractedText('');
            setStegoAudioUrl(null);
        }
    };

    const handleHide = async () => {
        if (!file || !secretText) return alert('Please provide a .wav file and secret text.');
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('text', secretText);

        try {
            const response = await fetch('http://localhost:8000/api/stego/audio/hide', {
                method: 'POST',
                body: formData,
            });

            // Capture exact backend error message
            if (!response.ok) {
                const errorData = await response.text();
                console.error("Backend Error Data:", errorData);
                throw new Error(errorData || 'Failed to encode audio');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setStegoAudioUrl(url);
        } catch (error: any) {
            console.error("Full error:", error);
            alert(`Error encoding audio: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleExtract = async () => {
        if (!file) return alert('Please provide a stego .wav file.');
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/api/stego/audio/extract', {
                method: 'POST',
                body: formData,
            });

            // Capture exact backend error message
            if (!response.ok) {
                const errorData = await response.text();
                console.error("Backend Error Data:", errorData);
                throw new Error(errorData || 'Failed to extract data');
            }

            const data = await response.json();
            setExtractedText(data.extracted_text);
        } catch (error: any) {
            console.error("Full error:", error);
            alert(`Error extracting text: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Audio Steganography</h1>
            <p className="text-gray-600 dark:text-gray-300">Hide and extract secret text inside .wav audio files.</p>

            <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
                <button
                    className={`flex-1 py-2 rounded-md font-medium transition-colors ${mode === 'hide' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setMode('hide')}
                >
                    Hide Data
                </button>
                <button
                    className={`flex-1 py-2 rounded-md font-medium transition-colors ${mode === 'extract' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setMode('extract')}
                >
                    Extract Data
                </button>
            </div>

            <div className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-sm">Upload .WAV Audio File</label>
                    <input
                        type="file"
                        accept=".wav"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>

                {audioPreview && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Original Audio Preview:</p>
                        <audio controls src={audioPreview} className="w-full" />
                    </div>
                )}

                {mode === 'hide' ? (
                    <>
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-sm">Secret Text to Hide</label>
                            <textarea
                                rows={4}
                                value={secretText}
                                onChange={(e) => setSecretText(e.target.value)}
                                placeholder="Enter the secret message here..."
                                className="w-full p-3 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                            />
                        </div>
                        <button
                            onClick={handleHide}
                            disabled={loading || !file || !secretText}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
                        >
                            {loading ? 'Encoding...' : 'Hide Text into Audio'}
                        </button>
                        {stegoAudioUrl && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-4">
                                <p className="font-semibold text-green-700 dark:text-green-400">Success! Here is your Stego-Audio:</p>
                                <audio controls src={stegoAudioUrl} className="w-full" />
                                <a
                                    href={stegoAudioUrl}
                                    download={`stego_${file?.name}`}
                                    className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Download Stego Audio
                                </a>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <button
                            onClick={handleExtract}
                            disabled={loading || !file}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
                        >
                            {loading ? 'Extracting...' : 'Extract Hidden Text'}
                        </button>
                        {extractedText && (
                            <div className="flex flex-col gap-2 mt-4">
                                <label className="font-semibold text-sm text-green-600">Extracted Secret Text:</label>
                                <textarea
                                    readOnly
                                    value={extractedText}
                                    rows={4}
                                    className="w-full p-3 border-2 border-green-500 bg-green-50 rounded-md dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}