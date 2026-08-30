import wave
import io
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse

router = APIRouter()
DELIMITER = "#####"

def str_to_bin(data):
    return ''.join(format(ord(i), '08b') for i in data)

@router.post("/hide")
async def hide_audio(file: UploadFile = File(...), text: str = Form(...)):
    if not file.filename.endswith('.wav'):
        raise HTTPException(status_code=400, detail="Only .wav files are supported.")
    
    audio_content = await file.read()
    audio = wave.open(io.BytesIO(audio_content), mode='rb')
    frame_bytes = bytearray(list(audio.readframes(audio.getnframes())))
    
    secret = text + DELIMITER
    secret_bits = str_to_bin(secret)
    
    if len(secret_bits) > len(frame_bytes):
        raise HTTPException(status_code=400, detail="Text is too large for this audio file.")
        
    for i, bit in enumerate(secret_bits):
        frame_bytes[i] = (frame_bytes[i] & 254) | int(bit)
        
    stego_io = io.BytesIO()
    with wave.open(stego_io, 'wb') as stego_audio:
        stego_audio.setparams(audio.getparams())
        stego_audio.writeframes(frame_bytes)
        
    stego_io.seek(0)
    return StreamingResponse(stego_io, media_type="audio/wav", headers={
        "Content-Disposition": f"attachment; filename=stego_{file.filename}"
    })

@router.post("/extract")
async def extract_audio(file: UploadFile = File(...)):
    if not file.filename.endswith('.wav'):
        raise HTTPException(status_code=400, detail="Only .wav files are supported.")
        
    audio_content = await file.read()
    audio = wave.open(io.BytesIO(audio_content), mode='rb')
    frame_bytes = bytearray(list(audio.readframes(audio.getnframes())))
    
    extracted_bits = [str(byte & 1) for byte in frame_bytes]
    
    extracted_chars = []
    for i in range(0, len(extracted_bits), 8):
        byte = "".join(extracted_bits[i:i+8])
        extracted_chars.append(chr(int(byte, 2)))
        
        current_str = "".join(extracted_chars)
        if current_str.endswith(DELIMITER):
            return {"extracted_text": current_str[:-len(DELIMITER)]}
            
    raise HTTPException(status_code=400, detail="No hidden text found.")