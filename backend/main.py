import io
import wave
import base64
import os
import math
import numpy as np
import pywt
from PIL import Image
from scipy.stats import chi2
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

# Cryptography modules for AES-256-GCM
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

# Modular Stegananalysis Router Inclusion
from app.steganalysis.router import router as steganalysis_router

# Video Steganography Router Inclusion (with fallback for folder naming)
try:
    from app.steganography.video import router as video_router
except ImportError:
    from app.stegnography.video import router as video_router

# ==========================================
# Database & Auth Imports
# ==========================================
from app.db.database import engine, Base
from app.api import auth

# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CipherVault Toolkit API Engine",
    description="Backend steganography and steganalysis suite for images, audio, and video.",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Health Check Endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# ==========================================
# Router Inclusions
# ==========================================
# Include Authentication router
app.include_router(auth.router)

# Include Steganalysis router
app.include_router(steganalysis_router)

# Include Video Steganography router
app.include_router(video_router)

DELIMITER = "###END###"
ALPHA = 2.0  # DWT coefficient scaling factor for robust embedding


# ==========================================
# AES-256 Encryption & Decryption Helpers
# ==========================================

def derive_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100_000,
    )
    return kdf.derive(password.encode())


def encrypt_payload(plain_text: str, password: str) -> str:
    salt = os.urandom(16)
    nonce = os.urandom(12)
    key = derive_key(password, salt)
    
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plain_text.encode(), None)
    
    encrypted_bytes = salt + nonce + ciphertext
    return base64.b64encode(encrypted_bytes).decode('utf-8')


def decrypt_payload(encrypted_b64: str, password: str) -> str:
    try:
        encrypted_bytes = base64.b64decode(encrypted_b64.encode('utf-8'))
        
        salt = encrypted_bytes[:16]
        nonce = encrypted_bytes[16:28]
        ciphertext = encrypted_bytes[28:]
        
        key = derive_key(password, salt)
        aesgcm = AESGCM(key)
        
        decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
        return decrypted_bytes.decode('utf-8')
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid decryption password or corrupted payload.")


# ==========================================
# Bit Helper Utilities
# ==========================================

def text_to_bits(text: str) -> str:
    return ''.join(format(ord(char), '08b') for char in text + DELIMITER)


def bits_to_text(bits: str) -> str:
    bytes_list = [bits[i:i+8] for i in range(0, len(bits), 8)]
    chars = []
    for b in bytes_list:
        if len(b) < 8:
            break
        chars.append(chr(int(b, 2)))
    full_text = "".join(chars)
    return full_text.split(DELIMITER)[0] if DELIMITER in full_text else full_text


# ==========================================
# DWT Steganography Helpers (Haar Wavelet)
# ==========================================

def embed_dwt(image_bytes: bytes, secret_text: str) -> bytes:
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("YCbCr")
    y, cb, cr = pil_img.split()
    y_arr = np.array(y, dtype=np.float32)

    coeffs = pywt.dwt2(y_arr, 'haar')
    LL, (LH, HL, HH) = coeffs

    bits = text_to_bits(secret_text)
    total_bits = len(bits)
    flat_lh = LH.flatten()

    if total_bits > len(flat_lh):
        raise HTTPException(status_code=400, detail="Text payload is too large for DWT capacity in this image.")

    for i in range(total_bits):
        val = int(round(flat_lh[i] / ALPHA))
        bit = int(bits[i])
        if (val % 2) != bit:
            if val >= 0:
                val += 1 if (val % 2 == 0) else -1
            else:
                val -= 1 if (val % 2 == 0) else -1
        flat_lh[i] = val * ALPHA

    LH_mod = flat_lh.reshape(LH.shape)
    coeffs_mod = LL, (LH_mod, HL, HH)
    y_mod = pywt.idwt2(coeffs_mod, 'haar')
    y_mod = np.clip(y_mod, 0, 255).astype(np.uint8)

    stego_img = Image.merge("YCbCr", (Image.fromarray(y_mod), cb, cr)).convert("RGB")
    buffered = io.BytesIO()
    stego_img.save(buffered, format="PNG")
    return buffered.getvalue()


def extract_dwt(image_bytes: bytes) -> str:
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("YCbCr")
    y, _, _ = pil_img.split()
    y_arr = np.array(y, dtype=np.float32)

    coeffs = pywt.dwt2(y_arr, 'haar')
    _, (LH, _, _) = coeffs

    flat_lh = LH.flatten()
    bits = []

    for val in flat_lh:
        q_val = int(round(val / ALPHA))
        bits.append(str(abs(q_val) % 2))

    return bits_to_text("".join(bits))


# ==========================================
# Image Steganography Routes
# ==========================================

@app.post("/api/stego/image/hide")
@app.post("/api/stego/image/lsb/hide")
async def hide_lsb_image(
    image: UploadFile = File(...),
    secretText: str = Form(...),
    password: str = Form(None)
):
    try:
        payload_to_embed = secretText
        if password and password.strip():
            payload_to_embed = f"ENC:{encrypt_payload(secretText, password.strip())}"

        contents = await image.read()
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
        img_array = np.array(pil_img)

        bits = text_to_bits(payload_to_embed)
        total_bits = len(bits)
        flat_array = img_array.flatten()
        
        if total_bits > len(flat_array):
            raise HTTPException(status_code=400, detail="Text payload is too large for this image capacity.")

        for i in range(total_bits):
            flat_array[i] = (flat_array[i] & 254) | int(bits[i])

        modified_array = flat_array.reshape(img_array.shape)
        stego_img = Image.fromarray(modified_array.astype('uint8'), 'RGB')

        buffered = io.BytesIO()
        stego_img.save(buffered, format="PNG")
        encoded_image = base64.b64encode(buffered.getvalue()).decode('utf-8')

        return {
            "success": True,
            "data": {
                "image": f"data:image/png;base64,{encoded_image}",
                "filename": f"stego_lsb_{image.filename.split('.')[0]}.png"
            }
        }
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}


@app.post("/api/stego/image/extract")
@app.post("/api/stego/image/lsb/extract")
async def extract_lsb_image(
    image: UploadFile = File(...),
    password: str = Form(None)
):
    try:
        contents = await image.read()
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
        img_array = np.array(pil_img)

        flat_array = img_array.flatten()
        bits = "".join([str(flat_array[i] & 1) for i in range(len(flat_array))])
        extracted_raw = bits_to_text(bits)

        if extracted_raw.startswith("ENC:"):
            if not password or not password.strip():
                raise HTTPException(status_code=400, detail="Payload is encrypted with AES-256. Password required.")
            
            encrypted_b64 = extracted_raw[4:]
            decrypted_text = decrypt_payload(encrypted_b64, password.strip())
            return {"success": True, "data": {"secretText": decrypted_text, "isEncrypted": True}}

        return {"success": True, "data": {"secretText": extracted_raw, "isEncrypted": False}}
    except HTTPException as he:
        raise he
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}


@app.post("/api/stego/image/dwt/hide")
async def hide_dwt_image(
    image: UploadFile = File(...),
    secretText: str = Form(...),
    password: str = Form(None)
):
    try:
        payload_to_embed = secretText
        if password and password.strip():
            payload_to_embed = f"ENC:{encrypt_payload(secretText, password.strip())}"

        contents = await image.read()
        stego_bytes = embed_dwt(contents, payload_to_embed)
        encoded_image = base64.b64encode(stego_bytes).decode('utf-8')

        return {
            "success": True,
            "data": {
                "image": f"data:image/png;base64,{encoded_image}",
                "filename": f"stego_dwt_{image.filename.split('.')[0]}.png"
            }
        }
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}


@app.post("/api/stego/image/dwt/extract")
async def extract_dwt_image(
    image: UploadFile = File(...),
    password: str = Form(None)
):
    try:
        contents = await image.read()
        extracted_raw = extract_dwt(contents)

        if extracted_raw.startswith("ENC:"):
            if not password or not password.strip():
                raise HTTPException(status_code=400, detail="Payload is encrypted with AES-256. Password required.")
            
            encrypted_b64 = extracted_raw[4:]
            decrypted_text = decrypt_payload(encrypted_b64, password.strip())
            return {"success": True, "data": {"secretText": decrypted_text, "isEncrypted": True}}

        return {"success": True, "data": {"secretText": extracted_raw, "isEncrypted": False}}
    except HTTPException as he:
        raise he
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}


# ==========================================
# Audio Steganography Routes
# ==========================================

@app.post("/api/stego/audio/wav/hide")
async def hide_wav_audio(
    audio: UploadFile = File(...),
    secretText: str = Form(...),
    password: str = Form(None)
):
    try:
        payload_to_embed = secretText
        if password and password.strip():
            payload_to_embed = f"ENC:{encrypt_payload(secretText, password.strip())}"

        contents = await audio.read()
        with wave.open(io.BytesIO(contents), mode='rb') as wav_in:
            params = wav_in.getparams()
            frames = bytearray(wav_in.readframes(wav_in.getnframes()))

        bits = text_to_bits(payload_to_embed)
        if len(bits) > len(frames):
            raise HTTPException(status_code=400, detail="Payload is too large for this audio file.")

        for i, bit in enumerate(bits):
            frames[i] = (frames[i] & 254) | int(bit)

        out_buffer = io.BytesIO()
        with wave.open(out_buffer, mode='wb') as wav_out:
            wav_out.setparams(params)
            wav_out.writeframes(bytes(frames))

        encoded_audio = base64.b64encode(out_buffer.getvalue()).decode('utf-8')

        return {
            "success": True,
            "data": {
                "audio": f"data:audio/wav;base64,{encoded_audio}",
                "filename": f"stego_{audio.filename}"
            }
        }
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}


@app.post("/api/stego/audio/wav/extract")
async def extract_wav_audio(
    audio: UploadFile = File(...),
    password: str = Form(None)
):
    try:
        contents = await audio.read()
        with wave.open(io.BytesIO(contents), mode='rb') as wav_in:
            frames = bytearray(wav_in.readframes(wav_in.getnframes()))

        bits = "".join(str(frames[i] & 1) for i in range(len(frames)))
        extracted_raw = bits_to_text(bits)

        if extracted_raw.startswith("ENC:"):
            if not password or not password.strip():
                raise HTTPException(status_code=400, detail="Payload is encrypted with AES-256. Password required.")
            
            encrypted_b64 = extracted_raw[4:]
            decrypted_text = decrypt_payload(encrypted_b64, password.strip())
            return {"success": True, "data": {"secretText": decrypted_text, "isEncrypted": True}}

        return {"success": True, "data": {"secretText": extracted_raw, "isEncrypted": False}}
    except HTTPException as he:
        raise he
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}