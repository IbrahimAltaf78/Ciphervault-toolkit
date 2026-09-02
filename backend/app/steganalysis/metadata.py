import io
import exifread
from PIL import Image
from typing import List, Tuple, Dict, Any, Optional
from app.steganalysis.schemas import Anomaly

# Standard End-Of-File (EOF) hex signatures
EOF_MARKERS = {
    "JPEG": b"\xff\xd9",
    "PNG": b"\x00\x00\x00\x00IEND\xaeB`\x82",
    "GIF": b"\x00\x3b",
}

def analyze_metadata_and_eof(file_bytes: bytes, filename: str) -> Tuple[float, List[Anomaly], Dict[str, Any]]:
    """
    Scans raw file bytes for EXIF data anomalies and trailing data appended past the EOF marker.
    Returns (anomaly_score, list_of_anomalies, metadata_dict).
    """
    anomalies: List[Anomaly] = []
    metadata_info: Dict[str, Any] = {}
    
    # 1. Extract EXIF Metadata
    try:
        tags = exifread.process_file(io.BytesIO(file_bytes), details=False)
        for tag, value in tags.items():
            if tag not in ["JPEGThumbnail", "TIFFThumbnail"]:
                metadata_info[tag] = str(value)
    except Exception as e:
        metadata_info["exif_error"] = f"Failed to parse EXIF: {str(e)}"

    # Check for suspicious or missing EXIF software signatures
    software_tag = metadata_info.get("Image Software", "").lower()
    if any(stego_tool in software_tag for stego_tool in ["steghide", "outguess", "openpuff"]):
        anomalies.append(Anomaly(
            category="Metadata EXIF",
            severity="HIGH",
            description=f"EXIF software tag indicates known steganography tool: '{software_tag}'."
        ))

    # 2. Check for Appended Data Past EOF (End-of-File)
    eof_score, eof_anomaly = _check_eof_appended_data(file_bytes)
    if eof_anomaly:
        anomalies.append(eof_anomaly)

    overall_score = 0.90 if eof_anomaly and eof_anomaly.severity == "HIGH" else (0.50 if anomalies else 0.0)
    
    return overall_score, anomalies, metadata_info


def _check_eof_appended_data(file_bytes: bytes) -> Tuple[float, Optional[Anomaly]]:
    """
    Detects if extra payload bytes exist beyond standard JPEG/PNG EOF markers.
    """
    file_type = None
    if file_bytes.startswith(b"\xff\xd8"):
        file_type = "JPEG"
    elif file_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        file_type = "PNG"
    elif file_bytes.startswith(b"GIF8"):
        file_type = "GIF"

    if not file_type or file_type not in EOF_MARKERS:
        return 0.0, None

    marker = EOF_MARKERS[file_type]
    marker_pos = file_bytes.rfind(marker)

    if marker_pos == -1:
        return 0.5, Anomaly(
            category="EOF Scan",
            severity="MEDIUM",
            description=f"Corrupted structure: Standard {file_type} EOF marker not found."
        )

    expected_end = marker_pos + len(marker)
    extra_bytes_count = len(file_bytes) - expected_end

    # Allow minor padding bytes (e.g. 1-4 trailing null bytes)
    if extra_bytes_count > 10:
        return 1.0, Anomaly(
            category="EOF Scan",
            severity="HIGH",
            description=f"Detected {extra_bytes_count} trailing bytes appended beyond the official {file_type} EOF marker."
        )

    return 0.0, None