from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Zero-Width Character mappings
ZERO_WIDTH_0 = "\u200B" # Zero-width space
ZERO_WIDTH_1 = "\u200C" # Zero-width non-joiner

class HideRequest(BaseModel):
    cover_text: str
    secret_text: str

class RevealRequest(BaseModel):
    stego_text: str

@router.post("/hide")
async def hide_text_in_text(payload: HideRequest):
    try:
        # Convert secret text to binary stream
        binary_secret = "".join(format(ord(c), "08b") for c in payload.secret_text)
        
        # Encode binary into zero-width characters
        zw_encoded = "".join(ZERO_WIDTH_1 if bit == "1" else ZERO_WIDTH_0 for bit in binary_secret)
        
        # Insert zero-width payload in the middle of cover text
        mid_point = len(payload.cover_text) // 2
        stego_text = payload.cover_text[:mid_point] + zw_encoded + payload.cover_text[mid_point:]
        
        return {"stego_text": stego_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text steganography failed: {str(e)}")

@router.post("/reveal")
async def reveal_text_from_text(payload: RevealRequest):
    try:
        # Extract zero-width characters
        bits = []
        for char in payload.stego_text:
            if char == ZERO_WIDTH_1:
                bits.append("1")
            elif char == ZERO_WIDTH_0:
                bits.append("0")

        if not bits:
            return {"secret_text": "", "message": "No hidden zero-width text detected."}

        bit_string = "".join(bits)
        # Parse 8-bit byte chunks
        byte_chunks = [
            int(bit_string[i:i+8], 2)
            for i in range(0, len(bit_string), 8)
            if len(bit_string[i:i+8]) == 8
        ]

        extracted_text = bytes(byte_chunks).decode("utf-8", errors="replace")
        return {"secret_text": extracted_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")