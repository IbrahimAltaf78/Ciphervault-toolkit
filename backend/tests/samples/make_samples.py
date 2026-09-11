"""
Regenerates the steganalysis sample files in this folder.

    clean/clean_image.png   synthetic photo-like image, nothing hidden
    clean/clean_audio.wav   two seconds of a bell-like tone, nothing hidden
    stego/stego_image.png   clean_image.png with a payload written by the
                            toolkit's LSB method (the Steganography page)
    stego/stego_audio.wav   clean_audio.wav with a payload written by the
                            toolkit's WAV method

Synthetic rather than real photos and recordings so the repo carries nothing
under someone else's copyright. Seeded, so every run writes identical files.

Run from the backend folder:  python tests/samples/make_samples.py
"""

import io
import sys
import wave
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1]))  # the backend folder

from main import text_to_bits  # noqa: E402  (the toolkit's own payload format)

PAYLOAD = "CipherVault sample payload: this text was hidden by the toolkit's LSB method."


def clean_image() -> np.ndarray:
    """Soft shapes, a light gradient and sensor noise: statistically close
    enough to a photo for the LSB tests to read it as untouched."""
    rng = np.random.default_rng(2026)
    h, w = 240, 320
    yy, xx = np.mgrid[0:h, 0:w] / np.array([h, w]).reshape(2, 1, 1)
    channels = []
    for gain in (1.0, 0.8, 0.6):
        field = sum(gaussian_filter(rng.normal(0, 1, (h, w)), sigma) * weight
                    for sigma, weight in ((40, 900), (12, 180), (3, 30)))
        base = 70 + 110 * gain * (0.6 * yy + 0.4 * xx) + field
        channels.append(base + rng.normal(0, 2.0, (h, w)))
    return np.clip(np.round(np.stack(channels, axis=2)), 0, 255).astype(np.uint8)


def clean_audio() -> np.ndarray:
    rng = np.random.default_rng(2026)
    rate, seconds = 22050, 2.0
    t = np.arange(int(rate * seconds)) / rate
    tone = sum(np.sin(2 * np.pi * f * t) * a * np.exp(-t * d)
               for f, a, d in ((440, 6000, 1.5), (880, 2500, 2.5), (1320, 1200, 3.5)))
    return np.clip(np.round(tone + rng.normal(0, 20, t.size)), -32768, 32767).astype("<i2")


def write_bits(data: bytearray, bits: str) -> bytearray:
    """What main.py's hide endpoints do: each bit replaces one byte's LSB."""
    for i, bit in enumerate(bits):
        data[i] = (data[i] & 254) | int(bit)
    return data


def save_png(rgb: np.ndarray, path: Path) -> None:
    Image.fromarray(rgb, "RGB").save(path, format="PNG")


def save_wav(frames: bytes, path: Path, rate: int = 22050) -> None:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        wav.writeframes(frames)
    path.write_bytes(buf.getvalue())


def main() -> None:
    (HERE / "clean").mkdir(exist_ok=True)
    (HERE / "stego").mkdir(exist_ok=True)
    bits = text_to_bits(PAYLOAD)

    image = clean_image()
    save_png(image, HERE / "clean" / "clean_image.png")
    stego = bytearray(image.tobytes())
    save_png(np.frombuffer(bytes(write_bits(stego, bits)), np.uint8).reshape(image.shape),
             HERE / "stego" / "stego_image.png")

    audio = clean_audio().tobytes()
    save_wav(audio, HERE / "clean" / "clean_audio.wav")
    save_wav(bytes(write_bits(bytearray(audio), bits)), HERE / "stego" / "stego_audio.wav")

    for path in sorted(HERE.glob("*/*.*")):
        if path.suffix in (".png", ".wav"):
            print(f"{path.relative_to(HERE)}  {path.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
