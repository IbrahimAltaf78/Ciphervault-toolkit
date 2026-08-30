import cv2
import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, Response

# Removed the prefix from here because main.py handles it!
router = APIRouter()
DELIMITER = "#####"

def text_to_bits(text: str) -> str:
    """Convert text to a binary string."""
    return ''.join([format(ord(char), '08b') for char in text])

def bits_to_text(bits: str) -> str:
    """Convert a binary string back to text."""
    chars = [chr(int(bits[i:i+8], 2)) for i in range(0, len(bits), 8)]
    return "".join(chars)

@router.post("/hide")
async def hide_video_route(file: UploadFile = File(...), text: str = Form(...)):
    # 1. Save uploaded file to a temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_in:
        temp_in.write(await file.read())
        input_path = temp_in.name

    output_path = input_path.replace(".mp4", "_stego.avi").replace(".avi", "_stego.avi")
    
    try:
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            raise ValueError("Could not open video file.")

        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # 2. Setup VideoWriter with a Lossless Codec (FFV1) to preserve LSB data
        fourcc = cv2.VideoWriter_fourcc(*'FFV1') 
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        secret_bits = text_to_bits(text + DELIMITER)
        bit_idx = 0
        total_bits = len(secret_bits)

        # 3. Read frames and embed data
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # If we still have bits to hide, embed them in the current frame
            if bit_idx < total_bits:
                for row in range(height):
                    for col in range(width):
                        for channel in range(3): # B, G, R channels
                            if bit_idx < total_bits:
                                # Modify the least significant bit safely using 254
                                frame[row, col, channel] = (frame[row, col, channel] & 254) | int(secret_bits[bit_idx])
                                bit_idx += 1
                                
            out.write(frame)

        cap.release()
        out.release()

        if bit_idx < total_bits:
            raise ValueError("Video is too short to hold this amount of data.")

        # 4. Read the processed file into memory to return it, then clean up
        with open(output_path, "rb") as f:
            stego_bytes = f.read()
            
        return Response(
            content=stego_bytes,
            media_type="video/x-msvideo",
            headers={"Content-Disposition": f'attachment; filename="stego_{file.filename.split(".")[0]}.avi"'}
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        # Cleanup temporary files
        if os.path.exists(input_path): os.remove(input_path)
        if os.path.exists(output_path): os.remove(output_path)


@router.post("/extract")
async def extract_video_route(file: UploadFile = File(...)):
    # 1. Save uploaded file to a temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=".avi") as temp_in:
        temp_in.write(await file.read())
        input_path = temp_in.name

    try:
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            raise ValueError("Could not open video file.")

        extracted_bits = ""
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # 2. Read frames and extract the LSB
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            for row in range(height):
                for col in range(width):
                    for channel in range(3):
                        extracted_bits += str(frame[row, col, channel] & 1)
                        
                        # Periodically check if we've hit the delimiter
                        if len(extracted_bits) % 8 == 0 and len(extracted_bits) >= len(DELIMITER) * 8:
                            current_text = bits_to_text(extracted_bits)
                            if DELIMITER in current_text:
                                cap.release()
                                return {"extracted_text": current_text.split(DELIMITER)[0]}
                                
        cap.release()
        raise ValueError("No hidden data found or delimiter missing.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(input_path): os.remove(input_path)