import wave
import io
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse

router = APIRouter()

# 16-bit binary delimiter for reliable pattern matching
DELIMITER = '1111111111111110'

def validate_wav_format(file: UploadFile):
    filename = (file.filename or "").lower()
    if not filename.endswith('.wav'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only uncompressed .wav audio files are supported for LSB audio steganography."
        )

@router.post("/hide")
async def hide_audio(
    file: UploadFile = File(...),
    secret_text: str = Form(None),
    text: str = Form(None),
    payload: str = Form(None),
    algorithm: str = Form("lsb")
):
    validate_wav_format(file)
    
    # Accept any field name passed by the frontend
    content_to_hide = secret_text or text or payload
    if not content_to_hide or not content_to_hide.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Secret text payload is required."
        )

    audio_content = await file.read()
    
    try:
        audio = wave.open(io.BytesIO(audio_content), mode='rb')
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupted WAV file format."
        )
        
    frame_bytes = bytearray(list(audio.readframes(audio.getnframes())))
    
    # Convert text to binary bitstring + appended binary delimiter
    binary_secret = ''.join(format(ord(c), '08b') for c in content_to_hide) + DELIMITER
    bit_length = len(binary_secret)
    
    if bit_length > len(frame_bytes):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text payload is too large for this audio file's capacity."
        )
        
    # Bitwise replacement on LSB
    for i, bit in enumerate(binary_secret):
        frame_bytes[i] = (frame_bytes[i] & 254) | int(bit)
        
    stego_io = io.BytesIO()
    with wave.open(stego_io, 'wb') as stego_audio:
        stego_audio.setparams(audio.getparams())
        stego_audio.writeframes(frame_bytes)
        
    stego_io.seek(0)
    return StreamingResponse(
        stego_io, 
        media_type="audio/wav", 
        headers={"Content-Disposition": f"attachment; filename=stego_{file.filename}"}
    )

@router.post("/extract")
async def extract_audio(
    file: UploadFile = File(...),
    algorithm: str = Form("lsb")
):
    validate_wav_format(file)
        
    audio_content = await file.read()
    
    try:
        audio = wave.open(io.BytesIO(audio_content), mode='rb')
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupted WAV file format."
        )
        
    frame_bytes = bytearray(list(audio.readframes(audio.getnframes())))
    
    # Extract LSB bits
    extracted_bits = "".join(str(byte & 1) for byte in frame_bytes)
    
    # Locate delimiter
    delimiter_pos = extracted_bits.find(DELIMITER)
    
    if delimiter_pos != -1:
        raw_bits = extracted_bits[:delimiter_pos]
        bytes_list = [raw_bits[i:i+8] for i in range(0, len(raw_bits), 8)]
        extracted_text = "".join(chr(int(b, 2)) for b in bytes_list if len(b) == 8)
    else:
        extracted_text = "No hidden payload found in this audio file."

    # Return key aliases matching React state updates
    return JSONResponse(
        content={
            "success": True,
            "secret_text": extracted_text,
            "extracted_text": extracted_text,
            "algorithm": algorithm
        }
    )