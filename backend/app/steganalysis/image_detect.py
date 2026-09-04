import io
from typing import Any, Dict, List, Tuple
import numpy as np
from PIL import Image
from scipy.stats import chi2

from app.steganalysis.metadata import (
    check_eof_payload,
    extract_and_validate_metadata,
)
from app.steganalysis.schemas import Anomaly


def analyze_image_bytes(
    content: bytes, filename: str = "image.png"
) -> Tuple[float, List[Anomaly], Dict[str, Any]]:
    """Main entry point for raw byte payloads.

    Runs statistical checks, EXIF metadata validation, and EOF trailer checks.
    """
    image = Image.open(io.BytesIO(content))
    score, anomalies, metadata = analyze_image_steganography(image)

    # Extract EXIF metadata & validate signatures
    exif_meta, exif_anomalies = extract_and_validate_metadata(content)
    metadata.update(exif_meta)
    anomalies.extend(exif_anomalies)

    # Scan raw bytes for trailing data beyond normal EOF markers
    img_fmt = image.format or "PNG"
    eof_score, eof_anomaly, _ = check_eof_payload(content, img_fmt)
    if eof_anomaly:
        anomalies.append(eof_anomaly)
        score = max(score, eof_score)
        metadata["eof_payload_detected"] = True

    return round(score, 3), anomalies, metadata


def analyze_image_steganography(
    image: Image.Image,
) -> Tuple[float, List[Anomaly], Dict[str, Any]]:
    """Performs Chi-Square analysis and histogram checks on an image object."""
    img_rgb = image.convert("RGB")
    data = np.array(img_rgb)

    anomalies: List[Anomaly] = []

    # 1. Chi-Square Analysis on Least Significant Bits (LSB)
    chi_score, chi_flagged = _chi_square_lsb_test(data)
    if chi_flagged:
        anomalies.append(
            Anomaly(
                category="LSB Statistical Analysis",
                severity="HIGH" if chi_score > 0.85 else "MEDIUM",
                description=(
                    "Chi-square test on pixel values indicates LSB manipulation"
                    f" (confidence score: {chi_score:.2f})."
                ),
            )
        )

    # 2. Histogram Anomaly Analysis
    hist_score, hist_flagged = _analyze_histogram(data)
    if hist_flagged:
        anomalies.append(
            Anomaly(
                category="Histogram Anomaly",
                severity="MEDIUM",
                description=(
                    "Unusual frequency equalization detected between adjacent"
                    " pixel pairs, suggesting sequential steganography."
                ),
            )
        )

    overall_score = round(min(1.0, (chi_score * 0.6) + (hist_score * 0.4)), 3)

    metrics = {
        "chi_square_probability": round(chi_score, 4),
        "histogram_anomaly_score": round(hist_score, 4),
        "dimensions": f"{image.width}x{image.height}",
        "color_mode": image.mode,
    }

    return overall_score, anomalies, metrics


def _chi_square_lsb_test(data: np.ndarray) -> Tuple[float, bool]:
    """Measures LSB statistical equalization (Pairs of Values attack)."""
    flat_data = data.flatten()
    counts = np.bincount(flat_data, minlength=256)

    evens = counts[0::2]
    odds = counts[1::2]
    pair_sums = evens + odds

    # Select valid pairs with sufficient sample size (> 10 occurrences)
    valid_mask = pair_sums > 10
    k = np.count_nonzero(valid_mask)
    if k < 5:
        return 0.0, False

    # Expected value under LSB randomization assumption: average of even/odd count
    expected = pair_sums[valid_mask] / 2.0
    
    # Calculate Chi-Square statistic sum over odd pixel counts
    # If LSBs are randomized, odd counts closely match pair averages -> Chi-square is SMALL
    chi_stat = np.sum(((odds[valid_mask] - expected) ** 2) / expected)
    
    # Degrees of freedom = number of valid pair categories (k)
    # p-value = probability of seeing a chi_stat this small under natural randomness
    p_value = float(chi2.cdf(chi_stat, df=k))
    
    # High prob (low chi_stat relative to df) indicates suspicious LSB equalization
    prob = max(0.0, min(1.0, 1.0 - p_value))

    return prob, prob > 0.75


def _analyze_histogram(data: np.ndarray) -> Tuple[float, bool]:
    """Analyzes pixel pair frequency differences to detect sequential embedding."""
    flat = data.flatten()
    counts = np.bincount(flat, minlength=256)

    evens = counts[0::2].astype(float)
    odds = counts[1::2].astype(float)

    pairs_sum = evens + odds
    valid_pairs = pairs_sum > 10

    if not np.any(valid_pairs):
        return 0.0, False

    pair_diffs = np.abs(evens[valid_pairs] - odds[valid_pairs]) / pairs_sum[valid_pairs]
    avg_pair_diff = float(np.mean(pair_diffs))

    # Stego images force evens and odds to converge (avg_pair_diff close to 0)
    # Clean natural images feature distinct differences between adjacent luminance values
    # Trigger threshold only when average difference drops below ~5%
    if avg_pair_diff < 0.05:
        anomaly_score = min(1.0, (0.05 - avg_pair_diff) / 0.05)
    else:
        anomaly_score = 0.0

    return float(anomaly_score), anomaly_score > 0.65