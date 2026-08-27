import base64

# Paste your raw base64 string here (remove the 'data:image/png;base64,' part)
raw_base64 = "YOUR_BASE64_STRING_HERE" 

# Decode and save the image
with open("stego_output.png", "wb") as fh:
    fh.write(base64.b64decode(raw_base64))
    
print("Image successfully saved as stego_output.png!")
