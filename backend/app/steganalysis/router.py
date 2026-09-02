import io
from PIL import Image
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.steganalysis.schemas import AnalysisReport, Anomaly
from app.steganalysis.image_detect import analyze_image_steganography
from app.steganalysis.metadata import analyze_metadata_and_eof

router = APIRouter(prefix="/api/analyze", tags=["Steganalysis"])

@router.post("/image", response_model=AnalysisReport)
async def analyze_image(file: UploadFile = File(...)):
    """
    Ingests an uploaded image and performs Chi-Square LSB analysis, 
    histogram anomaly scanning, EXIF metadata extraction, and EOF payload checks.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image.")

    file_bytes = await file.read()
    
    try:
        image = Image.open(io.BytesIO(file_bytes))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file format.")

    # 1. Run Statistical & Histogram Analysis
    img_score, img_anomalies, img_metrics = analyze_image_steganography(image)
    
    # 2. Run Metadata & EOF Scan
    meta_score, meta_anomalies, metadata_info = analyze_metadata_and_eof(file_bytes, file.filename or "uploaded_image")

    # Combine anomalies and compute overall weighted probability score
    all_anomalies = img_anomalies + meta_anomalies
    overall_score = round(min(1.0, max(img_score, meta_score)), 2)

    return AnalysisReport(
        filename=file.filename or "unknown",
        file_type=file.content_type,
        probability_score=overall_score,
        is_suspicious=overall_score > 0.50,
        anomalies=all_anomalies,
        metadata={**img_metrics, **metadata_info}
    )


@router.post("/audio", response_model=AnalysisReport)
async def analyze_audio(file: UploadFile = File(...)):
    """
    Ingests an audio file and scans basic header structure and trailing EOF payload markers.
    """
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid audio file.")

    file_bytes = await file.read()
    anomalies = []

    # Simple EOF check for trailing audio bytes
    if len(file_bytes) > 0 and file_bytes.endswith(b"\x00" * 32):
        anomalies.append(Anomaly(
            category="Audio Header / Padding",
            severity="LOW",
            description="Detected unusual null-byte trailing block at the end of audio file stream."
        ))

    score = 0.60 if anomalies else 0.0

    return AnalysisReport(
        filename=file.filename or "unknown",
        file_type=file.content_type,
        probability_score=score,
        is_suspicious=score > 0.50,
        anomalies=anomalies,
        metadata={"file_size_bytes": len(file_bytes)}
    )