from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import your module routers
from app.steganography.image import router as image_router
from app.steganography.audio import router as audio_router
from app.steganography.video import router as video_router 

app = FastAPI(title="CipherVault API")

# Allow communication from your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Must be explicit when allow_credentials=True
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"] # Expose this so frontend can read the filename
)

# Register routes with the specific prefixes your frontend expects
app.include_router(image_router, prefix="/api/stego/image", tags=["Image Steganography"])
app.include_router(audio_router, prefix="/api/stego/audio", tags=["Audio Steganography"])
app.include_router(video_router, prefix="/api/stego/video", tags=["Video Steganography"]) 

@app.get("/")
def read_root():
    return {"status": "online", "message": "CipherVault API is running"}