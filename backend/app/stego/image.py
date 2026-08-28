import io
import base64
import numpy as np
import cv2
import scipy.fftpack as fft
from PIL import Image
from fastapi import APIRouter, UploadFile, File, Form

router = APIRouter()

# --- LSB Utility Functions ---
DELIMITER = "#####"

def text_to_bin(text: str) -> str:
    return ''.join(format(ord(c), '08b') for c in text)

def bin_to_text(binary_str: str) -> str:
    chars = [binary_str[i:i+8] for i in range(0, len(binary_str), 8)]
    return ''.join(chr(int(c, 2)) for c in chars if len(c) == 8 and int(c, 2) != 0)

def validate_image_format(content_type: str):
    """Reject lossy formats like JPEG."""
    if content_type in ["image/jpeg", "image/jpg"]:
        return False
    return True

# --- LSB Routes ---
@router.post("/lsb/hide")
async def hide_lsb_image(
    image: UploadFile = File(...),
    secretText: str = Form(...)
):
    if not validate_image_format(image.content_type):
        return {
            "success": False,
            "error": {"code": "UNSUPPORTED_FORMAT", "message": "JPEG format is not supported. Compression destroys LSB data. Please use PNG or BMP."}
        }

    try:
        img_bytes = await image.read()
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        pixels = np.array(img)

        binary_secret = text_to_bin(secretText + DELIMITER)
        data_len = len(binary_secret)
        flat_pixels = pixels.flatten()

        if data_len > len(flat_pixels):
            return {"success": False, "error": {"code": "PAYLOAD_TOO_LARGE", "message": "Image is too small to hold this text."}}

        for i in range(data_len):
            flat_pixels[i] = (flat_pixels[i] & ~1) | int(binary_secret[i])

        stego_pixels = flat_pixels.reshape(pixels.shape)
        stego_img = Image.fromarray(stego_pixels.astype('uint8'), 'RGB')

        out_buffer = io.BytesIO()
        stego_img.save(out_buffer, format="PNG")
        encoded_img = base64.b64encode(out_buffer.getvalue()).decode('utf-8')

        return {
            "success": True,
            "data": {
                "image": f"data:image/png;base64,{encoded_img}",
                "message": "Data successfully hidden."
            }
        }
    except Exception as e:
        return {"success": False, "error": {"code": "INTERNAL_ERROR", "message": str(e)}}

@router.post("/lsb/extract")
async def extract_lsb_image(
    image: UploadFile = File(...)
):
    try:
        img_bytes = await image.read()
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        pixels = np.array(img).flatten()

        extracted_bits = [str(pixel & 1) for pixel in pixels]
        binary_string = "".join(extracted_bits)

        extracted_text = bin_to_text(binary_string)

        if DELIMITER in extracted_text:
            secret = extracted_text.split(DELIMITER)[0]
            return {"success": True, "data": {"secretText": secret}}
        else:
            return {"success": False, "error": {"code": "NO_HIDDEN_DATA_FOUND", "message": "No hidden data detected"}}

    except Exception as e:
        return {"success": False, "error": {"code": "INTERNAL_ERROR", "message": str(e)}}

# --- DCT/DWT Routes (Week 3) ---
@router.post("/dct-dwt/hide")
async def hide_dct_image(image: UploadFile = File(...), secretText: str = Form(...)):
    # TODO: Implement 2D DCT on 8x8 blocks of the Y channel
    return {
        "success": True,
        "data": {"message": f"DCT hiding initiated for {image.filename}"}
    }

@router.post("/dct-dwt/extract")
async def extract_dct_image(image: UploadFile = File(...)):
    # TODO: Implement IDCT extraction
    return {
        "success": True,
        "data": {"secretText": "Stub text from DCT extractor"}
    }