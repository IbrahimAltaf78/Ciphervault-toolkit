"""
Regression tests for the steganalysis engine (/api/steganalysis/analyze) and
the text-encoding endpoints.
"""
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import base64
import io

import numpy as np
import pytest
from PIL import Image
from fastapi.testclient import TestClient

from main import app  # type: ignore
from app.steganalysis import engine  # type: ignore

client = TestClient(app)
SAMPLES = Path(__file__).resolve().parent / "samples"


def sample(rel: str) -> bytes:
    return (SAMPLES / rel).read_bytes()


def png(rgb: np.ndarray) -> bytes:
    buf = io.BytesIO()
    Image.fromarray(rgb, "RGB").save(buf, format="PNG")
    return buf.getvalue()


def clean_rgb() -> np.ndarray:
    return np.array(Image.open(io.BytesIO(sample("clean/clean_image.png"))).convert("RGB"))


def analyze(name: str, data: bytes, content_type: str, kind: str):
    return client.post(
        "/api/steganalysis/analyze",
        files={"file": (name, data, content_type)},
        data={"kind": kind},
    )


def find_test(report: dict, test_id: str) -> dict:
    return next(t for t in report["tests"] if t["id"] == test_id)


# ==========================================
# Sample files
# ==========================================

@pytest.mark.parametrize("rel", [
    "clean/clean_image.png", "clean/clean_audio.wav",
    "stego/stego_image.png", "stego/stego_audio.wav",
])
def test_samples_are_real_files(rel):
    # They were committed as 0-byte placeholders; make_samples.py writes them.
    assert len(sample(rel)) > 10_000


def test_clean_image_sample_reads_clean():
    report = engine.analyze_image(sample("clean/clean_image.png"), "clean_image.png", "image/png")
    assert report["embeddingLikelihood"] < 25
    assert report["threatLevel"] == "CLEAN"


def test_stego_image_sample_is_found():
    report = engine.analyze_image(sample("stego/stego_image.png"), "stego_image.png", "image/png")
    assert report["embeddingLikelihood"] == 99
    signature = find_test(report, "toolkit-signature")
    assert signature["score"] == 100 and signature["value"].startswith("LSB")


def test_clean_audio_sample_reads_clean():
    report = engine.analyze_audio(sample("clean/clean_audio.wav"), "clean_audio.wav", "audio/wav")
    assert report["embeddingLikelihood"] < 25


def test_stego_audio_sample_is_found():
    report = engine.analyze_audio(sample("stego/stego_audio.wav"), "stego_audio.wav", "audio/wav")
    assert report["embeddingLikelihood"] == 99
    assert find_test(report, "toolkit-signature")["score"] == 100


# ==========================================
# Detection
# ==========================================

def test_score_moves_when_a_payload_is_embedded():
    """The bug the engine replaced: a clean image and the same image carrying
    a 9,600-character payload both read 65%."""
    clean = sample("clean/clean_image.png")
    hidden = client.post(
        "/api/stego/image/hide",
        files={"image": ("clean.png", clean, "image/png")},
        data={"secretText": "A" * 9600},
    ).json()
    stego = base64.b64decode(hidden["data"]["image"].split(",", 1)[1])

    before = analyze("clean.png", clean, "image/png", "image").json()["data"]
    after = analyze("stego.png", stego, "image/png", "image").json()["data"]

    assert before["embeddingLikelihood"] < 25
    assert after["embeddingLikelihood"] == 99
    assert "9,600 bytes" in after["summary"]


def test_encrypted_payload_is_found_and_marked():
    clean = sample("clean/clean_image.png")
    hidden = client.post(
        "/api/stego/image/hide",
        files={"image": ("clean.png", clean, "image/png")},
        data={"secretText": "top secret", "password": "hunter2"},
    ).json()
    stego = base64.b64decode(hidden["data"]["image"].split(",", 1)[1])
    report = analyze("stego.png", stego, "image/png", "image").json()["data"]
    assert report["embeddingLikelihood"] == 99
    assert "AES-encrypted" in find_test(report, "toolkit-signature")["value"]


def test_sequential_payload_without_a_marker():
    """Another tool's payload: random bits in the first 5% of the LSB plane."""
    rgb = clean_rgb()
    flat = rgb.reshape(-1).copy()
    n = flat.size // 20
    flat[:n] = (flat[:n] & 254) | np.random.default_rng(1).integers(0, 2, n, dtype=np.uint8)
    report = engine.analyze_image(png(flat.reshape(rgb.shape)), "x.png", "image/png")
    assert find_test(report, "leading-rows")["score"] > 60
    assert report["embeddingLikelihood"] >= 90


def test_scattered_payload_raises_the_rate_estimates():
    rgb = clean_rgb()
    flat = rgb.reshape(-1).copy()
    rng = np.random.default_rng(2)
    idx = rng.choice(flat.size, flat.size // 2, replace=False)
    flat[idx] = (flat[idx] & 254) | rng.integers(0, 2, idx.size, dtype=np.uint8)
    report = engine.analyze_image(png(flat.reshape(rgb.shape)), "x.png", "image/png")
    assert report["embeddingLikelihood"] >= 85
    for test in ("rs-analysis", "sample-pairs", "weighted-stego"):
        assert find_test(report, test)["score"] > 60


def test_data_appended_after_the_image_is_flagged():
    report = engine.analyze_image(sample("clean/clean_image.png") + b"x" * 200, "x.png", "image/png")
    assert report["embeddingLikelihood"] >= 90
    assert report["anomalies"][0]["severity"] == "CRITICAL"


# ==========================================
# DWT steganography
# ==========================================

def test_dwt_round_trip_through_black_and_odd_sized_images():
    """Used to fail on 30 of 57 photos: bits in black areas were clipped
    away, and odd-sized images crashed with "size mismatch"."""
    rgb = clean_rgb()
    rgb[:40] = 0                                   # payload lands in a black band
    rgb = np.ascontiguousarray(rgb[:239, :319])    # odd height and width
    hidden = client.post(
        "/api/stego/image/dwt/hide",
        files={"image": ("dark.png", png(rgb), "image/png")},
        data={"secretText": "dark and odd"},
    ).json()
    stego = base64.b64decode(hidden["data"]["image"].split(",", 1)[1])
    extracted = client.post(
        "/api/stego/image/dwt/extract",
        files={"image": ("stego.png", stego, "image/png")},
    ).json()
    assert extracted["data"]["secretText"] == "dark and odd"

    report = engine.analyze_image(stego, "stego.png", "image/png")
    assert find_test(report, "toolkit-signature")["value"].startswith("DWT")


@pytest.mark.parametrize("path, field, name, data, ctype", [
    ("/api/stego/image/lsb/extract", "image", "clean.png", "clean/clean_image.png", "image/png"),
    ("/api/stego/image/dct/extract", "image", "clean.png", "clean/clean_image.png", "image/png"),
    ("/api/stego/image/dwt/extract", "image", "clean.png", "clean/clean_image.png", "image/png"),
    ("/api/watermark/invisible/extract", "file", "clean.png", "clean/clean_image.png", "image/png"),
    ("/api/stego/audio/wav/extract", "audio", "clean.wav", "clean/clean_audio.wav", "audio/wav"),
])
def test_extracting_from_a_clean_file_says_nothing_is_hidden(path, field, name, data, ctype):
    # Used to "succeed" with every bit of the carrier returned as text.
    body = client.post(path, files={field: (name, sample(data), ctype)}).json()
    assert body["success"] is False
    assert "No hidden text" in body["error"]["message"]


def test_dct_refuses_text_longer_than_the_image_holds():
    body = client.post(
        "/api/stego/image/dct/hide",
        files={"image": ("clean.png", sample("clean/clean_image.png"), "image/png")},
        data={"secretText": "x" * 5000},
    ).json()
    assert body["success"] is False
    assert "too long" in body["error"]["message"]


def make_video(path: Path, frames: int) -> bytes:
    import cv2  # the video router's own dependency
    out = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"mp4v"), 12, (160, 120))
    for i in range(frames):
        frame = np.full((120, 160, 3), 60 + i * 3, np.uint8)
        frame[20:60, 20 + i * 4:60 + i * 4] = (200, 120, 40)
        out.write(frame)
    out.release()
    return path.read_bytes()


def test_video_round_trip_under_twenty_frames(tmp_path):
    """The extractor only looked for the end marker every 20 frames, and its
    final check never ran — so short videos came back as an empty success."""
    video = make_video(tmp_path / "short.mp4", 12)
    hidden = client.post(
        "/api/stego/video/hide",
        files={"video": ("short.mp4", video, "video/mp4")},
        data={"secretText": "short clip"},
    ).json()
    stego = base64.b64decode(hidden["data"]["video"].split(",", 1)[1])
    extracted = client.post("/api/stego/video/extract", files={"video": ("s.avi", stego, "video/x-msvideo")}).json()
    assert extracted["data"]["secretText"] == "short clip"


def test_clean_video_says_nothing_is_hidden(tmp_path):
    video = make_video(tmp_path / "clean.mp4", 30)
    body = client.post("/api/stego/video/extract", files={"video": ("clean.mp4", video, "video/mp4")}).json()
    assert body["success"] is False
    assert "No hidden text" in body["error"]["message"]


def test_engine_knows_main_dwt_steps():
    import main  # type: ignore
    assert engine.DWT_STEPS == (main.ALPHA, main.LEGACY_DWT_ALPHA)


# ==========================================
# Refusals
# ==========================================

def test_non_wav_audio_is_refused_with_a_reason():
    res = analyze("song.flac", b"fLaC" + bytes(2000), "audio/flac", "audio")
    assert res.status_code == 400
    assert "WAV" in res.json()["error"]["message"]


def test_unreadable_image_is_refused_with_a_reason():
    res = analyze("x.png", b"not an image" * 20, "image/png", "image")
    assert res.status_code == 400
    assert res.json()["success"] is False


def test_empty_upload_is_refused():
    res = analyze("x.png", b"", "image/png", "image")
    assert res.status_code == 400


# ==========================================
# Text encoding endpoints
# ==========================================

@pytest.mark.parametrize("kwargs", [
    {"json": {"text": "CipherVault"}},
    {"data": {"text": "CipherVault"}},
    {"files": {"text": (None, "CipherVault")}},
])
def test_base64_encode_reads_json_and_forms(kwargs):
    # A JSON body used to come back as {"success": true, "result": ""}.
    res = client.post("/api/encoding/base64/encode", **kwargs)
    assert res.status_code == 200
    assert res.json()["result"] == "Q2lwaGVyVmF1bHQ="


def test_base64_decode_round_trip():
    res = client.post("/api/encoding/base64/decode", json={"payload": "Q2lwaGVyVmF1bHQ"})
    assert res.json()["result"] == "CipherVault"


@pytest.mark.parametrize("path", ["/api/encoding/base64/encode", "/api/encoding/base64/decode"])
def test_base64_empty_input_is_an_error(path):
    res = client.post(path, json={})
    assert res.status_code == 400
    assert res.json()["success"] is False


def test_base64_decode_rejects_non_base64():
    res = client.post("/api/encoding/base64/decode", data={"text": "hello world!!"})
    assert res.status_code == 400


@pytest.mark.parametrize("codec, mode, text, expected", [
    ("base64", "encode", "CipherVault", "Q2lwaGVyVmF1bHQ="),
    ("hex", "encode", "Hi", "4869"),
    ("binary", "decode", "01001000 01101001", "Hi"),
    ("base32", "decode", "JBUQ", "Hi"),
    ("url", "encode", "a b&c", "a%20b%26c"),
    ("ascii", "decode", "72 105", "Hi"),
])
def test_encoding_process(codec, mode, text, expected):
    res = client.post("/api/encoding/process", json={"text": text, "encoding_type": codec, "mode": mode})
    assert res.json()["result"] == expected


def test_encoding_process_reads_forms_too():
    res = client.post("/api/encoding/process", data={"text": "Hi", "type": "hex", "mode": "encode"})
    assert res.json()["result"] == "4869"


@pytest.mark.parametrize("body, message", [
    ({"text": "", "mode": "encode"}, "empty"),
    ({"text": "zz", "encoding_type": "hex", "mode": "decode"}, "not valid hex"),
    ({"text": "hello world", "encoding_type": "base64", "mode": "decode"}, "not valid Base64"),
    ({"text": "1111", "encoding_type": "base32", "mode": "decode"}, "not valid Base32"),
    ({"text": "abc", "encoding_type": "ascii", "mode": "decode"}, "not valid ASCII"),
    ({"text": "72 99999999999", "encoding_type": "ascii", "mode": "decode"}, "not valid ASCII"),
])
def test_encoding_process_bad_input_is_an_error(body, message):
    res = client.post("/api/encoding/process", json=body)
    assert res.status_code == 400
    assert message in res.json()["detail"]
