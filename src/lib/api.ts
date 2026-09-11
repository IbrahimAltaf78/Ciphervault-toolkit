const API_BASE_URL = 'http://127.0.0.1:8000';

// ==========================================
// Types & Interfaces
// ==========================================

export interface Anomaly {
    category: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    description: string;
}

export interface AnalysisReport {
    filename: string;
    file_type: string;
    probability_score: number;
    is_suspicious: boolean;
    anomalies: Anomaly[];
    metadata: Record<string, unknown>;
}

// ==========================================
// Image Steganography APIs
// ==========================================

export async function hideDataInImage(
    file: File,
    secretText: string,
    algorithm: 'lsb' | 'dwt' = 'lsb',
    password?: string
) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('secretText', secretText);
    if (password) {
        formData.append('password', password);
    }

    const response = await fetch(`${API_BASE_URL}/api/stego/image/${algorithm}/hide`, {
        method: 'POST',
        body: formData,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
        const detailMsg = typeof result?.detail === 'string'
            ? result.detail
            : Array.isArray(result?.detail)
                ? result.detail[0]?.msg
                : null;

        throw new Error(
            detailMsg || result?.error?.message || `Server returned status ${response.status}`
        );
    }

    return result.data; // { image: "data:image/png;base64,...", filename: "..." }
}

export async function extractDataFromImage(
    file: File,
    algorithm: 'lsb' | 'dwt' = 'lsb',
    password?: string
) {
    const formData = new FormData();
    formData.append('image', file);
    if (password) {
        formData.append('password', password);
    }

    const response = await fetch(`${API_BASE_URL}/api/stego/image/${algorithm}/extract`, {
        method: 'POST',
        body: formData,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
        const detailMsg = typeof result?.detail === 'string'
            ? result.detail
            : Array.isArray(result?.detail)
                ? result.detail[0]?.msg
                : null;

        throw new Error(
            detailMsg || result?.error?.message || `Server returned status ${response.status}`
        );
    }

    return result.data; // { secretText: "...", isEncrypted: boolean }
}

// ==========================================
// Audio Steganography APIs
// ==========================================

export async function hideDataInAudio(
    file: File,
    secretText: string,
    password?: string
) {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('secretText', secretText);
    if (password) {
        formData.append('password', password);
    }

    const response = await fetch(`${API_BASE_URL}/api/stego/audio/wav/hide`, {
        method: 'POST',
        body: formData,
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
        throw new Error(result?.error?.message || 'Failed to hide payload in audio file.');
    }

    return result.data;
}

export async function extractDataFromAudio(
    file: File,
    password?: string
) {
    const formData = new FormData();
    formData.append('audio', file);
    if (password) {
        formData.append('password', password);
    }

    const response = await fetch(`${API_BASE_URL}/api/stego/audio/wav/extract`, {
        method: 'POST',
        body: formData,
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
        throw new Error(result?.error?.message || 'Failed to extract payload from audio file.');
    }

    return result.data;
}

// ==========================================
// Stegananalysis Detection APIs
// ==========================================

export async function analyzeMedia(
    file: File,
    type: "image" | "audio"
): Promise<AnalysisReport> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/analyze/${type}`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to analyze ${type}`);
    }

    return response.json();
}