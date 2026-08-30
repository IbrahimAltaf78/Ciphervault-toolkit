from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from fastapi.responses import JSONResponse
import io
import base64
import numpy as np
from PIL import Image

# Removed the prefix from here because main.py handles it!
router = APIRouter()

def create_envelope(data: dict = None, success: bool = True, message: str = None, code: str = None):
    if success:
        return {"success": True, "data": data or {}}
    return {"success": False, "code": code or "BAD_REQUEST", "message": message or "An error occurred."}

def validate_image_format(file: UploadFile):
    filename = file.filename.lower()
    if filename.endswith(('.jpg', '.jpeg')) or file.content_type == 'image/jpeg':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="JPEG format rejected: Lossy compression destroys LSB steganographic data. Please upload lossless PNG or BMP files."
        )

@router.post("/hide")
async def hide_data(
    file: UploadFile = File(...),
    secret_text: str = Form(...),
    algorithm: str = Form(...)
):
    validate_image_format(file)
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    img_arr = np.array(image, dtype=np.uint8)

    # Convert secret text to binary string with delimiter
    binary_secret = ''.join(format(ord(c), '08b') for c in secret_text) + '1111111111111110'
    
    if len(binary_secret) > img_arr.size:
        return JSONResponse(
            status_code=400,
            content=create_envelope(success=False, code="PAYLOAD_TOO_LARGE", message="Secret text is too long for this cover image.")
        )

    # 1-bit LSB encoding
    flat_arr = img_arr.flatten()
    for i in range(len(binary_secret)):
        flat_arr[i] = (flat_arr[i] & 0xFE) | int(binary_secret[i])
    
    encoded_img = Image.fromarray(flat_arr.reshape(img_arr.shape))
    
    buffer = io.BytesIO()
    encoded_img.save(buffer, format="PNG")
    b64_str = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"

    return create_envelope(data={"image": b64_str, "algorithm": algorithm})

@router.post("/extract")
async def extract_data(
    file: UploadFile = File(...),
    algorithm: str = Form(...)
):
    validate_image_format(file)
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    img_arr = np.array(image, dtype=np.uint8)

    flat_arr = img_arr.flatten()
    binary_data = ""
    delimiter = '1111111111111110'

    for pixel in flat_arr:
        binary_data += str(pixel & 1)
        if delimiter in binary_data:
            break

    if delimiter in binary_data:
        raw_bits = binary_data.split(delimiter)[0]
        bytes_list = [raw_bits[i:i+8] for i in range(0, len(raw_bits), 8)]
        extracted_text = ''.join(chr(int(b, 2)) for b in bytes_list if len(b) == 8)
    else:
        extracted_text = "No hidden text found."

    return create_envelope(data={"secretText": extracted_text, "algorithm": algorithm})