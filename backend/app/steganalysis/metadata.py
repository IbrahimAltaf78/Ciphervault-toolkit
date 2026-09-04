import io
import logging
import struct
from typing import Dict, List, Optional, Tuple, Any
import exifread
from PIL import Image

from app.steganalysis.schemas import Anomaly

logger = logging.getLogger(__name__)

# Known editing or steganographic software signatures to flag
STEGO_SOFTWARE_KEYWORDS = [
    "outguess", "steghide", "openstego", "stegdetect", "photoshop", 
    "gimp", "paint.net", "exiftool", "imagemagick", "stegosuite"
]


def extract_and_validate_metadata(image_bytes: bytes) -> Tuple[Dict[str, Any], List[Anomaly]]:
    """
    Extracts detailed EXIF metadata and checks for suspicious software tags,
    hidden user comment fields, or missing metadata.
    Returns a dictionary of extracted metadata and a list of detected Anomaly objects.
    """
    metadata: Dict[str, Any] = {
        "has_exif": False,
        "camera_info": {},
        "software": None,
        "comment": None,
        "raw_tags": {},
    }
    anomalies: List[Anomaly] = []

    try:
        buffer = io.BytesIO(image_bytes)
        tags = exifread.process_file(buffer, details=False)

        if tags:
            metadata["has_exif"] = True
            
            # Format raw tags cleanly, ensuring all values are printable strings
            raw_tags = {}
            for tag_key, tag_val in tags.items():
                if tag_key not in ["JPEGThumbnail", "TIFFThumbnail"]:
                    raw_tags[tag_key] = str(tag_val)
            metadata["raw_tags"] = raw_tags

            # 1. Camera Details Extraction & Consistency
            make = tags.get("Image Make")
            model = tags.get("Image Model")
            exposure = tags.get("EXIF ExposureTime")
            fnumber = tags.get("EXIF FNumber")
            iso = tags.get("EXIF ISOSpeedRatings")

            if make or model:
                camera_dict = {
                    "make": str(make).strip() if make else "Unknown",
                    "model": str(model).strip() if model else "Unknown",
                }
                if exposure:
                    camera_dict["exposure_time"] = str(exposure)
                if fnumber:
                    camera_dict["f_number"] = str(fnumber)
                if iso:
                    camera_dict["iso"] = str(iso)

                metadata["camera_info"] = camera_dict
            
            # Inconsistency check: Model exists without Make
            if model and not make:
                anomalies.append(
                    Anomaly(
                        category="Metadata Anomaly",
                        severity="MEDIUM",
                        description="EXIF data contains Camera Model information without a Camera Make.",
                    )
                )

            # 2. Check Software Signatures
            software = tags.get("Image Software") or tags.get("EXIF ProcessingSoftware")
            if software:
                soft_str = str(software).strip()
                metadata["software"] = soft_str
                
                if any(kw in soft_str.lower() for kw in STEGO_SOFTWARE_KEYWORDS):
                    anomalies.append(
                        Anomaly(
                            category="Metadata Anomaly",
                            severity="MEDIUM",
                            description=f"Image contains metadata indicating processing by known editing/stego tool: '{soft_str}'",
                        )
                    )

            # 3. User Comment / Image Description Payload Checks
            comment = (
                tags.get("EXIF UserComment") 
                or tags.get("Image ImageDescription") 
                or tags.get("Image XPComment")
            )
            if comment:
                comm_str = str(comment).strip()
                if comm_str:
                    metadata["comment"] = comm_str
                    anomalies.append(
                        Anomaly(
                            category="Metadata Anomaly",
                            severity="LOW",
                            description="Image contains explicit UserComment or Description tags which can store hidden text payloads.",
                        )
                    )

        else:
            # Check for stripped JPEG EXIF data
            pil_img = Image.open(io.BytesIO(image_bytes))
            if pil_img.format in ["JPEG", "JPG"]:
                anomalies.append(
                    Anomaly(
                        category="Metadata Anomaly",
                        severity="LOW",
                        description="EXIF metadata is missing or stripped from JPEG image.",
                    )
                )

    except Exception as e:
        logger.error(f"Error parsing EXIF metadata: {e}")
        anomalies.append(
            Anomaly(
                category="Metadata Parsing Error",
                severity="LOW",
                description=f"Failed to parse EXIF metadata: {str(e)}",
            )
        )

    return metadata, anomalies


def check_eof_payload(
    image_bytes: bytes, image_format: Optional[str] = None
) -> Tuple[float, Optional[Anomaly], Optional[bytes]]:
    """
    Checks for trailing data appended past the file's expected EOF marker.
    Returns: (anomaly_score, Anomaly or None, raw_payload_bytes or None)
    """
    eof_markers = {
        "JPEG": b"\xff\xd9",
        "JPG": b"\xff\xd9",
        "PNG": b"\x49\x45\x4e\x44\xae\x42\x60\x82",
    }

    # Auto-detect format via Pillow if not explicitly supplied
    fmt = image_format.upper() if image_format else None
    if not fmt:
        try:
            pil_img = Image.open(io.BytesIO(image_bytes))
            fmt = pil_img.format.upper() if pil_img.format else "JPEG"
        except Exception:
            fmt = "JPEG"

    marker = eof_markers.get(fmt, b"\xff\xd9")
    eof_pos = image_bytes.rfind(marker)

    if eof_pos != -1:
        expected_end = eof_pos + len(marker)
        if expected_end < len(image_bytes):
            extra_bytes = image_bytes[expected_end:]
            extra_len = len(extra_bytes)
            
            # Calculate severity based on trailing payload size
            score = 0.95 if extra_len > 100 else 0.70
            anomaly = Anomaly(
                category="EOF Payload Detected",
                severity="HIGH" if extra_len > 100 else "MEDIUM",
                description=f"Detected {extra_len} trailing bytes appended beyond file end marker.",
            )
            return score, anomaly, extra_bytes

    return 0.0, None, None


def extract_mp3_metadata(file_bytes: bytes) -> Tuple[Dict[str, Any], List[Anomaly]]:
    """
    Scans MP3 frame headers and ID3 tags for steganographic anomalies or non-standard padding.
    """
    metadata: Dict[str, Any] = {
        "format": "MP3",
        "has_id3v2": False,
        "valid_frames": 0,
        "corrupted_bytes": 0,
    }
    anomalies: List[Anomaly] = []

    pos = 0
    total_len = len(file_bytes)

    # Check for ID3v2 Header
    if total_len > 10 and file_bytes[:3] == b"ID3":
        metadata["has_id3v2"] = True
        id3_size = (
            (file_bytes[6] & 0x7F) << 21
            | (file_bytes[7] & 0x7F) << 14
            | (file_bytes[8] & 0x7F) << 7
            | (file_bytes[9] & 0x7F)
        )
        pos = 10 + id3_size

    invalid_bytes = 0
    valid_frames = 0

    while pos < total_len - 4:
        header = struct.unpack(">I", file_bytes[pos:pos+4])[0]
        # Frame sync bitmask: 11 bits set (0xFFE00000)
        if (header & 0xFFE00000) == 0xFFE00000:
            valid_frames += 1
            pos += 418  # Approximate frame step
        else:
            invalid_bytes += 1
            pos += 1

    metadata["valid_frames"] = valid_frames
    metadata["corrupted_bytes"] = invalid_bytes

    if invalid_bytes > 500:
        anomalies.append(
            Anomaly(
                category="MP3 Structure Anomaly",
                severity="HIGH",
                description=f"Detected {invalid_bytes} bytes of non-audio padding/junk embedded inside MP3 stream.",
            )
        )

    return metadata, anomalies