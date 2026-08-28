from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.steganography.image import router as image_router

app = FastAPI(title="CipherVault API")

# Configure CORS for Next.js frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register image steganography routes
app.include_router(image_router)

@app.get("/")
def read_root():
    return {"status": "online", "message": "CipherVault API is running"}