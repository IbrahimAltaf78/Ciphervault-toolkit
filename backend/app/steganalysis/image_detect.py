import numpy as np
from PIL import Image
from scipy.stats import chisquare
from typing import List, Tuple, Dict, Any
from app.steganalysis.schemas import Anomaly

def analyze_image_steganography(image: Image.Image) -> Tuple[float, List[Anomaly], Dict[str, Any]]:
    """
    Performs Chi-Square analysis and histogram checks on an image.
    Returns (probability_score, anomalies_list, metrics_dict).
    """
    # Convert image to RGB array
    img_rgb = image.convert('RGB')
    data = np.array(img_rgb)
    
    anomalies: List[Anomaly] = []
    
    # 1. Chi-Square Analysis on Least Significant Bits (LSB)
    chi_score, chi_flagged = _chi_square_lsb_test(data)
    if chi_flagged:
        anomalies.append(Anomaly(
            category="LSB Statistical Analysis",
            severity="HIGH" if chi_score > 0.85 else "MEDIUM",
            description=f"Chi-square test on pixel values indicates LSB manipulation (p-value confidence score: {chi_score:.2f})."
        ))
        
    # 2. Histogram Anomaly Analysis
    hist_score, hist_flagged = _analyze_histogram(data)
    if hist_flagged:
        anomalies.append(Anomaly(
            category="Histogram Anomaly",
            severity="MEDIUM",
            description="Unusual frequency equalization detected between adjacent pixel pairs, suggesting sequential steganography."
        ))

    # Calculate overall image score (weighted average)
    overall_score = round(min(1.0, (chi_score * 0.6) + (hist_score * 0.4)), 3)
    
    metrics = {
        "chi_square_probability": round(chi_score, 4),
        "histogram_anomaly_score": round(hist_score, 4),
        "dimensions": f"{image.width}x{image.height}",
        "color_mode": image.mode
    }
    
    return overall_score, anomalies, metrics


def _chi_square_lsb_test(data: np.ndarray) -> Tuple[float, bool]:
    """
    Evaluates Pairs of Values (PoVs) for Chi-Square distribution across RGB channels.
    """
    # Flatten pixel data across channels
    flat_data = data.flatten()
    
    # Calculate frequencies for values 0..255
    counts = np.bincount(flat_data, minlength=256)
    
    # Measure Pairs of Values (2k, 2k+1)
    observed = []
    expected = []
    
    for k in range(128):
        y_2k = counts[2 * k]
        y_2k1 = counts[2 * k + 1]
        
        # Only evaluate PoVs with adequate sample size
        if (y_2k + y_2k1) > 10:
            avg = (y_2k + y_2k1) / 2.0
            observed.extend([y_2k, y_2k1])
            expected.extend([avg, avg])
            
    if len(observed) < 10:
        return 0.0, False

    # Perform Chi-Square test
    chi_stat, p_value = chisquare(observed, f_exp=expected)
    
    # In LSB embedding, p-value close to 1 indicates observed matches expected equalized PoVs (high suspicion)
    prob = 1.0 - p_value if not np.isnan(p_value) else 0.0
    
    return float(prob), prob > 0.75


def _analyze_histogram(data: np.ndarray) -> Tuple[float, bool]:
    """
    Scans for unusual flattening between even and odd adjacent pixel counts.
    """
    flat = data.flatten()
    counts = np.bincount(flat, minlength=256)
    
    # Calculate relative differences between adjacent pairs (2k vs 2k+1)
    evens = counts[0::2].astype(float)
    odds = counts[1::2].astype(float)
    
    pairs_sum = evens + odds
    # Avoid divide-by-zero
    pairs_sum[pairs_sum == 0] = 1.0
    
    pair_diffs = np.abs(evens - odds) / pairs_sum
    avg_pair_diff = float(np.mean(pair_diffs))
    
    # Natural images usually have non-zero pair differences; near 0 indicates equalized PoVs
    anomaly_score = max(0.0, 1.0 - (avg_pair_diff * 4.0))
    
    return float(anomaly_score), anomaly_score > 0.65