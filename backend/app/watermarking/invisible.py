from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from PIL import Image
import numpy as np
import io

router = APIRouter()

DELIMITER = "1111111111111110"

def text_to_bits(text: str) -> str:
    return "".join(format(ord(c), "08b") for c in text) + DELIMITER

def bits_to_text(bits: str) -> str:
    bytes_list = [bits[i:i+8] for i in range(0, len(bits), 8)]
    chars = []
    for b in bytes_list:
        if len(b) < 8:
            break
        chars.append(chr(int(b, 2)))
    return "".join(chars)

@router.post("/embed")
async def embed_invisible_watermark(
    file: UploadFile = File(...),
    secret_data: str = Form(...)
):
    try:
        # Load image and convert to RGB
        img = Image.open(io.BytesIO(await file.read())).convert("RGB")
        img_arr = np.array(img, dtype=np.uint8)
        
        bit_stream = text_to_bits(secret_data)
        flat_arr = img_arr.flatten()
        
        if len(bit_stream) > len(flat_arr):
            raise HTTPException(
                status_code=400, 
                detail="Watermark text is too long for this image capacity."
            )
            
        # LSB embedding
        for i in range(len(bit_stream)):
            flat_arr[i] = (flat_arr[i] & 0xFE) | int(bit_stream[i])
            
        stego_arr = flat_arr.reshape(img_arr.shape)
        stego_img = Image.fromarray(stego_arr)
        
        # Output as lossless PNG so LSB bits are preserved
        output_buffer = io.BytesIO()
        stego_img.save(output_buffer, format="PNG")
        output_buffer.seek(0)
        
        return StreamingResponse(
            output_buffer, 
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=stego_watermarked.png"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to embed invisible watermark: {str(e)}")

@router.post("/extract")
async def extract_invisible_watermark(
    file: UploadFile = File(...)
):
    try:
        img = Image.open(io.BytesIO(await file.read())).convert("RGB")
        img_arr = np.array(img, dtype=np.uint8)
        flat_arr = img_arr.flatten()
        
        extracted_bits = []
        for byte in flat_arr:
            extracted_bits.append(str(byte & 1))
            bit_str = "".join(extracted_bits)
            if bit_str.endswith(DELIMITER):
                clean_bits = bit_str[:-len(DELIMITER)]
                extracted_text = bits_to_text(clean_bits)
                return {"success": True, "secret_data": extracted_text}
                
        return {"success": False, "secret_data": "", "detail": "No valid invisible watermark detected."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction error: {str(e)}")