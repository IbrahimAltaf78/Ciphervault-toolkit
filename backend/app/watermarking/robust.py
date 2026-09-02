from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
import cv2
import numpy as np
import io

router = APIRouter()

BLOCK_SIZE = 8
ALPHA = 35.0  # DCT modification strength factor for robust persistence

@router.post("/embed")
async def embed_robust_watermark(
    file: UploadFile = File(...),
    watermark_key: str = Form(...)
):
    try:
        file_bytes = np.frombuffer(await file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file.")

        # Convert to YCrCb color space to isolate Luminance (Y channel)
        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
        y_channel = np.float32(ycrcb[:, :, 0])

        h, w = y_channel.shape
        
        # Add 16-bit payload length header followed by text bitstream
        text_bytes = watermark_key.encode('utf-8')
        length_bits = format(len(text_bytes), '016b')
        payload_bits = length_bits + "".join(format(b, '08b') for b in text_bytes)
        
        key_bits = [int(b) for b in payload_bits]
        bit_idx = 0

        for i in range(0, h - BLOCK_SIZE + 1, BLOCK_SIZE):
            for j in range(0, w - BLOCK_SIZE + 1, BLOCK_SIZE):
                if bit_idx >= len(key_bits):
                    break

                block = y_channel[i:i+BLOCK_SIZE, j:j+BLOCK_SIZE]
                dct_block = cv2.dct(block)

                # Embed into mid-frequency coefficient (4, 3)
                bit = key_bits[bit_idx]
                if bit == 1:
                    dct_block[4, 3] = abs(dct_block[4, 3]) + ALPHA
                else:
                    dct_block[4, 3] = -abs(dct_block[4, 3]) - ALPHA

                y_channel[i:i+BLOCK_SIZE, j:j+BLOCK_SIZE] = cv2.idct(dct_block)
                bit_idx += 1

        ycrcb[:, :, 0] = np.clip(y_channel, 0, 255).astype(np.uint8)
        result_img = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)

        _, encoded_img = cv2.imencode(".png", result_img)
        return StreamingResponse(
            io.BytesIO(encoded_img.tobytes()), 
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=robust_watermarked.png"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Robust embedding failed: {str(e)}")


@router.post("/extract")
async def extract_robust_watermark(
    file: UploadFile = File(...)
):
    try:
        file_bytes = np.frombuffer(await file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file.")

        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
        y_channel = np.float32(ycrcb[:, :, 0])
        h, w = y_channel.shape

        extracted_bits = []

        for i in range(0, h - BLOCK_SIZE + 1, BLOCK_SIZE):
            for j in range(0, w - BLOCK_SIZE + 1, BLOCK_SIZE):
                block = y_channel[i:i+BLOCK_SIZE, j:j+BLOCK_SIZE]
                dct_block = cv2.dct(block)

                # Read mid-frequency coefficient sign
                bit = 1 if dct_block[4, 3] > 0 else 0
                extracted_bits.append(bit)

        # Parse 16-bit length header
        if len(extracted_bits) < 16:
            raise HTTPException(status_code=400, detail="Image too small to contain a watermark.")

        length_bits = "".join(str(b) for b in extracted_bits[:16])
        text_byte_len = int(length_bits, 2)

        total_payload_bits = 16 + (text_byte_len * 8)
        if len(extracted_bits) < total_payload_bits or text_byte_len == 0:
            return {"extracted_key": "", "message": "No valid robust watermark detected."}

        text_bits = extracted_bits[16:total_payload_bits]
        byte_chunks = [
            int("".join(str(b) for b in text_bits[k:k+8]), 2)
            for k in range(0, len(text_bits), 8)
        ]

        extracted_text = bytes(byte_chunks).decode("utf-8", errors="replace")

        return {
            "extracted_key": extracted_text,
            "message": "Robust watermark extracted successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction error: {str(e)}")