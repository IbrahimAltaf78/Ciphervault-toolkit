import sys
from pathlib import Path

# Dynamically inject the backend folder into Python's lookup path
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import io
import pytest
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient

from main import app  # type: ignore
from app.steganalysis.image_detect import analyze_image_bytes  # type: ignore
from app.steganalysis.metadata import check_eof_payload, extract_mp3_metadata  # type: ignore
from app.steganalysis.gif_detect import analyze_gif_frames  # type: ignore

client = TestClient(app)

# ==========================================
# FIXTURES: In-Memory Sample Generators
# ==========================================

@pytest.fixture
def clean_png_bytes() -> bytes:
    """Generates a clean photographic image with natural variance across pixel pairs."""
    np.random.seed(123)
    # Generate continuous, non-uniform natural gradient
    x = np.linspace(0, 255, 200, dtype=np.uint8)
    y = np.linspace(0, 255, 200, dtype=np.uint8)
    xx, yy = np.meshgrid(x, y)
    
    rgb = np.zeros((200, 200, 3), dtype=np.uint8)
    rgb[:, :, 0] = xx
    rgb[:, :, 1] = yy
    rgb[:, :, 2] = (xx // 2 + yy // 2).astype(np.uint8)

    img = Image.fromarray(rgb, mode="RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def stego_lsb_png_bytes() -> bytes:
    """Generates a PNG image infused with high-entropy LSB noise."""
    np.random.seed(42)
    raw_data = np.full((100, 100, 3), 128, dtype=np.uint8)
    
    # Overwrite bottom 3 bit planes with maximum entropy noise
    random_bits = np.random.randint(0, 8, raw_data.shape, dtype=np.uint8)
    raw_data = (raw_data & 0xF8) | random_bits

    img = Image.fromarray(raw_data, mode="RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def stego_eof_jpeg_bytes() -> bytes:
    """Generates a valid JPEG image with trailing EOF payload appended."""
    img = Image.new("RGB", (50, 50), color=(200, 100, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    valid_jpeg = buf.getvalue()
    
    secret_payload = b"SECRET_CIPHERVAULT_PAYLOAD_12345" * 10
    return valid_jpeg + secret_payload


# ==========================================
# UNIT TESTS: Steganalysis Pipeline
# ==========================================

def test_eof_payload_detection():
    """Verify trailing byte payload detection beyond JPEG EOF marker."""
    fake_jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * 100 + b"\xff\xd9" + b"HIDDEN_PAYLOAD_HERE"
    score, anomaly, extra_bytes = check_eof_payload(fake_jpeg, "JPEG")
    
    assert score > 0.0
    assert anomaly is not None
    assert extra_bytes == b"HIDDEN_PAYLOAD_HERE"


def test_mp3_metadata_extraction():
    """Verify MP3 metadata extraction and sync frame scanning."""
    fake_mp3 = b"ID3" + b"\x00" * 7 + b"\xff\xfb" + b"\x00" * 500
    metadata, anomalies = extract_mp3_metadata(fake_mp3)
    
    assert metadata["format"] == "MP3"
    assert metadata["has_id3v2"] is True


def test_clean_image_detection(clean_png_bytes):
    """Verify clean image yields low confidence anomaly score."""
    score, anomalies, metadata = analyze_image_bytes(clean_png_bytes, "clean.png")
    
    assert score < 0.50, f"Expected low score for clean image, got {score}"


def test_stego_lsb_image_detection(stego_lsb_png_bytes):
    """Verify stego-infused LSB image triggers suspicion score."""
    score, anomalies, metadata = analyze_image_bytes(stego_lsb_png_bytes, "stego.png")
    
    assert score > 0.25, f"Expected elevated score for LSB stego image, got {score}"


# ==========================================
# API ROUTE TESTS: Endpoints
# ==========================================

def test_api_analyze_image_clean(clean_png_bytes):
    """Test POST /api/analyze/image with a clean file."""
    response = client.post(
        "/api/analyze/image",
        files={"file": ("clean.png", clean_png_bytes, "image/png")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["probability_score"] < 0.50


def test_api_analyze_image_stego(stego_lsb_png_bytes):
    """Test POST /api/analyze/image with a stego-infused file."""
    response = client.post(
        "/api/analyze/image",
        files={"file": ("stego.png", stego_lsb_png_bytes, "image/png")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["probability_score"] > 0.25