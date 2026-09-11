"""
The detection engine behind POST /api/steganalysis/analyze.

Every figure in a report is measured from the file. The scorer this replaced
read "65% suspicious" for any ordinary photo, payload or not: a photo's LSB
plane is already near-random, which pinned its formula to a floor of 65. Its
RS, sample-pair and bits-per-pixel figures were fixed fractions of that one
number.

Image tests
  - CipherVault signature: reads the LSB, DCT and DWT channels exactly as this
    toolkit's extractors do and looks for their end marker. Decisive for files
    made here, silent for everything else.
  - Leading rows: the toolkit, like most simple LSB tools, writes from the
    first pixel on. Per-row weighted-stego estimates sit near 1.0 across such a
    payload (about 0.8 for plain text) and drop to near 0 where it ends.
  - RS analysis, sample pairs, weighted stego: three independent estimates of
    the fraction of LSBs replaced anywhere in the image.

Audio tests (WAV)
  - CipherVault signature on the LSBs of the frame bytes.
  - Bit-8 jumps: the toolkit writes every byte's LSB, the high byte of each
    16-bit sample included, which puts about half its samples ±256 away from
    where their neighbours say they should be.
  Replacing only bit 0 of each sample leaves no first-order trace in audio, and
  the report says so rather than guessing.

Thresholds were set on 20 photographs and 14 recordings, clean and with known
payloads: untouched photos estimate a rate of 0.00-0.06 (one grainy photo
0.17), and the estimators track real embedding rates within a few percent.
"""

from __future__ import annotations

import io
import math
import wave
from datetime import datetime
from typing import Optional

import numpy as np
import pywt
from PIL import Image
from scipy.fft import dctn
from scipy.stats import chi2

# The end marker main.py's text_to_bits() appends to every payload.
DELIMITER = b"###END###"

# main.py's DWT quantisation steps: ALPHA, then LEGACY_DWT_ALPHA for files
# made before it was raised. Kept in step by hand: main imports this module.
DWT_STEPS = (6.0, 2.0)

# The rate estimators run on a centred crop no larger than this, which keeps a
# 12-megapixel upload to about a second. Scattered embedding is uniform, so any
# large region measures it; a payload written from the top is the leading-rows
# test's job.
MAX_STATS_PIXELS = 2_100_000

# A row counts as carrying payload when its weighted-stego rate is above this.
ROW_PAYLOAD_RATE = 0.5

# Estimated embedding rate -> 0-100 score. Flat where untouched photos land.
_RATE_CURVE = ((0.0, 3), (0.03, 8), (0.08, 25), (0.15, 45), (0.2, 60), (0.3, 85), (0.5, 96))


class UnsupportedMedia(ValueError):
    """The file cannot be analysed. The message says why, for the user."""


# ==========================================
# Shared measurements
# ==========================================

def _pov_p_value(values: np.ndarray, bins: int = 256) -> float:
    """Westfeld-Pfitzmann pairs-of-values test.

    Near 1 when values 2k and 2k+1 occur equally often, as LSB replacement
    makes them; near 0 for untouched media.
    """
    counts = np.bincount(values, minlength=bins).astype(np.float64)
    evens, odds = counts[0::2], counts[1::2]
    expected = (evens + odds) / 2.0
    keep = expected > 4
    k = int(np.count_nonzero(keep))
    if k < 2:
        return 0.0
    stat = float(np.sum((evens[keep] - expected[keep]) ** 2 / expected[keep]))
    return float(chi2.sf(stat, k - 1))


def _find_payload(bits: np.ndarray) -> Optional[dict]:
    """A CipherVault payload in a bit stream read in embedding order, or None.

    The marker is 72 bits, so a chance match is not a practical concern; the
    bytes before it must also read as text.
    """
    if bits.size < len(DELIMITER) * 8:
        return None
    data = np.packbits(bits.astype(np.uint8, copy=False)).tobytes()
    end = data.find(DELIMITER)
    if end < 0:
        return None
    body = np.frombuffer(data[:end], dtype=np.uint8)
    if body.size:
        texty = np.count_nonzero(
            (body == 9) | (body == 10) | (body == 13) | ((body >= 32) & (body <= 126)) | (body >= 160)
        )
        if texty / body.size < 0.9:
            return None
    return {"bytes": end, "encrypted": data[:4] == b"ENC:"}


def _rate_score(rate: Optional[float]) -> int:
    if rate is None or not math.isfinite(rate):
        return 0
    xs, ys = zip(*_RATE_CURVE)
    return int(round(float(np.interp(rate, xs, ys))))


def _status(score: int) -> str:
    return "critical" if score > 60 else ("warning" if score > 30 else "clean")


def _threat(likelihood: int) -> str:
    return "CRITICAL THREAT" if likelihood > 75 else ("SUSPICIOUS" if likelihood > 40 else "CLEAN")


def _size_label(n_bytes: int) -> str:
    if n_bytes < 1024 * 1024:
        return f"{n_bytes / 1024:.1f} KB"
    return f"{n_bytes / (1024 * 1024):.2f} MB"


def _signature_test(found: list, where: str) -> dict:
    if found:
        method, info = found[0]
        lock = ", AES-encrypted" if info["encrypted"] else ""
        value = f"{method}: {info['bytes']:,}-byte payload{lock}"
    else:
        value = "no end marker"
    return {
        "id": "toolkit-signature",
        "name": "CipherVault signature",
        "description": f"Reads {where} the way this toolkit's extractors do and looks for their end marker.",
        "value": value,
        "score": 100 if found else 0,
        "status": "critical" if found else "clean",
    }


HISTOGRAM_BINS = 64  # per channel, enough for the report's sparkline


def _envelope(file_name, file_type, contents, dimensions, likelihood, summary,
              lsb_distribution, channels, tests, anomalies, histograms) -> dict:
    """The report shape the frontend reads (src/lib/steganalysis/types.ts)."""
    analysed_at = datetime.now().strftime("%d/%m/%Y, %H:%M:%S")
    size = _size_label(len(contents))
    return {
        "histograms": histograms,
        "file": {"name": file_name, "type": file_type, "size": size,
                 "dimensions": dimensions, "analyzedAt": analysed_at},
        "fileName": file_name,
        "fileType": file_type,
        "fileSize": size,
        "dimensions": dimensions,
        "analyzedAt": analysed_at,
        "threatLevel": _threat(likelihood),
        "embeddingLikelihood": likelihood,
        "summary": summary,
        "lsbDistribution": lsb_distribution,
        "channels": channels,
        "tests": tests,
        "anomalies": anomalies,
    }


# ==========================================
# Image estimators
# ==========================================

def _rs_rate(channel: np.ndarray) -> Optional[float]:
    """RS analysis (Fridrich, Goljan & Du, 2001). None where it is unstable,
    which happens near full embedding."""
    h, w = channel.shape
    w4 = w - w % 4
    if h < 2 or w4 < 4:
        return None
    groups = channel[:, :w4].astype(np.int16).reshape(-1, 4)
    mask = np.array([False, True, True, False])

    def smoothness(g):
        return np.abs(np.diff(g, axis=1)).sum(axis=1)

    def regular_singular(g):
        base = smoothness(g)
        pos = g.copy()
        pos[:, mask] = g[:, mask] ^ 1
        neg = g.copy()
        neg[:, mask] = ((g[:, mask] + 1) ^ 1) - 1
        f_pos, f_neg = smoothness(pos), smoothness(neg)
        n = len(g)
        return ((f_pos > base).sum() / n, (f_pos < base).sum() / n,
                (f_neg > base).sum() / n, (f_neg < base).sum() / n)

    rm, sm, rn, sn = regular_singular(groups)
    rm1, sm1, rn1, sn1 = regular_singular(groups ^ 1)
    d0, d1, dn0, dn1 = rm - sm, rm1 - sm1, rn - sn, rn1 - sn1
    a = 2 * (d1 + d0)
    b = dn0 - dn1 - d1 - 3 * d0
    c = d0 - dn0
    if abs(a) < 1e-12:
        if abs(b) < 1e-12:
            return None
        z = -c / b
    else:
        disc = max(0.0, b * b - 4 * a * c)
        roots = ((-b + math.sqrt(disc)) / (2 * a), (-b - math.sqrt(disc)) / (2 * a))
        z = min(roots, key=abs)
    if abs(z - 0.5) < 1e-12:
        return None
    rate = z / (z - 0.5)
    return float(rate) if math.isfinite(rate) and -0.5 <= rate <= 1.5 else None


def _spa_rate(channel: np.ndarray) -> Optional[float]:
    """Sample pair analysis (Dumitrescu, Wu & Wang, 2003) on horizontal pairs.
    Solves for the change rate; the embedding rate is twice that."""
    if channel.shape[1] < 2:
        return None
    r = channel[:, :-1].astype(np.int32).ravel()
    s = channel[:, 1:].astype(np.int32).ravel()
    even = s % 2 == 0
    x = np.count_nonzero((even & (r < s)) | (~even & (r > s)))
    y = np.count_nonzero((even & (r > s)) | (~even & (r < s)))
    k = np.count_nonzero((s // 2) == (r // 2))
    if k == 0:
        return None
    a, b, c = 2 * k, 2 * (2 * x - r.size), y - x
    disc = max(0.0, b * b - 4 * a * c)
    beta = min((-b + math.sqrt(disc)) / (2 * a), (-b - math.sqrt(disc)) / (2 * a))
    return float(2 * beta)


def _ws_row_sums(rows: np.ndarray) -> tuple:
    """Weighted-stego sums (Fridrich & Goljan; Ker's weights) for each interior
    row of `rows` (H x W x C). The rate of interior row i is 2 * num[i] / den[i]."""
    x = rows.astype(np.float64)
    centre = x[1:-1, 1:-1]
    up, down = x[:-2, 1:-1], x[2:, 1:-1]
    left, right = x[1:-1, :-2], x[1:-1, 2:]
    pred = (up + down + left + right) / 4.0
    var = ((up - pred) ** 2 + (down - pred) ** 2 + (left - pred) ** 2 + (right - pred) ** 2) / 4.0
    weight = 1.0 / (5.0 + var)
    # A value minus itself with the LSB flipped: +1 when odd, -1 when even.
    sign = np.where(rows[1:-1, 1:-1] & 1, 1.0, -1.0)
    num = (weight * sign * (centre - pred)).sum(axis=(1, 2))
    den = weight.sum(axis=(1, 2))
    return num, den


def _stats_region(rgb: np.ndarray) -> np.ndarray:
    h, w = rgb.shape[:2]
    if h * w <= MAX_STATS_PIXELS:
        return rgb
    scale = math.sqrt(MAX_STATS_PIXELS / (h * w))
    ch, cw = max(16, int(h * scale)), max(16, int(w * scale))
    top, left = (h - ch) // 2, (w - cw) // 2
    return rgb[top:top + ch, left:left + cw]


def _leading_rows(rgb: np.ndarray) -> dict:
    """How many rows from the top carry payload, measured row by row."""
    h, w, c = rgb.shape
    rates: list = []
    chunk = max(8, 600_000 // (w * c))
    start = 0
    while start < h - 2:
        stop = min(h, start + chunk + 2)
        num, den = _ws_row_sums(rgb[start:stop])
        block = 2 * num / den
        rates.extend(block.tolist())
        if (block <= ROW_PAYLOAD_RATE).any():
            break
        start = stop - 2

    run = 0
    for rate in rates:  # rates[i] is image row i + 1
        if rate <= ROW_PAYLOAD_RATE:
            break
        run += 1

    result = {"detected": False, "rows": 0, "rate": None, "after": None, "samples": 0}
    if run < 2:
        return result
    span = run + 1  # row 0 has no row above it to measure, but a payload starts there
    band = float(np.mean(rates[:run]))
    after = None
    if span + 1 < h:
        num, den = _ws_row_sums(rgb[span - 1:min(h, span + 17)])  # the 16 rows after the run
        after = float(2 * num.sum() / den.sum())
    # A payload stops somewhere; a grainy or fully embedded image reads high
    # all the way down. Only a sharp drop after the run counts. (A pairs-of-
    # values check is no use here: a text payload's bits are not 50/50.)
    detected = band >= 0.7 and after is not None and band - after >= 0.4
    result.update(rows=span, rate=band, after=after, samples=span * w * c, detected=detected)
    return result


def _image_signatures(rgb: np.ndarray) -> list:
    """Payloads made by this toolkit's LSB, DCT and DWT tools, read the way
    main.py's extract_* functions read them."""
    found = []
    lsb = _find_payload(rgb.reshape(-1) & 1)
    if lsb:
        found.append(("LSB", lsb))

    luma = np.asarray(Image.fromarray(rgb).convert("YCbCr"), dtype=np.float32)[:, :, 0]
    h8, w8 = (luma.shape[0] // 8) * 8, (luma.shape[1] // 8) * 8
    if h8 and w8:
        blocks = luma[:h8, :w8].reshape(h8 // 8, 8, w8 // 8, 8).swapaxes(1, 2)
        coeffs = dctn(blocks, axes=(2, 3), norm="ortho")
        dct = _find_payload((coeffs[:, :, 4, 3] > coeffs[:, :, 3, 4]).reshape(-1))
        if dct:
            found.append(("DCT", dct))

    if luma.shape[0] >= 2 and luma.shape[1] >= 2:
        _, (lh, _, _) = pywt.dwt2(luma, "haar")
        for step in DWT_STEPS:
            dwt = _find_payload((np.abs(np.round(lh / step)).astype(np.int64) % 2).reshape(-1))
            if dwt:
                found.append(("DWT", dwt))
                break
    return found


def _trailing_bytes(contents: bytes, fmt: str) -> int:
    """Bytes after the end of the image data proper (a classic hiding place)."""
    if fmt == "PNG":
        pos = contents.find(b"IEND")
        if pos != -1:
            return max(0, len(contents) - (pos + 8))  # "IEND" + 4-byte CRC
    if fmt == "BMP" and len(contents) >= 6:
        declared = int.from_bytes(contents[2:6], "little")
        if 0 < declared < len(contents):
            return len(contents) - declared
    return 0


def _rate_test(test_id: str, name: str, description: str, rate: Optional[float]) -> dict:
    score = _rate_score(rate)
    value = "unstable on this image — not used" if rate is None else f"rate {max(0.0, rate):.3f} bits/sample"
    return {"id": test_id, "name": name, "description": description,
            "value": value, "score": score, "status": _status(score)}


# ==========================================
# Image report
# ==========================================

def analyze_image(contents: bytes, file_name: str, file_type: str) -> dict:
    try:
        pil = Image.open(io.BytesIO(contents))
        pil.load()
    except Exception:
        raise UnsupportedMedia("Not a readable image. Upload a PNG, BMP, TIFF or WebP file.")

    width, height = pil.size
    fmt = (pil.format or "").upper()
    rgb = np.ascontiguousarray(np.asarray(pil.convert("RGB")))
    if width < 16 or height < 16:
        raise UnsupportedMedia("The image is too small to analyse (under 16 × 16 pixels).")

    signatures = _image_signatures(rgb)
    leading = _leading_rows(rgb)

    region = _stats_region(rgb)
    rs = [_rs_rate(region[:, :, i]) for i in range(3)]
    spa = [_spa_rate(region[:, :, i]) for i in range(3)]
    num, den = _ws_row_sums(region)
    rs_rate = float(np.mean([v for v in rs if v is not None])) if any(v is not None for v in rs) else None
    spa_rate = float(np.mean([v for v in spa if v is not None])) if any(v is not None for v in spa) else None
    ws_rate = float(2 * num.sum() / den.sum())
    estimates = [v for v in (rs_rate, spa_rate, ws_rate) if v is not None]
    rate = float(np.median(estimates)) if estimates else 0.0

    whole_p = _pov_p_value(rgb.reshape(-1))
    trailing = _trailing_bytes(contents, fmt)

    # ---- likelihood: the strongest measured evidence wins
    likelihood = _rate_score(rate)
    if leading["detected"]:
        likelihood = max(likelihood, min(98, 90 + leading["rows"] // 4))
    if trailing > 0:
        likelihood = max(likelihood, 90 if trailing > 16 else 70)
    if signatures:
        likelihood = 99

    if signatures:
        method, info = signatures[0]
        lock = " It is AES-encrypted, so extracting it needs the password." if info["encrypted"] else ""
        summary = f"Carries a CipherVault {method} payload of {info['bytes']:,} bytes.{lock}"
    elif leading["detected"]:
        summary = (f"The first {leading['rows']} rows have their LSBs replaced — about "
                   f"{leading['samples'] // 8:,} bytes written from the first pixel.")
    elif trailing > 0:
        summary = f"{trailing:,} bytes are stored after the end of the image data."
    elif likelihood > 40:
        summary = (f"The rate estimators put about {rate * 100:.0f}% of the LSB plane as altered. "
                   "A grainy or heavily processed photo can read this way too.")
    elif likelihood > 20:
        summary = (f"Rate estimates of about {rate * 100:.0f}% sit above most untouched photos "
                   "but below a clear detection.")
    else:
        summary = "No test found a payload. Scattered payloads under ~5% of capacity cannot be ruled out."

    # ---- tests
    if leading["detected"]:
        lead_value = f"rows 0–{leading['rows'] - 1}: rate {leading['rate']:.2f}, then {leading['after']:.2f}"
        lead_score = min(99, round(100 * leading["rate"]))
    else:
        lead_value = "no leading payload rows"
        lead_score = 0

    chi_score = min(99, round(whole_p * 100))
    tests = [
        _signature_test(signatures, "the LSB, DCT and DWT channels"),
        {
            "id": "leading-rows",
            "name": "Leading rows",
            "description": "Measures the embedding rate row by row from the top, where sequential tools start writing.",
            "value": lead_value,
            "score": lead_score,
            "status": _status(lead_score),
        },
        {
            "id": "chi-square",
            "name": "Chi-square attack",
            "description": "Pairs-of-values test over every pixel: near 1 when LSB replacement has evened out value pairs.",
            "value": f"p = {whole_p:.4f}",
            "score": chi_score,
            "status": _status(chi_score),
        },
        _rate_test("rs-analysis", "RS analysis",
                   "Estimates the replaced share of LSBs from how pixel groups respond to flipping.", rs_rate),
        _rate_test("sample-pairs", "Sample pairs",
                   "Estimates the replaced share of LSBs from the structure of adjacent pixel pairs.", spa_rate),
        _rate_test("weighted-stego", "Weighted stego",
                   "Estimates the replaced share of LSBs by predicting each pixel from its neighbours.", ws_rate),
    ]

    # ---- LSB balance and value histograms (shown as bars and sparklines)
    lsb_distribution, channels, histograms = {}, [], {}
    for idx, (name, key) in enumerate((("Red", "red"), ("Green", "green"), ("Blue", "blue"))):
        one = round(float(np.mean(rgb[:, :, idx] & 1)) * 100, 1)
        zero = round(100 - one, 1)
        lsb_distribution[key] = {"zero": zero, "one": one, "lsb0": zero, "lsb1": one}
        channels.append({"name": name, "lsb0": zero, "lsb1": one, "zero": zero, "one": one})
        counts = np.bincount(rgb[:, :, idx].ravel(), minlength=256)
        histograms[key] = counts.reshape(HISTOGRAM_BINS, -1).sum(axis=1).tolist()

    # ---- container anomalies
    anomalies = []
    if trailing > 0:
        anomalies.append({
            "title": "Data after the end of the image",
            "description": f"{trailing:,} bytes follow the {fmt or 'image'} end marker.",
            "severity": "CRITICAL",
        })
    if pil.mode in ("P", "1"):
        anomalies.append({
            "title": "Palette image",
            "description": "LSB tests read the decoded colours, not the palette indices a palette tool would change.",
            "severity": "WARNING",
        })
    if fmt in ("JPEG", "MPO"):
        anomalies.append({
            "title": "Lossy JPEG",
            "description": "JPEG rewrites the low bits on save, so LSB results here are unreliable.",
            "severity": "WARNING",
        })

    return _envelope(file_name, file_type, contents, f"{width} × {height}", likelihood, summary,
                     lsb_distribution, channels, tests, anomalies, histograms)


# ==========================================
# Audio report
# ==========================================

JUMP_BLOCK = 2048  # samples per block of the bit-8 test


def _bit8_jumps(frames: bytes, n_channels: int) -> dict:
    """Blocks from the start of 16-bit audio whose samples sit a bit-8 flip
    (±256) away from where their neighbours put them.

    In ordinary audio a sample is close to the average of its neighbours, so
    flipping bit 8 almost never brings it closer; in a byte-wise LSB payload
    about half the samples carry a wrong bit 8 and it does. Loud or noisy
    audio reads near 50% everywhere — there the test has nothing to compare
    against, and says so.
    """
    usable = len(frames) - len(frames) % (2 * n_channels)
    x = np.frombuffer(frames[:usable], dtype="<i2")[0::n_channels].astype(np.int32)
    result = {"detected": False, "dense": False, "baseline": 0.0, "lead": 0.0,
              "after": 0.0, "blocks": 0, "fraction": 0.0}
    if x.size < JUMP_BLOCK * 4:
        return result
    centre, pred = x[1:-1], (x[:-2] + x[2:]) / 2.0
    closer = np.abs((centre ^ 256) - pred) < np.abs(centre - pred)
    n_blocks = closer.size // JUMP_BLOCK
    rates = closer[: n_blocks * JUMP_BLOCK].reshape(n_blocks, JUMP_BLOCK).mean(axis=1)

    baseline = float(np.median(rates))
    run = 0
    for rate in rates:
        if rate <= 0.4:
            break
        run += 1
    lead = float(rates[:run].mean()) if run else 0.0
    after = float(rates[run:run + 8].mean()) if run < n_blocks else lead
    result.update(
        baseline=baseline,
        dense=baseline >= 0.25,
        lead=lead,
        after=after,
        blocks=run,
        fraction=run * JUMP_BLOCK / x.size,
        detected=run >= 1 and baseline < 0.25 and lead - after >= 0.25,
    )
    return result

def analyze_audio(contents: bytes, file_name: str, file_type: str) -> dict:
    try:
        with wave.open(io.BytesIO(contents), "rb") as wav:
            n_channels = wav.getnchannels()
            sample_width = wav.getsampwidth()
            frame_rate = wav.getframerate()
            n_frames = wav.getnframes()
            frames = wav.readframes(n_frames)
    except Exception:
        raise UnsupportedMedia("Only WAV audio can be analysed. Convert FLAC or AIFF files to WAV first.")
    if not frames:
        raise UnsupportedMedia("The WAV file holds no audio frames.")

    raw = np.frombuffer(frames, dtype=np.uint8)
    found = _find_payload(raw & 1)
    signatures = [("WAV LSB", found)] if found else []

    jumps = _bit8_jumps(frames, n_channels) if sample_width == 2 else None

    trailing = 0
    if len(contents) >= 8 and contents[:4] == b"RIFF":
        declared = int.from_bytes(contents[4:8], "little") + 8
        trailing = max(0, len(contents) - declared)

    likelihood = 4
    if jumps and jumps["detected"]:
        likelihood = min(98, 88 + jumps["blocks"])
    if trailing > 0:
        likelihood = max(likelihood, 90 if trailing > 16 else 70)
    if signatures:
        likelihood = 99

    if found:
        lock = " It is AES-encrypted, so extracting it needs the password." if found["encrypted"] else ""
        summary = f"Carries a CipherVault WAV payload of {found['bytes']:,} bytes.{lock}"
    elif jumps and jumps["detected"]:
        summary = (f"The first {jumps['fraction'] * 100:.1f}% of the audio has its byte LSBs replaced — "
                   "each sample's bit 8 included.")
    elif trailing > 0:
        summary = f"{trailing:,} bytes are stored after the end of the WAV data."
    elif jumps and jumps["dense"]:
        summary = "This audio is too loud or noisy for the bit-8 test; only the CipherVault marker was checked."
    else:
        summary = "No test found a payload. Changes to bit 0 alone cannot be detected in audio."

    if jumps is None:
        jump_value, jump_score = f"not applicable to {sample_width * 8}-bit audio", 0
    elif jumps["detected"]:
        jump_value = (f"{jumps['lead'] * 100:.0f}% of samples over the first {jumps['fraction'] * 100:.1f}%, "
                      f"{jumps['after'] * 100:.0f}% after")
        jump_score = min(99, round(jumps["lead"] * 200))
    elif jumps["dense"]:
        jump_value, jump_score = f"inconclusive — {jumps['baseline'] * 100:.0f}% baseline", 0
    else:
        jump_value, jump_score = f"{jumps['baseline'] * 100:.0f}% baseline, no leading run", 0

    tests = [
        _signature_test(signatures, "the frame bytes' LSBs"),
        {
            "id": "bit8-jumps",
            "name": "Bit-8 jumps",
            "description": "Byte-wise LSB writers also flip each sample's bit 8 — a ±256 jump its neighbours expose.",
            "value": jump_value,
            "score": jump_score,
            "status": _status(jump_score),
        },
    ]

    if sample_width == 2:
        samples = np.frombuffer(frames[: len(frames) - len(frames) % 2], dtype="<i2")
        lsb = samples & 1
        counts, _ = np.histogram(samples, bins=HISTOGRAM_BINS, range=(-32768, 32768))
    else:
        lsb = raw & 1
        counts, _ = np.histogram(raw, bins=HISTOGRAM_BINS, range=(0, 256))
    one = round(float(np.mean(lsb)) * 100, 1)
    zero = round(100 - one, 1)

    anomalies = []
    if trailing > 0:
        anomalies.append({
            "title": "Data after the end of the WAV",
            "description": f"{trailing:,} bytes follow the RIFF container.",
            "severity": "CRITICAL",
        })
    anomalies.append({
        "title": "Bit-0 changes are invisible here",
        "description": "Replacing only each sample's lowest bit leaves no first-order trace in audio.",
        "severity": "INFO",
    })

    duration = n_frames / frame_rate if frame_rate else 0
    dimensions = f"{duration:.2f}s · {n_channels} ch · {frame_rate:,} Hz · {sample_width * 8}-bit"
    return _envelope(file_name, file_type, contents, dimensions, likelihood, summary,
                     {"audio": {"zero": zero, "one": one, "lsb0": zero, "lsb1": one}},
                     [{"name": "Audio LSB", "lsb0": zero, "lsb1": one, "zero": zero, "one": one}],
                     tests, anomalies, {"audio": counts.tolist()})
