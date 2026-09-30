<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:07080a,100:60A5FA&height=200&section=header&text=CipherVault&fontSize=70&fontColor=e8ecf2&animation=twinkle" width="100%" alt="CipherVault" />

  <p><b>Hide anything. Reveal everything.</b></p>
  <p>A full-stack toolkit for cryptography, steganography, text hiding, encoding and digital watermarking — every tool works in both directions.</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=000" alt="React 19" />
    <img src="https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=fff" alt="Tailwind v4" />
    <img src="https://img.shields.io/badge/FastAPI-Python%203.12-009688?logo=fastapi&logoColor=fff" alt="FastAPI" />
  </p>
</div>

---
## Author
<div>
- Ibrahim Altaf
- Hiba Abbas 
</div>

---

## Contents

- [Author](#author)
- [Contents](#contents)
- [Modules](#modules)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
  - [1 · Frontend — terminal 1](#1--frontend--terminal-1)
  - [2 · Backend — terminal 2](#2--backend--terminal-2)
  - [3 · Check that both are running](#3--check-that-both-are-running)
- [Running it again later](#running-it-again-later)
- [Tests](#tests)
- [Troubleshooting](#troubleshooting)
- [Project structure](#project-structure)
- [Project documents](#project-documents)

---

## Modules

| #   | Module            | What it does                                                                                                                                                  | Route           |
| --- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 01  | **Steganography** | Hide a payload inside an image (LSB, DCT/DWT), WAV audio, or MP4/AVI video — and extract it again                                                             | `/stego`        |
| 02  | **Steganalysis**  | Test a PNG/BMP/TIFF/WebP image or WAV file for a hidden payload (CipherVault signature, RS analysis, sample pairs, weighted stego, chi-square, appended data) | `/steganalysis` |
| 03  | **Cryptography**  | AES, DES, Triple DES, RSA, ECC, SHA-2, SHA-3 and hybrid encryption, run in the browser                                                                        | `/cryptography` |
| 04  | **Text Hiding**   | Hide a message inside ordinary text — zero-width Unicode, whitespace, capitalisation, punctuation, acrostic, word choice                                      | `/text-hiding`  |
| 05  | **Watermarking**  | Visible, invisible, robust (survives compression) and fragile (detects tampering) watermarks                                                                  | `/watermark`    |
| 06  | **Encoding**      | Base64, Base32, hexadecimal, binary, URL and ASCII conversion                                                                                                 | `/encoding`     |

The site opens on a cover page at `/`. **Go to website** leads to the console at `/console`, where all six modules sit on one rack — hover a card to bring it forward, click to open it.

---

## Tech stack

| Layer                                | Technology                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| **Frontend**                         | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, Lucide icons |
| **Backend**                          | FastAPI (Python), served by Uvicorn                                                     |
| **Image / audio / video processing** | Pillow, OpenCV, NumPy, SciPy, PyWavelets                                                |
| **Cryptography**                     | Browser WebCrypto API (frontend), `cryptography` (backend)                              |

---

## Prerequisites

Install these once before anything else:

| Tool        | Version                        | Check with         |
| ----------- | ------------------------------ | ------------------ |
| **Node.js** | 20.9 or newer (tested on 24)   | `node --version`   |
| **Python**  | 3.11 or newer (tested on 3.12) | `python --version` |
| **Git**     | any recent version             | `git --version`    |

> **Windows:** when installing Python from [python.org](https://www.python.org/downloads/), tick **"Add python.exe to PATH"** on the first screen of the installer.

---

## Quick start

CipherVault has two parts that run **at the same time, in two separate terminals**: the **frontend** (the website) and the **backend** (the Python API that processes images, audio and video).

### 1 · Frontend — terminal 1

From the project folder (`Ciphervault-toolkit`):

```bash
npm install
npm run dev
```

| Command       | What it does                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `npm install` | Downloads every package the website needs into `node_modules/`. **Only needed the first time**, or after `package.json` changes. |
| `npm run dev` | Starts the website in development mode.                                                                                          |

Open **http://localhost:3000**.

### 2 · Backend — terminal 2

Open a second terminal in the same project folder.

**Windows (PowerShell):**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

**macOS / Linux:**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

| Command                               | What it does                                                                                                                                                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cd backend`                          | Moves into the backend folder. **Every backend command must run from here** — see [Troubleshooting](#troubleshooting).                                                                                         |
| `python -m venv .venv`                | Creates a **virtual environment** in a folder called `.venv`: a private copy of Python just for this project, so its packages don't clash with anything else on your computer. **Only needed the first time.** |
| `.\.venv\Scripts\Activate.ps1`        | Switches this terminal to use that private Python. Your prompt will start with `(.venv)` when it's active. **Needed every time you open a new terminal.**                                                      |
| `pip install -r requirements.txt`     | Installs every backend package listed in `requirements.txt` into the virtual environment. **Only needed the first time**, or after `requirements.txt` changes.                                                 |
| `python -m uvicorn main:app --reload` | Starts the API. `--reload` restarts it automatically whenever you save a Python file.                                                                                                                          |

The API is now at **http://127.0.0.1:8000**. Interactive API docs (try every endpoint in the browser) are at **http://127.0.0.1:8000/docs**.

> **Keep the backend on port 8000.** The frontend looks for it at `http://127.0.0.1:8000` (set in `src/lib/backend.ts`). Uvicorn uses 8000 by default, so the command above needs no `--port`.
>
> To run the backend somewhere else, create a file called `.env.local` in the project folder containing `NEXT_PUBLIC_API_URL=http://127.0.0.1:9000` (your address), then restart `npm run dev`.

### 3 · Check that both are running

| URL                          | You should see                           |
| ---------------------------- | ---------------------------------------- |
| http://localhost:3000        | The CipherVault cover page               |
| http://127.0.0.1:8000/health | `{"status":"healthy","version":"1.0.0"}` |

---

## Running it again later

After the first setup, starting CipherVault takes two commands per terminal.

**Terminal 1 — frontend:**

```bash
npm run dev
```

**Terminal 2 — backend (Windows):**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload
```

**Terminal 2 — backend (macOS / Linux):**

```bash
cd backend
source .venv/bin/activate
python -m uvicorn main:app --reload
```

Stop either one with **Ctrl + C** in its terminal.

---

## Tests

**Backend** — run from the **project folder** (not from inside `backend`), with the virtual environment active:

```bash
python -m pytest
```

`pytest.ini` points the tests at the `backend` folder, which is why they run from one level up.

The sample files in `backend/tests/samples/` (a clean image and WAV, and the same two with a hidden payload) are also handy for trying the Steganalysis page by hand. To rebuild them, run `python tests/samples/make_samples.py` from inside `backend`.

**Frontend** — lint the code:

```bash
npm run lint
```

---

## Troubleshooting

<details>
<summary><b><code>.\.venv\Scripts\Activate.ps1</code> — "running scripts is disabled on this system"</b></summary>

Windows blocks PowerShell scripts by default. Allow them for your user account (one time):

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Or allow them for the current window only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then run `.\.venv\Scripts\Activate.ps1` again.
</details>

<details>
<summary><b><code>Error loading ASGI app. Could not import module "main"</code></b></summary>

You started Uvicorn from the wrong folder. `main.py` lives inside `backend`, so run `cd backend` first, then `python -m uvicorn main:app --reload`.
</details>

<details>
<summary><b><code>python</code> is not recognised, or opens the Microsoft Store</b></summary>

Python isn't on your PATH. Reinstall it from [python.org](https://www.python.org/downloads/) and tick **"Add python.exe to PATH"**. On Windows you can also use the launcher instead: `py -m venv .venv`.
</details>

<details>
<summary><b>The website loads, but a tool shows an error when you use it</b></summary>

The backend isn't running, or isn't on port 8000. Check terminal 2 is running and that http://127.0.0.1:8000/health answers.
</details>

<details>
<summary><b>"Port 3000 / 8000 is already in use"</b></summary>

An earlier copy is still running. Close its terminal (or press **Ctrl + C** in it) and start again. Keep the backend on 8000, or point the frontend at another port with `NEXT_PUBLIC_API_URL` (see [Quick start](#2--backend--terminal-2)).
</details>

<details>
<summary><b>The page looks old after you pull new changes</b></summary>

Hard-refresh the browser with **Ctrl + Shift + R**. If it still looks old, stop `npm run dev`, delete the `.next` folder, and start it again.
</details>

---

## Project structure

```
Ciphervault-toolkit/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Cover page  (/)
│   │   ├── layout.tsx            # Root layout: fonts, global styles
│   │   ├── globals.css           # Design system: colours, components, animations
│   │   └── (shell)/              # Everything with the navbar and footer
│   │       ├── console/          # Module rack  (/console)
│   │       ├── stego/            # Steganography tools
│   │       ├── steganalysis/     # Steganalysis workbench
│   │       ├── cryptography/     # Cryptography tools
│   │       ├── text-hiding/      # Text-hiding techniques
│   │       ├── watermark/        # Watermarking tools
│   │       └── encoding/         # Encoders / decoders
│   ├── components/               # UI components
│   └── lib/                      # Crypto, encoding and text-hiding logic, API client
├── backend/
│   ├── main.py                   # FastAPI app and endpoints
│   ├── app/                      # Steganography, steganalysis and watermarking modules
│   ├── tests/                    # Backend tests
│   └── requirements.txt          # Python packages
├── package.json                  # Frontend packages and scripts
└── pytest.ini                    # Test configuration
```

`(shell)` is a Next.js route group — the brackets keep it out of the URL, so `(shell)/stego` is served at `/stego`.

---

## Project documents

| Document                             | Contents                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| [`PRD.md`](PRD.md)                   | Product requirements — what CipherVault is for and who uses it                  |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | How the frontend and backend fit together                                       |
| [`DESIGN.md`](DESIGN.md)             | Visual design and colour system                                                 |
| [`RULES.md`](RULES.md)               | Development rules — stateless processing, allowed libraries, security standards |
| [`PHASES.md`](PHASES.md)             | Delivery phases                                                                 |

---

<div align="center">
  <sub>For teaching, CTF practice and security research. Use it only on media you own or are authorised to test.</sub>
</div>
