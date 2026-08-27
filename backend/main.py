from fastapi import FastAPI, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware

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

@app.post("/api/stego/image/lsb/hide")
async def hide_lsb_image(
    image: UploadFile = File(...),
    secretText: str = Form(...)
):
    # TODO: Implement Pillow and NumPy logic to embed text into the image LSB
    return {
        "success": True,
        "data": {
            "message": f"Stub: Received {image.filename} and secret text of length {len(secretText)}"
        }
    }
