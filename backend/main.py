from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.stego import image

app = FastAPI(title="CipherVault Python Microservice")

# Allow Next.js frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"success": True, "message": "Backend is healthy"}

# Delegate all /api/stego/image routes to the image.py router
app.include_router(image.router, prefix="/api/stego/image")