from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import Watermarking Routers
from app.watermarking.visible import router as visible_router
from app.watermarking.invisible import router as invisible_router
from app.watermarking.fragile import router as fragile_router
from app.watermarking.robust import router as robust_router

# Import Steganography Routers
from app.steganography.audio import router as audio_stego_router
from app.steganography.video import router as video_stego_router
from app.steganography.image import router as image_stego_router

# Import Steganalysis Router
from app.steganalysis.router import router as steganalysis_router

app = FastAPI(
    title="CipherVault Security Toolkit",
    description="Backend API for media steganography, watermarking, and steganalysis operations.",
    version="1.0.0",
)

# Enable CORS for Next.js Frontend
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check / Root Endpoint
@app.get("/", tags=["Health Check"])
async def root():
    return {
        "status": "online",
        "service": "CipherVault Security Toolkit API",
        "docs": "/docs"
    }

# Mount Watermarking Routers
app.include_router(visible_router, prefix="/api/watermark/visible", tags=["Visible Watermarking"])
app.include_router(invisible_router, prefix="/api/watermark/invisible", tags=["Invisible Watermarking"])
app.include_router(fragile_router, prefix="/api/watermark/fragile", tags=["Fragile Watermarking"])
app.include_router(robust_router, prefix="/api/watermark/robust", tags=["Robust Watermarking"])

# Mount Steganography Routers
app.include_router(audio_stego_router, prefix="/api/stego/audio", tags=["Audio Steganography"])
app.include_router(video_stego_router, prefix="/api/stego/video", tags=["Video Steganography"])
app.include_router(image_stego_router, prefix="/api/stego/image", tags=["Image Steganography"])

# Mount Steganalysis Router
app.include_router(steganalysis_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)