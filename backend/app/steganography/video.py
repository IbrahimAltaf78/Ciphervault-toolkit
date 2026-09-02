import cv2
import os
import tempfile
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse

router = APIRouter()
DELIMITER = '1111111111111110'

def text_to_bits(text: str) -> str:
    return ''.join(format(ord(c), '08b') for c in text)

@router.post("/hide")
async def hide_video(
    file: UploadFile = File(...),
    secret_text: str = Form(None),
    text: str = Form(None),
    payload: str = Form(None)
):
    content = secret_text or text or payload
    if not content:
        raise HTTPException(status_code=400, detail="Secret text payload is required.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".avi") as temp_in:
        temp_in.write(await file.read())
        input_path = temp_in.name

    output_path = tempfile.NamedTemporaryFile(delete=False, suffix=".avi").name

    try:
        cap = cv2.VideoCapture(input_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fourcc = cv2.VideoWriter_fourcc(*'FFV1')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        binary_secret = text_to_bits(content) + DELIMITER
        total_bits = len(binary_secret)
        bits_embedded = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Embed bits into frame only if bits remain
            if bits_embedded < total_bits:
                flat = frame.flatten()
                remaining = total_bits - bits_embedded
                chunk_size = min(remaining, len(flat))
                
                bits_chunk = np.fromiter(binary_secret[bits_embedded:bits_embedded + chunk_size], dtype=np.uint8) - 48
                flat[:chunk_size] = (flat[:chunk_size] & 254) | bits_chunk
                bits_embedded += chunk_size
                frame = flat.reshape(frame.shape)

            out.write(frame)

        cap.release()
        out.release()

        return FileResponse(output_path, media_type="video/x-msvideo", filename=f"stego_{file.filename}")
    finally:
        if os.path.exists(input_path): os.remove(input_path)

@router.post("/extract")
async def extract_video(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".avi") as temp_in:
        temp_in.write(await file.read())
        input_path = temp_in.name

    try:
        cap = cv2.VideoCapture(input_path)
        extracted_bits = []

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            flat = frame.flatten()
            bits = (flat & 1).astype(str)
            extracted_bits.append("".join(bits))
            
            bit_str = "".join(extracted_bits)
            if DELIMITER in bit_str:
                break

        cap.release()
        full_bit_str = "".join(extracted_bits)
        pos = full_bit_str.find(DELIMITER)

        if pos != -1:
            raw_bits = full_bit_str[:pos]
            chars = [chr(int(raw_bits[i:i+8], 2)) for i in range(0, len(raw_bits), 8)]
            extracted_text = "".join(chars)
        else:
            extracted_text = "No hidden payload found in video."

        return JSONResponse(content={"success": True, "secret_text": extracted_text, "extracted_text": extracted_text})
    finally:
        if os.path.exists(input_path): os.remove(input_path)