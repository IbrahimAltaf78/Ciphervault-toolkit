import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def create_sample_image(format="PNG", mode="RGB", size=(100, 100)) -> bytes:
    """Helper utility to generate dummy image bytes in memory."""
    img = Image.new(mode, size, color="blue")
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()

def test_analyze_image_endpoint_schema():
    """Validates schema structure and successful 200 OK response on clean images."""
    img_bytes = create_sample_image("PNG")
    files = {"file": ("test_clean.png", img_bytes, "image/png")}
    
    response = client.post("/api/analyze/image", files=files)
    
    assert response.status_code == 200
    data = response.json()
    
    # Schema verification
    assert "filename" in data
    assert "file_type" in data
    assert "probability_score" in data
    assert "is_suspicious" in data
    assert "anomalies" in data
    assert "metadata" in data
    assert isinstance(data["anomalies"], list)

def test_analyze_image_invalid_file_type():
    """Ensures 400 validation error on invalid file upload."""
    files = {"file": ("test.txt", b"Invalid text data", "text/plain")}
    response = client.post("/api/analyze/image", files=files)
    assert response.status_code == 400

def test_analyze_image_eof_payload_detection():
    """Verifies EOF marker scanner detects appended trailing bytes."""
    clean_bytes = create_sample_image("JPEG")
    # Appending 100 bytes of hidden payload past JPEG EOF
    stego_bytes = clean_bytes + (b"SECRET_PAYLOAD_HERE" * 5)
    
    files = {"file": ("stego_image.jpg", stego_bytes, "image/jpeg")}
    response = client.post("/api/analyze/image", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data["is_suspicious"] is True
    assert data["probability_score"] >= 0.50
    
    # Check that an EOF Scan anomaly was flagged
    categories = [a["category"] for a in data["anomalies"]]
    assert "EOF Scan" in categories

def test_analyze_audio_endpoint_schema():
    """Validates audio endpoint schema compliance."""
    dummy_audio_bytes = b"RIFF" + (b"\x00" * 100)
    files = {"file": ("sample.wav", dummy_audio_bytes, "audio/wav")}
    
    response = client.post("/api/analyze/audio", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "sample.wav"
    assert "probability_score" in data