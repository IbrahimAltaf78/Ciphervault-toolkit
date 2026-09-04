from fastapi import APIRouter, UploadFile, File, HTTPException
from app.steganalysis.schemas import AnalysisReport
from app.steganalysis.image_detect import analyze_image_bytes
from app.steganalysis.analyze_audio_file import analyze_audio_bytes
from app.steganalysis.gif_detect import analyze_gif_frames
from app.steganalysis.metadata import extract_mp3_metadata

router = APIRouter(prefix="/api/analyze", tags=["steganalysis"])


@router.post("/image", response_model=AnalysisReport)
async def analyze_image_endpoint(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image file format")

    try:
        content = await file.read()
        filename = (file.filename or "image.png").lower()

        # Route animated GIFs through dedicated frame-by-frame analyzer
        if filename.endswith(".gif"):
            prob_score, anomalies, metadata = analyze_gif_frames(content)
        else:
            prob_score, anomalies, metadata = analyze_image_bytes(
                content, file.filename or "image.png"
            )

        is_suspicious = prob_score >= 0.50

        return AnalysisReport(
            filename=file.filename or "image.png",
            file_type=file.content_type,
            probability_score=round(prob_score, 2),
            is_suspicious=is_suspicious,
            anomalies=anomalies,
            metadata=metadata,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Image analysis failed: {str(e)}"
        )


@router.post("/audio", response_model=AnalysisReport)
async def analyze_audio_endpoint(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid audio file format")

    try:
        content = await file.read()
        filename = (file.filename or "audio.wav").lower()

        if filename.endswith(".mp3"):
            metadata, anomalies = extract_mp3_metadata(content)
            prob_score = 0.85 if len(anomalies) > 0 else 0.05
        else:
            prob_score, anomalies, metadata = analyze_audio_bytes(content)

        is_suspicious = prob_score >= 0.50

        return AnalysisReport(
            filename=file.filename or "audio.wav",
            file_type=file.content_type,
            probability_score=round(prob_score, 2),
            is_suspicious=is_suspicious,
            anomalies=anomalies,
            metadata=metadata,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Audio analysis failed: {str(e)}"
        )