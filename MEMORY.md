# CipherVault - Project Memory & Context

**Last Updated:** August 28, 2026
**Current Focus:** Backend Python Microservice (Steganography Engine)
**Assignee / Working Branch:** Ibrahim

## Project Overview
CipherVault is a web-based toolkit unifying cryptography, steganography, text-hiding, encoding, covert channels, and digital watermarking. The architecture consists of a Next.js frontend and a Python FastAPI backend microservice for heavy media processing.

## Current System State
* **Backend Framework:** FastAPI running via Uvicorn
* **Environment:** Python Virtual Environment (`venv`) active inside the `/backend` directory.
* **Dependencies Installed:** `fastapi`, `uvicorn`, `pillow`, `numpy`, `python-multipart`.
* **CORS:** Configured in `main.py` to accept requests from `http://localhost:3000`.

## Completed Work (Up to Date)
* **API Entry Point (`main.py`):** Successfully configured with CORS and routing.
* **Health Check:** `GET /health` endpoint is active and tested.
* **Image LSB Steganography (Week 2 Task - COMPLETED):**
  * Built `POST /api/stego/image/lsb/hide`: Fully implemented spatial-domain LSB data hiding using `Pillow` and `NumPy`. Returns base64 image strings.
  * Built `POST /api/stego/image/lsb/extract`: Fully implemented extraction logic using a custom `#####` delimiter.
* **Local Testing Environment:** 
  * Verified endpoints via Swagger UI (`/docs`).
  * Created a local `decode.py` helper script to bypass browser network errors and convert base64 API responses directly back into `.png` files for extraction testing.
* **DCT Stubs:** Added basic route stubs for the upcoming DCT endpoints.
