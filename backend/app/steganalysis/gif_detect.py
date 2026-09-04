# backend/app/steganalysis/gif_detect.py

import io
from typing import Tuple, List, Dict, Any
import numpy as np
from PIL import Image, ImageSequence

from app.steganalysis.schemas import Anomaly
from app.steganalysis.image_detect import _chi_square_lsb_test

def analyze_gif_frames(content: bytes) -> Tuple[float, List[Anomaly], Dict[str, Any]]:
    """
    Performs frame-by-frame LSB and anomaly checks on animated GIF files.
    """
    gif = Image.open(io.BytesIO(content))
    
    anomalies: List[Anomaly] = []
    frame_scores: List[float] = []
    total_frames = 0
    flagged_frames = []

    for idx, frame in enumerate(ImageSequence.Iterator(gif)):
        total_frames += 1
        # Convert frame to RGB numpy array
        frame_rgb = frame.convert("RGB")
        frame_data = np.array(frame_rgb)

        # Run Chi-Square test per frame
        prob, is_flagged = _chi_square_lsb_test(frame_data)
        frame_scores.append(prob)

        if is_flagged:
            flagged_frames.append(idx)

    max_score = float(np.max(frame_scores)) if frame_scores else 0.0
    avg_score = float(np.mean(frame_scores)) if frame_scores else 0.0

    # Flag anomaly if multiple frames contain hidden data
    if len(flagged_frames) > 0:
        anomalies.append(
            Anomaly(
                category="GIF Frame Steganography",
                severity="HIGH" if len(flagged_frames) > (total_frames / 2) else "MEDIUM",
                description=(
                    f"LSB manipulation detected in {len(flagged_frames)} of {total_frames} frames "
                    f"(Flagged Frame Indices: {flagged_frames[:5]}...)."
                ),
            )
        )

    metadata = {
        "format": "GIF",
        "total_frames": total_frames,
        "animated": total_frames > 1,
        "flagged_frame_count": len(flagged_frames),
        "max_frame_anomaly_score": round(max_score, 4),
        "avg_frame_anomaly_score": round(avg_score, 4),
    }

    overall_score = round(max_score, 3)
    return overall_score, anomalies, metadata