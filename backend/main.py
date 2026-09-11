import io
import wave
import base64
import urllib.parse
import os
import hashlib
import numpy as np
import pywt
from PIL import Image, ImageDraw, ImageFont
from scipy.fftpack import dct, idct
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from starlette.concurrency import run_in_threadpool


# Cryptography modules for AES-256-GCM
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

# Modular Stegananalysis Router Inclusion
from app.steganalysis.router import router as steganalysis_router
from app.steganalysis.engine import UnsupportedMedia, analyze_audio, analyze_image

# Video Steganography Router Inclusion (with fallback for folder naming)

from app.steganography.video import router as video_router

# ==========================================
# Database & Auth Imports
# ==========================================
from app.db.database import engine, Base
from app.api import auth

# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CipherVault Toolkit API Engine",
    description="Backend steganography, encoding, and steganalysis suite for images, audio, and video.",
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
app.include_router(auth.router)
app.include_router(steganalysis_router)
app.include_router(video_router)

DELIMITER = "###END###"
# DWT quantisation step. Each bit is the parity of round(LH / ALPHA), so saving
# the image may move a coefficient by up to ALPHA / 2 before the bit flips.
# At 2.0 the ±1 rounding of an RGB round trip was enough to flip bits.
ALPHA = 6.0
LEGACY_DWT_ALPHA = 2.0  # files made before ALPHA was raised
DCT_STRENGTH = 25.0  # DCT coefficient scaling factor for robust watermarking


# ==========================================
# Request Field Helpers
# ==========================================

async def read_fields(request: Request) -> dict:
    """Return a request's text fields, whether they arrived as JSON, a
    URL-encoded form, or multipart form data.

    The text endpoints used to read only one of these - a JSON model, or
    Form() parameters, or request.json() - so a request sent the other way
    reached them as an empty string and came back as an empty 'success'.
    """
    content_type = request.headers.get("content-type", "").lower()
    if "form" in content_type:
        form = await request.form()
        return {key: value for key, value in form.items() if isinstance(value, str)}

    try:
        body = await request.json()
    except Exception:
        body = None
    if isinstance(body, dict):
        return body
    return dict(request.query_params)


def first_field(fields: dict, *names: str) -> str:
    """The first of `names` that holds a non-empty value, as a string."""
    for name in names:
        value = fields.get(name)
        if value is not None and str(value) != "":
            return str(value)
    return ""


def error_response(message: str, status_code: int = 400) -> JSONResponse:
    """A failed request. Carries both `detail` (what FastAPI clients read)
    and `error.message` (what the older tool pages read)."""
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "detail": message, "error": {"message": message}},
    )


def decode_base64_text(raw_input: str) -> str:
    """Strict Base64 -> UTF-8 text. Accepts a data: URL prefix and missing
    padding; rejects anything that is not Base64 instead of returning the
    garbage a lenient decode produces."""
    clean_input = "".join(raw_input.split(",")[-1].split())
    missing_padding = len(clean_input) % 4
    if missing_padding:
        clean_input += "=" * (4 - missing_padding)
    try:
        return base64.b64decode(clean_input, validate=True).decode("utf-8")
    except (ValueError, UnicodeDecodeError):
        raise ValueError("Input is not valid Base64 text.")


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


def payload_from_bits(bits: np.ndarray) -> str | None:
    """The text in a stream of extracted bits, 8 bits per character, up to
    the end marker — or None when the marker never appears.

    None means nothing was hidden with this method. The extractors used to
    return every bit of the carrier as text instead, so a clean image
    "succeeded" with half a megabyte of noise.
    """
    text = np.packbits(np.asarray(bits, dtype=np.uint8)).tobytes().decode("latin-1")
    return text.split(DELIMITER)[0] if DELIMITER in text else None


NO_PAYLOAD_MESSAGE = "No hidden text found. This file wasn't made with this method, or it has changed since."


# ==========================================
# DCT Steganography Helpers (2D DCT)
# ==========================================

def dct2(a):
    return dct(dct(a.T, norm='ortho').T, norm='ortho')


def idct2(a):
    return idct(idct(a.T, norm='ortho').T, norm='ortho')


def embed_dct(image_bytes: bytes, secret_text: str) -> bytes:
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("YCbCr")
    y, cb, cr = pil_img.split()
    y_arr = np.array(y, dtype=np.float32)

    bits = text_to_bits(secret_text)
    total_bits = len(bits)

    h, w = y_arr.shape
    block_size = 8
    bit_idx = 0

    # One bit per 8x8 block. Past that the text used to be cut off silently,
    # end marker and all, so it could never be extracted.
    capacity = (h // block_size) * (w // block_size)
    if total_bits > capacity:
        chars = max(0, capacity // 8 - len(DELIMITER))
        raise ValueError(f"Text is too long for this image: it holds about {chars} characters with this method.")

    for r in range(0, h - h % block_size, block_size):
        for c in range(0, w - w % block_size, block_size):
            if bit_idx >= total_bits:
                break
            block = y_arr[r:r+block_size, c:c+block_size]
            dct_block = dct2(block)

            bit = int(bits[bit_idx])
            v1, v2 = dct_block[4, 3], dct_block[3, 4]

            if bit == 1:
                if v1 <= v2 + DCT_STRENGTH:
                    avg = (v1 + v2) / 2.0
                    dct_block[4, 3] = avg + DCT_STRENGTH / 2.0 + 1.0
                    dct_block[3, 4] = avg - DCT_STRENGTH / 2.0 - 1.0
            else:
                if v2 <= v1 + DCT_STRENGTH:
                    avg = (v1 + v2) / 2.0
                    dct_block[3, 4] = avg + DCT_STRENGTH / 2.0 + 1.0
                    dct_block[4, 3] = avg - DCT_STRENGTH / 2.0 - 1.0

            y_arr[r:r+block_size, c:c+block_size] = idct2(dct_block)
            bit_idx += 1

        if bit_idx >= total_bits:
            break

    y_arr = np.clip(y_arr, 0, 255).astype(np.uint8)
    stego_img = Image.merge("YCbCr", (Image.fromarray(y_arr), cb, cr)).convert("RGB")
    buffered = io.BytesIO()
    stego_img.save(buffered, format="PNG")
    return buffered.getvalue()


def extract_dct(image_bytes: bytes) -> str | None:
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("YCbCr")
    y, _, _ = pil_img.split()
    y_arr = np.array(y, dtype=np.float32)

    h, w = y_arr.shape
    block_size = 8
    bits = []

    for r in range(0, h - h % block_size, block_size):
        for c in range(0, w - w % block_size, block_size):
            block = y_arr[r:r+block_size, c:c+block_size]
            dct_block = dct2(block)
            v1, v2 = dct_block[4, 3], dct_block[3, 4]
            bits.append(1 if v1 > v2 else 0)

    return payload_from_bits(np.array(bits, dtype=np.uint8))


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
    # idwt2 always returns even dimensions; an odd-sized image would no longer
    # fit its own Cb/Cr planes ("size mismatch").
    y_mod = y_mod[:y_arr.shape[0], :y_arr.shape[1]]

    rgb = _unclipped_rgb(y_mod, np.array(cb, dtype=np.float64), np.array(cr, dtype=np.float64))
    stego_img = Image.fromarray(np.clip(np.round(rgb), 0, 255).astype(np.uint8), "RGB")
    buffered = io.BytesIO()
    stego_img.save(buffered, format="PNG")
    return buffered.getvalue()


def _unclipped_rgb(y: np.ndarray, cb: np.ndarray, cr: np.ndarray) -> np.ndarray:
    """RGB for a modified luma plane, with every 2x2 block moved just far
    enough that none of its pixels clip.

    Clipping is what used to lose DWT bits: in black or saturated areas the
    embedding pushed pixels below 0 or above 255, the save cut them off, and
    the payload came back corrupted (30 of 57 test round trips failed). A
    constant added to all four pixels of a Haar block cancels out of LH, HL and
    HH, so the shift moves the block's brightness but leaves the payload alone.
    """
    cb, cr = cb - 128.0, cr - 128.0
    rgb = np.stack((y + 1.402 * cr, y - 0.344136 * cb - 0.714136 * cr, y + 1.772 * cb), axis=2)
    h, w = y.shape
    padded = np.pad(rgb, ((0, h % 2), (0, w % 2), (0, 0)), mode="edge")
    blocks = padded.reshape(padded.shape[0] // 2, 2, padded.shape[1] // 2, 2, 3)
    low, high = blocks.min(axis=(1, 3, 4)), blocks.max(axis=(1, 3, 4))
    shift = np.maximum(0.0, -low) - np.maximum(0.0, high - 255.0)
    shift = np.repeat(np.repeat(shift, 2, axis=0), 2, axis=1)[:h, :w]
    return rgb + shift[:, :, None]


def extract_dwt(image_bytes: bytes) -> str | None:
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("YCbCr")
    y, _, _ = pil_img.split()
    y_arr = np.array(y, dtype=np.float32)

    coeffs = pywt.dwt2(y_arr, 'haar')
    _, (LH, _, _) = coeffs
    flat_lh = LH.flatten()

    # Files made before the step size went up still decode at the old one.
    for alpha in (ALPHA, LEGACY_DWT_ALPHA):
        text = payload_from_bits(np.abs(np.round(flat_lh / alpha)).astype(np.int64) % 2)
        if text is not None:
            return text
    return None


# ==========================================
# Base64 Converter Routes
# ==========================================

@app.post("/api/encoding/base64/encode")
@app.post("/api/encoding/base64")
@app.post("/api/crypto/base64/encode")
@app.post("/api/base64/encode")
async def handle_base64_encode(request: Request):
    fields = await read_fields(request)
    raw_input = first_field(fields, "text", "payload", "data")
    if not raw_input:
        return error_response("Nothing to encode: send the text as 'text', 'payload' or 'data'.")

    encoded = base64.b64encode(raw_input.encode('utf-8')).decode('utf-8')
    return {"success": True, "result": encoded, "data": {"encoded": encoded, "result": encoded}}


@app.post("/api/encoding/base64/decode")
@app.post("/api/crypto/base64/decode")
@app.post("/api/base64/decode")
async def handle_base64_decode(request: Request):
    fields = await read_fields(request)
    raw_input = first_field(fields, "text", "payload", "data")
    if not raw_input:
        return error_response("Nothing to decode: send the Base64 text as 'text', 'payload' or 'data'.")

    try:
        decoded = decode_base64_text(raw_input)
    except ValueError as e:
        return error_response(str(e))
    return {"success": True, "result": decoded, "data": {"decoded": decoded, "result": decoded}}


# ==========================================
# Robust / DCT Watermarking Routes
# ==========================================

@app.post("/api/watermark/robust")
@app.post("/api/watermark/robust/embed")
@app.post("/api/stego/image/dct/hide")
async def hide_dct_image(
    image: UploadFile = File(None),
    file: UploadFile = File(None),
    secretText: str = Form(None),
    text: str = Form(None),
    watermarkText: str = Form(None),
    seed: str = Form(None),
    payload: str = Form(None),
    password: str = Form(None)
):
    try:
        input_image = image or file
        raw_text = secretText or text or watermarkText or seed or payload

        if not input_image or not raw_text:
            return {"success": False, "error": {"message": "Please provide both an image and text payload."}}

        payload_to_embed = raw_text
        if password and password.strip():
            payload_to_embed = f"ENC:{encrypt_payload(raw_text, password.strip())}"

        contents = await input_image.read()
        stego_bytes = embed_dct(contents, payload_to_embed)
        encoded_image = base64.b64encode(stego_bytes).decode('utf-8')

        return {
            "success": True,
            "data": {
                "image": f"data:image/png;base64,{encoded_image}",
                "filename": f"robust_dct_{input_image.filename.split('.')[0]}.png"
            }
        }
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}


@app.post("/api/watermark/robust/extract")
@app.post("/api/stego/image/dct/extract")
async def extract_dct_image(
    image: UploadFile = File(None),
    file: UploadFile = File(None),
    password: str = Form(None)
):
    try:
        input_image = image or file
        if not input_image:
            return {"success": False, "error": {"message": "Please select an image file to extract watermark from."}}

        contents = await input_image.read()
        extracted_raw = extract_dct(contents)
        if extracted_raw is None:
            return {"success": False, "error": {"message": NO_PAYLOAD_MESSAGE}}

        if extracted_raw.startswith("ENC:"):
            if not password or not password.strip():
                return {"success": False, "error": {"message": "Payload is encrypted with AES-256. Password required."}}
            
            encrypted_b64 = extracted_raw[4:]
            decrypted_text = decrypt_payload(encrypted_b64, password.strip())
            return {"success": True, "data": {"secretText": decrypted_text, "watermarkText": decrypted_text, "isEncrypted": True}}

        return {"success": True, "data": {"secretText": extracted_raw, "watermarkText": extracted_raw, "isEncrypted": False}}
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}


# ==========================================
# Steganalysis Engine Route
# ==========================================

@app.post("/api/steganalysis/analyze")
async def analyze_steganalysis_file(
    file: UploadFile = File(...),
    kind: str = Form(None)
):
    contents = await file.read()
    if not contents:
        return error_response("The uploaded file is empty.")

    file_name = file.filename or "uploaded_file"
    file_type = file.content_type or "application/octet-stream"
    is_audio = (
        file_type.startswith("audio/")
        or kind == "audio"
        or file_name.lower().endswith((".wav", ".flac", ".aiff", ".aif"))
    )
    analyze = analyze_audio if is_audio else analyze_image

    try:
        # A few seconds of NumPy on a large file: run it off the event loop.
        report = await run_in_threadpool(analyze, contents, file_name, file_type)
    except UnsupportedMedia as e:
        return error_response(str(e))
    except Exception as e:
        return error_response(f"Analysis failed: {e}", status_code=500)
    return {"success": True, "data": report}


# ==========================================
# Image Steganography / Invisible Watermarking Routes
# ==========================================

@app.post("/api/stego/image/hide")
@app.post("/api/stego/image/lsb/hide")
@app.post("/api/watermark/invisible")
@app.post("/api/watermark/invisible/embed")
async def hide_lsb_image(
    image: UploadFile = File(None),
    file: UploadFile = File(None),
    secretText: str = Form(None),
    text: str = Form(None),
    payload: str = Form(None),
    password: str = Form(None)
):
    try:
        input_image = image or file
        raw_text = secretText or text or payload

        if not input_image or not raw_text:
            return {"success": False, "error": {"message": "Please provide both an image and text payload."}}

        payload_to_embed = raw_text
        if password and password.strip():
            payload_to_embed = f"ENC:{encrypt_payload(raw_text, password.strip())}"

        contents = await input_image.read()
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
        img_array = np.array(pil_img)

        bits = text_to_bits(payload_to_embed)
        total_bits = len(bits)
        flat_array = img_array.flatten()
        
        if total_bits > len(flat_array):
            return {"success": False, "error": {"message": "Text payload is too large for this image capacity."}}

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
                "filename": f"stego_lsb_{input_image.filename.split('.')[0]}.png"
            }
        }
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}


@app.post("/api/stego/image/extract")
@app.post("/api/stego/image/lsb/extract")
@app.post("/api/watermark/invisible/extract")
async def extract_lsb_image(
    image: UploadFile = File(None),
    file: UploadFile = File(None),
    password: str = Form(None)
):
    try:
        input_image = image or file
        if not input_image:
            return {"success": False, "error": {"message": "Please select an image file to extract text from."}}

        contents = await input_image.read()
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
        img_array = np.array(pil_img)

        flat_array = img_array.flatten()
        extracted_raw = payload_from_bits(flat_array & 1)
        if extracted_raw is None:
            return {"success": False, "error": {"message": NO_PAYLOAD_MESSAGE}}

        if extracted_raw.startswith("ENC:"):
            if not password or not password.strip():
                return {"success": False, "error": {"message": "Payload is encrypted with AES-256. Password required."}}
            
            encrypted_b64 = extracted_raw[4:]
            decrypted_text = decrypt_payload(encrypted_b64, password.strip())
            return {"success": True, "data": {"secretText": decrypted_text, "isEncrypted": True}}

        return {"success": True, "data": {"secretText": extracted_raw, "isEncrypted": False}}
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}


# ==========================================
# Fragile Watermarking Routes
# ==========================================

@app.post("/api/watermark/fragile")
@app.post("/api/watermark/fragile/embed")
@app.post("/api/stego/image/fragile/embed")
async def embed_fragile_watermark(
    file: UploadFile = File(None),
    image: UploadFile = File(None),
    blockSize: int = Form(8)
):
    try:
        input_file = file or image
        if not input_file:
            return {"success": False, "error": {"message": "Image file is required for fragile watermarking."}}

        contents = await input_file.read()
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
        img_np = np.array(pil_img)

        h, w, c = img_np.shape
        watermarked = img_np.copy()

        for r in range(0, h - h % blockSize, blockSize):
            for col in range(0, w - w % blockSize, blockSize):
                block = img_np[r:r+blockSize, col:col+blockSize]
                msb_block = block & 0xFE
                block_hash = hashlib.md5(msb_block.tobytes()).digest()
                hash_bits = np.unpackbits(np.frombuffer(block_hash, dtype=np.uint8))

                flat_block = watermarked[r:r+blockSize, col:col+blockSize].flatten()
                num_bits = min(len(hash_bits), len(flat_block))

                for i in range(num_bits):
                    flat_block[i] = (flat_block[i] & 0xFE) | hash_bits[i]

                watermarked[r:r+blockSize, col:col+blockSize] = flat_block.reshape((blockSize, blockSize, c))

        stego_img = Image.fromarray(watermarked.astype('uint8'), 'RGB')
        buffered = io.BytesIO()
        stego_img.save(buffered, format="PNG")
        encoded_image = base64.b64encode(buffered.getvalue()).decode('utf-8')

        return {
            "success": True,
            "data": {
                "image": f"data:image/png;base64,{encoded_image}",
                "filename": f"fragile_watermarked_{input_file.filename.split('.')[0]}.png"
            }
        }
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}


@app.post("/api/watermark/fragile/verify")
@app.post("/api/stego/image/fragile/verify")
async def verify_fragile_watermark(
    file: UploadFile = File(None),
    image: UploadFile = File(None),
    blockSize: int = Form(8)
):
    try:
        input_file = file or image
        if not input_file:
            return {"success": False, "error": {"message": "Image file is required for verification."}}

        contents = await input_file.read()
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
        img_np = np.array(pil_img)

        h, w, c = img_np.shape
        tampered_blocks = 0
        total_blocks = 0

        for r in range(0, h - h % blockSize, blockSize):
            for col in range(0, w - w % blockSize, blockSize):
                total_blocks += 1
                block = img_np[r:r+blockSize, col:col+blockSize]
                msb_block = block & 0xFE
                block_hash = hashlib.md5(msb_block.tobytes()).digest()
                expected_bits = np.unpackbits(np.frombuffer(block_hash, dtype=np.uint8))

                flat_block = block.flatten()
                num_bits = min(len(expected_bits), len(flat_block))
                extracted_bits = flat_block[:num_bits] & 1

                if not np.array_equal(extracted_bits, expected_bits[:num_bits]):
                    tampered_blocks += 1

        is_tampered = tampered_blocks > 0
        tamper_percentage = round((tampered_blocks / max(total_blocks, 1)) * 100, 2)

        return {
            "success": True,
            "data": {
                "isAuthentic": not is_tampered,
                "isTampered": is_tampered,
                "tamperedBlocks": tampered_blocks,
                "totalBlocks": total_blocks,
                "tamperPercentage": tamper_percentage,
                "message": "Image is untampered and authentic." if not is_tampered else f"Tampering detected in {tampered_blocks} blocks ({tamper_percentage}%)."
            }
        }
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}


# ==========================================
# DWT Steganography Routes
# ==========================================

@app.post("/api/stego/image/dwt/hide")
async def hide_dwt_image(
    image: UploadFile = File(None),
    file: UploadFile = File(None),
    secretText: str = Form(None),
    text: str = Form(None),
    payload: str = Form(None),
    password: str = Form(None)
):
    try:
        input_image = image or file
        raw_text = secretText or text or payload

        if not input_image or not raw_text:
            return {"success": False, "error": {"message": "Please provide both an image and text payload."}}

        payload_to_embed = raw_text
        if password and password.strip():
            payload_to_embed = f"ENC:{encrypt_payload(raw_text, password.strip())}"

        contents = await input_image.read()
        stego_bytes = embed_dwt(contents, payload_to_embed)
        encoded_image = base64.b64encode(stego_bytes).decode('utf-8')

        return {
            "success": True,
            "data": {
                "image": f"data:image/png;base64,{encoded_image}",
                "filename": f"stego_dwt_{input_image.filename.split('.')[0]}.png"
            }
        }
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}


@app.post("/api/stego/image/dwt/extract")
async def extract_dwt_image(
    image: UploadFile = File(None),
    file: UploadFile = File(None),
    password: str = Form(None)
):
    try:
        input_image = image or file
        if not input_image:
            return {"success": False, "error": {"message": "Please select an image file to extract text from."}}

        contents = await input_image.read()
        extracted_raw = extract_dwt(contents)
        if extracted_raw is None:
            return {"success": False, "error": {"message": NO_PAYLOAD_MESSAGE}}

        if extracted_raw.startswith("ENC:"):
            if not password or not password.strip():
                return {"success": False, "error": {"message": "Payload is encrypted with AES-256. Password required."}}
            
            encrypted_b64 = extracted_raw[4:]
            decrypted_text = decrypt_payload(encrypted_b64, password.strip())
            return {"success": True, "data": {"secretText": decrypted_text, "isEncrypted": True}}

        return {"success": True, "data": {"secretText": extracted_raw, "isEncrypted": False}}
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}


# ==========================================
# Visible Watermarking Route
# ==========================================

@app.post("/api/watermark/visible")
@app.post("/api/watermark/visible/embed")
@app.post("/api/stego/image/watermark")
async def apply_visible_watermark(
    file: UploadFile = File(None),
    image: UploadFile = File(None),
    text: str = Form(None),
    watermarkText: str = Form(None)
):
    try:
        input_file = file or image
        watermark_val = text or watermarkText

        if not input_file or not watermark_val:
            return {"success": False, "error": {"message": "Image file and watermark text are required."}}

        contents = await input_file.read()
        image_obj = Image.open(io.BytesIO(contents)).convert("RGBA")

        txt_layer = Image.new("RGBA", image_obj.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(txt_layer)
        font = ImageFont.load_default()

        draw.text((20, 20), watermark_val, fill=(255, 255, 255, 128), font=font)
        watermarked = Image.alpha_composite(image_obj, txt_layer)

        buf = io.BytesIO()
        watermarked.convert("RGB").save(buf, format="PNG")
        encoded_image = base64.b64encode(buf.getvalue()).decode('utf-8')

        return {
            "success": True,
            "data": {
                "image": f"data:image/png;base64,{encoded_image}",
                "filename": f"watermarked_{input_file.filename.split('.')[0]}.png"
            }
        }
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}


# ==========================================
# Audio Steganography Routes
# ==========================================

@app.post("/api/stego/audio/wav/hide")
async def hide_wav_audio(
    audio: UploadFile = File(None),
    file: UploadFile = File(None),
    secretText: str = Form(None),
    text: str = Form(None),
    payload: str = Form(None),
    password: str = Form(None)
):
    try:
        input_audio = audio or file
        raw_text = secretText or text or payload

        if not input_audio or not raw_text:
            return {"success": False, "error": {"message": "Audio file and secret text are required."}}

        payload_to_embed = raw_text
        if password and password.strip():
            payload_to_embed = f"ENC:{encrypt_payload(raw_text, password.strip())}"

        contents = await input_audio.read()
        with wave.open(io.BytesIO(contents), mode='rb') as wav_in:
            params = wav_in.getparams()
            frames = bytearray(wav_in.readframes(wav_in.getnframes()))

        bits = text_to_bits(payload_to_embed)
        if len(bits) > len(frames):
            return {"success": False, "error": {"message": "Payload is too large for this audio file capacity."}}

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
                "filename": f"stego_{input_audio.filename}"
            }
        }
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}


@app.post("/api/stego/audio/wav/extract")
async def extract_wav_audio(
    audio: UploadFile = File(None),
    file: UploadFile = File(None),
    password: str = Form(None)
):
    try:
        input_audio = audio or file
        if not input_audio:
            return {"success": False, "error": {"message": "Audio file is required to extract payload."}}

        contents = await input_audio.read()
        with wave.open(io.BytesIO(contents), mode='rb') as wav_in:
            frames = bytearray(wav_in.readframes(wav_in.getnframes()))

        extracted_raw = payload_from_bits(np.frombuffer(bytes(frames), dtype=np.uint8) & 1)
        if extracted_raw is None:
            return {"success": False, "error": {"message": NO_PAYLOAD_MESSAGE}}

        if extracted_raw.startswith("ENC:"):
            if not password or not password.strip():
                return {"success": False, "error": {"message": "Payload is encrypted with AES-256. Password required."}}
            
            encrypted_b64 = extracted_raw[4:]
            decrypted_text = decrypt_payload(encrypted_b64, password.strip())
            return {"success": True, "data": {"secretText": decrypted_text, "isEncrypted": True}}

        return {"success": True, "data": {"secretText": extracted_raw, "isEncrypted": False}}
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}


# ==========================================
# Unified Encoding Process Endpoint Handler
# ==========================================

@app.post("/api/encoding/process")
@app.api_route("/api/encoding/process", methods=["GET", "POST", "OPTIONS"])
async def process_encoding_request(request: Request):
    fields = await read_fields(request)
    raw_input = first_field(fields, "text", "payload", "input", "data")
    action = first_field(fields, "mode", "action", "operation").lower()
    enc_type = (first_field(fields, "encoding_type", "type", "codec") or "base64").lower()

    if not raw_input:
        return error_response("Nothing to convert: the input text is empty.")

    is_decode = "decode" in action

    try:
        if is_decode:
            if enc_type == "base64":
                output = decode_base64_text(raw_input)

            elif enc_type == "base32":
                clean_input = raw_input.strip().upper()
                missing_padding = len(clean_input) % 8
                if missing_padding:
                    clean_input += '=' * (8 - missing_padding)
                output = base64.b32decode(clean_input).decode('utf-8')

            elif enc_type in ("hex", "hexadecimal"):
                clean_input = raw_input.strip().replace("0x", "").replace(" ", "")
                output = bytes.fromhex(clean_input).decode('utf-8')

            elif enc_type == "binary":
                tokens = raw_input.strip().split()
                output = bytes([int(b, 2) for b in tokens if b]).decode('utf-8')

            elif enc_type == "url":
                output = urllib.parse.unquote(raw_input)

            elif enc_type == "ascii":
                tokens = raw_input.strip().replace(",", " ").split()
                # int() and chr() raise on a non-number or an out-of-range code,
                # instead of the old silent skip that turned "abc" into "".
                output = "".join(chr(int(c)) for c in tokens)

            else:
                output = raw_input

        else:
            if enc_type == "base64":
                output = base64.b64encode(raw_input.encode('utf-8')).decode('utf-8')

            elif enc_type == "base32":
                output = base64.b32encode(raw_input.encode('utf-8')).decode('utf-8')

            elif enc_type in ("hex", "hexadecimal"):
                output = raw_input.encode('utf-8').hex()

            elif enc_type == "binary":
                output = " ".join(format(b, "08b") for b in raw_input.encode('utf-8'))

            elif enc_type == "url":
                output = urllib.parse.quote(raw_input)

            elif enc_type == "ascii":
                output = " ".join(str(ord(c)) for c in raw_input)

            else:
                output = raw_input

        return {
            "success": True,
            "result": output,
            "output": output,
            "data": {
                "result": output,
                "output": output,
                "encoded": output,
                "decoded": output,
                "payload": output
            }
        }
    except (ValueError, OverflowError) as e:
        # decode_base64_text already words its own message; the others raise
        # Python's ("non-hexadecimal number found in fromhex()"), which says
        # nothing useful to someone who pasted the wrong text.
        if enc_type == "base64":
            return error_response(str(e))
        names = {"base32": "Base32", "hex": "hex", "hexadecimal": "hex", "binary": "binary", "ascii": "ASCII code"}
        return error_response(f"Input is not valid {names.get(enc_type, enc_type)} text.")
    except Exception as e:
        return error_response(str(e))