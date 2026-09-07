import cv2
import numpy as np
import tempfile
import os
import base64
import asyncio
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

router = APIRouter(prefix="/api/stego/video", tags=["video_steganography"])
DELIMITER = "###END###"

def text_to_bits(text: str) -> str:
    return ''.join(format(ord(char), '08b') for char in text + DELIMITER)

def process_video_hide(input_path: str, output_path: str, payload: str):
    """Runs in a background thread to prevent blocking FastAPI"""
    cap = cv2.VideoCapture(input_path, cv2.CAP_FFMPEG)
    if not cap.isOpened():
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            raise ValueError("Cannot read uploaded video file.")

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Use FFV1, a standard lossless video codec, to preserve the hidden bits
    fourcc = cv2.VideoWriter_fourcc(*'FFV1')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    # Fallback to HuffYUV (another lossless codec) if FFV1 fails
    if not out.isOpened():
        fourcc = cv2.VideoWriter_fourcc(*'HFYU')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    bits_str = text_to_bits(payload)
    bits_array = np.array([int(b) for b in bits_str], dtype=np.uint8)
    total_bits = len(bits_array)
    bit_idx = 0
    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if bit_idx < total_bits:
            flat = frame.reshape(-1)
            available = len(flat)
            to_embed = min(total_bits - bit_idx, available)
            # Embed bits into the Least Significant Bit (LSB)
            flat[:to_embed] = (flat[:to_embed] & 254) | bits_array[bit_idx:bit_idx + to_embed]
            bit_idx += to_embed

        out.write(frame)
        frame_count += 1
        
        # SAFETY CAP: Stop processing after 150 frames (~5 seconds of playback).
        # Prevents massive Base64 JSON payloads that crash the browser memory.
        if frame_count >= 150:
            break

    cap.release()
    out.release()

    with open(output_path, "rb") as f:
        stego_bytes = f.read()

    if len(stego_bytes) == 0:
        raise ValueError("Generated video file is empty.")

    return base64.b64encode(stego_bytes).decode("utf-8")


def process_video_extract(input_path: str):
    """Runs in a background thread to prevent blocking FastAPI"""
    cap = cv2.VideoCapture(input_path, cv2.CAP_FFMPEG)
    if not cap.isOpened():
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            raise ValueError("Cannot read video file for extraction.")

    extracted_chunks = []
    extracted_raw = ""
    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        flat = frame.reshape(-1)
        frame_bits = (flat & 1).astype(np.uint8)
        extracted_chunks.append(frame_bits)

        # Check for our delimiter every 20 frames to avoid memory overload
        if frame_count % 20 == 0:
            all_bits = np.concatenate(extracted_chunks)
            raw_bytes = np.packbits(all_bits).tobytes()
            raw_text = raw_bytes.decode('latin1', errors='ignore')

            if DELIMITER in raw_text:
                extracted_raw = raw_text.split(DELIMITER)[0]
                break
    else:
        # If loop finishes without breaking, check one last time
        if extracted_chunks:
            all_bits = np.concatenate(extracted_chunks)
            raw_bytes = np.packbits(all_bits).tobytes()
            raw_text = raw_bytes.decode('latin1', errors='ignore')
            extracted_raw = raw_text.split(DELIMITER)[0] if DELIMITER in raw_text else raw_text

    cap.release()
    return extracted_raw


@router.post("/hide")
async def hide_video(
    video: UploadFile = File(...),
    secretText: str = Form(...),
    password: str = Form(None)
):
    input_path = None
    output_path = None
    try:
        video_bytes = await video.read()
        if not video_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        input_temp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        input_path = input_temp.name
        input_temp.write(video_bytes)
        input_temp.close()

        output_path = tempfile.mktemp(suffix=".avi")

        payload = secretText
        if password and password.strip():
            try:
                from main import encrypt_payload
                payload = f"ENC:{encrypt_payload(secretText, password.strip())}"
            except Exception:
                pass

        # Offload the heavy CPU blocking task to a background thread
        encoded = await asyncio.to_thread(process_video_hide, input_path, output_path, payload)

        return {
            "success": True,
            "data": {
                "video": f"data:video/x-msvideo;base64,{encoded}",
                "filename": f"stego_{video.filename.split('.')[0]}.avi"
            }
        }
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}
    finally:
        if input_path and os.path.exists(input_path):
            try: os.remove(input_path)
            except: pass
        if output_path and os.path.exists(output_path):
            try: os.remove(output_path)
            except: pass


@router.post("/extract")
async def extract_video(
    video: UploadFile = File(...),
    password: str = Form(None)
):
    input_path = None
    try:
        video_bytes = await video.read()
        if len(video_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        input_temp = tempfile.NamedTemporaryFile(delete=False, suffix=".avi")
        input_path = input_temp.name
        input_temp.write(video_bytes)
        input_temp.close()

        # Offload the heavy CPU blocking task to a background thread
        extracted_raw = await asyncio.to_thread(process_video_extract, input_path)

        if extracted_raw.startswith("ENC:"):
            if not password or not password.strip():
                raise HTTPException(status_code=400, detail="Payload is encrypted with AES-256. Password required.")
            from main import decrypt_payload
            decrypted = decrypt_payload(extracted_raw[4:], password.strip())
            return {"success": True, "data": {"secretText": decrypted, "isEncrypted": True}}

        return {"success": True, "data": {"secretText": extracted_raw, "isEncrypted": False}}
    except HTTPException as he:
        raise he
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}
    finally:
        if input_path and os.path.exists(input_path):
            try: os.remove(input_path)
            except: pass