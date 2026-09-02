from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from fastapi.responses import Response, JSONResponse
import io
import numpy as np
from PIL import Image

router = APIRouter()

# Stop-sequence delimiter (16 bits)
DELIMITER = '1111111111111110'

def validate_image_format(file: UploadFile):
    filename = (file.filename or "").lower()
    if filename.endswith(('.jpg', '.jpeg')) or file.content_type == 'image/jpeg':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="JPEG format rejected: Lossy compression destroys LSB steganographic data. Please upload lossless PNG or BMP files."
        )

@router.post("/hide")
def hide_data(
    file: UploadFile = File(...),
    secret_text: str = Form(None),
    text: str = Form(None),
    payload: str = Form(None),
    algorithm: str = Form("lsb")
):
    validate_image_format(file)
    
    # Accept any field name sent by the frontend
    content_to_hide = secret_text or text or payload
    
    if not content_to_hide or not content_to_hide.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Secret text payload is required. Please enter text into the message box before hiding."
        )

    file.file.seek(0)
    contents = file.file.read()
    
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    img_arr = np.array(image, dtype=np.uint8)

    # Build bit string from payload
    binary_secret = ''.join(format(ord(c), '08b') for c in content_to_hide) + DELIMITER
    bit_length = len(binary_secret)
    
    flat_arr = img_arr.flatten()
    
    if bit_length > len(flat_arr):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Secret text is too long for this cover image capacity."
        )

    # Vectorized LSB insertion
    bits = np.fromiter(binary_secret, dtype=np.uint8) - 48
    flat_arr[:bit_length] = (flat_arr[:bit_length] & 0xFE) | bits

    # Reconstruct stego image
    encoded_img = Image.fromarray(flat_arr.reshape(img_arr.shape))
    
    buffer = io.BytesIO()
    encoded_img.save(buffer, format="PNG")
    
    return Response(
        content=buffer.getvalue(),
        media_type="image/png",
        headers={"Content-Disposition": "attachment; filename=stego.png"}
    )


@router.post("/extract")
def extract_data(
    file: UploadFile = File(...),
    algorithm: str = Form("lsb")
):
    validate_image_format(file)
    
    file.file.seek(0)
    contents = file.file.read()
    
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    img_arr = np.array(image, dtype=np.uint8)

    # Extract LSBs
    flat_arr = img_arr.flatten()
    lsb_bits = (flat_arr & 1).astype(str)
    
    all_bits = "".join(lsb_bits)
    delimiter_pos = all_bits.find(DELIMITER)

    if delimiter_pos != -1:
        raw_bits = all_bits[:delimiter_pos]
        bytes_list = [raw_bits[i:i+8] for i in range(0, len(raw_bits), 8)]
        extracted_text = ''.join(chr(int(b, 2)) for b in bytes_list if len(b) == 8)
    else:
        extracted_text = "No hidden text found in this image."

    return JSONResponse(
        content={
            "success": True,
            "secret_text": extracted_text,
            "extracted_text": extracted_text,
            "algorithm": algorithm
        }
    )