# backend/app/stego/image.py
from fastapi import APIRouter, UploadFile, File, Form
# ... include your Pillow/NumPy imports and text_to_bin/bin_to_text helpers from yesterday ...

router = APIRouter()

def validate_image_format(content_type: str):
    """Reject lossy formats like JPEG."""
    if content_type in ["image/jpeg", "image/jpg"]:
        return False
    return True

@router.post("/lsb/hide")
async def hide_lsb_image(image: UploadFile = File(...), secretText: str = Form(...)):
    if not validate_image_format(image.content_type):
        return {
            "success": False, 
            "error": {"code": "UNSUPPORTED_FORMAT", "message": "JPEG format is not supported. Compression destroys LSB data. Please use PNG or BMP."}
        }
    
    # ... paste your existing LSB hiding logic here ...
    return {"success": True, "data": {"message": "Data successfully hidden.", "image": "..."}}

@router.post("/lsb/extract")
async def extract_lsb_image(image: UploadFile = File(...)):
    # ... paste your existing LSB extracting logic here ...
    pass