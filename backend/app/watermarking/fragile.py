from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from PIL import Image
import numpy as np
import hashlib
import base64
import io

router = APIRouter()

BLOCK_SIZE = 8

def compute_block_hash(block: np.ndarray) -> str:
    # Compute 1-bit MD5 hash for an 8x8 pixel block
    hasher = hashlib.md5(block.tobytes())
    return format(int(hasher.hexdigest()[:2], 16) % 2, "b")

@router.post("/embed")
async def embed_fragile_watermark(file: UploadFile = File(...)):
    try:
        img = Image.open(io.BytesIO(await file.read())).convert("RGB")
        arr = np.array(img, dtype=np.uint8)
        h, w, c = arr.shape

        # Iterate 8x8 blocks and embed validation bit into top-left LSB
        for i in range(0, h - BLOCK_SIZE + 1, BLOCK_SIZE):
            for j in range(0, w - BLOCK_SIZE + 1, BLOCK_SIZE):
                block = arr[i:i+BLOCK_SIZE, j:j+BLOCK_SIZE, 0].copy()
                block[0, 0] = block[0, 0] & 0xFE  # Zero out LSB before hashing
                bit = int(compute_block_hash(block))
                arr[i, j, 0] = (arr[i, j, 0] & 0xFE) | bit

        out_img = Image.fromarray(arr)
        buffer = io.BytesIO()
        out_img.save(buffer, format="PNG")
        buffer.seek(0)
        
        return StreamingResponse(
            buffer, 
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=fragile_watermarked.png"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to embed fragile watermark: {str(e)}")

@router.post("/verify")
async def verify_fragile_watermark(file: UploadFile = File(...)):
    try:
        img = Image.open(io.BytesIO(await file.read())).convert("RGB")
        arr = np.array(img, dtype=np.uint8)
        h, w, _ = arr.shape
        
        total_blocks = 0
        tampered_blocks = 0
        tamper_map = np.zeros((h, w, 3), dtype=np.uint8)

        for i in range(0, h - BLOCK_SIZE + 1, BLOCK_SIZE):
            for j in range(0, w - BLOCK_SIZE + 1, BLOCK_SIZE):
                total_blocks += 1
                block = arr[i:i+BLOCK_SIZE, j:j+BLOCK_SIZE, 0].copy()
                embedded_bit = block[0, 0] & 1
                
                # Zero out LSB to recompute hash accurately
                block[0, 0] = block[0, 0] & 0xFE
                recomputed_bit = int(compute_block_hash(block))

                if embedded_bit != recomputed_bit:
                    tampered_blocks += 1
                    # Mark tampered region in red
                    tamper_map[i:i+BLOCK_SIZE, j:j+BLOCK_SIZE] = [255, 60, 60]

        is_authentic = (tampered_blocks == 0)
        tamper_percentage = round((tampered_blocks / max(1, total_blocks)) * 100, 2)

        buffer = io.BytesIO()
        Image.fromarray(tamper_map).save(buffer, format="PNG")
        b64_map = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return {
            "is_authentic": is_authentic,
            "tamper_percentage": tamper_percentage,
            "message": "Image integrity verified. No tampering detected." if is_authentic else "Image tampering or modification detected!",
            "tamper_map_url": f"data:image/png;base64,{b64_map}" if not is_authentic else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification error: {str(e)}")