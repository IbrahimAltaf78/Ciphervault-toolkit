from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from PIL import Image, ImageDraw, ImageFont
import io

router = APIRouter()

@router.post("/embed")
async def embed_visible_watermark(
    file: UploadFile = File(...),
    text: str = Form(...),
    opacity: float = Form(0.6),        # 0.0 to 1.0
    scale: float = Form(0.05),        # Text size relative to image height
    position: str = Form("bottom-right") # "top-left", "top-right", "bottom-left", "bottom-right", "center"
):
    try:
        # Load and convert base image to RGBA for alpha channel operations
        base = Image.open(io.BytesIO(await file.read())).convert("RGBA")
        
        # Create transparent overlay image of matching size
        overlay = Image.new("RGBA", base.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(overlay)

        # Calculate font size relative to image height
        font_size = max(12, int(base.height * scale))
        
        try:
            # Fallback system font loading
            font = ImageFont.truetype("arial.ttf", font_size)
        except IOError:
            font = ImageFont.load_default()

        # Compute text bounding box
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        # Positioning with 20px padding
        padding = 20
        pos_str = position.lower().strip()

        if pos_str == "top-left":
            x, y = padding, padding
        elif pos_str == "top-right":
            x, y = base.width - text_width - padding, padding
        elif pos_str == "bottom-left":
            x, y = padding, base.height - text_height - padding
        elif pos_str == "center":
            x = (base.width - text_width) // 2
            y = (base.height - text_height) // 2
        else:  # Default: bottom-right
            x = base.width - text_width - padding
            y = base.height - text_height - padding

        # Draw text onto overlay with specified alpha/opacity
        alpha_val = int(255 * max(0.0, min(1.0, opacity)))
        draw.text((x, y), text, font=font, fill=(255, 255, 255, alpha_val))

        # Composite overlay with base image
        watermarked = Image.alpha_composite(base, overlay)

        # Output PNG stream
        output_buffer = io.BytesIO()
        watermarked.convert("RGB").save(output_buffer, format="PNG")
        output_buffer.seek(0)

        return StreamingResponse(output_buffer, media_type="image/png")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply visible watermark: {str(e)}")