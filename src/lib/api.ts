const API_BASE_URL = 'http://127.0.0.1:8000/api/stego/image';

export async function hideDataInImage(file: File, secretText: string, algorithm: 'lsb' | 'dwt') {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('secretText', secretText);

    const response = await fetch(`${API_BASE_URL}/${algorithm}/hide`, {
        method: 'POST',
        body: formData,
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to hide message');
    }

    return result.data; // Returns { image: "data:image/png;base64,...", filename: "..." }
}

export async function extractDataFromImage(file: File, algorithm: 'lsb' | 'dwt') {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/${algorithm}/extract`, {
        method: 'POST',
        body: formData,
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to extract message');
    }

    return result.data; // Returns { secretText: "..." }
}