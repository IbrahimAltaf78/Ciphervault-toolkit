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
