# CipherVault: Architecture & File Structure Specification

## 1. High-Level Architecture & App Flow
CipherVault uses a hybrid client-side and microservice architecture designed for stateless, low-latency execution.

+-----------------------------------------------------------------------+
|                         CLIENT (Next.js / React)                       |
|                                                                       |
|  +--------------------+   +---------------------+   +--------------+  |
|  | Cryptography &     |   | Text Hiding &       |   | Mode Toggle  |  |
|  | Encoding Modules   |   | Simple Stego        |   | (Hide/Extract|  |
|  +---------+----------+   +----------+----------+   +-------+------+  |
|            |                         |                      |         |
|            v                         v                      v         |
|     (WebCrypto API)           (In-Browser Processing)  (Unified UI)    |
+------------+-------------------------+----------------------+---------+
|                                                |
| Lightweight Payload                             | Heavy Payload
v                                                v
+-----------------------------+               +-------------------------+
| Client-Side Local Execution |               | Python FastAPI Backend  |
| (Instant response < 100ms)  |               | (Media Stego Engine)    |
+-----------------------------+               +------------+------------+
|
+------------+------------+
| OpenCV / Pillow / NumPy |
| Digital Watermarking    |
+-------------------------+

### Application Data Flow
1. **User Interaction:** The user selects a paradigm tool (e.g., LSB Steganography) and toggles between **Forward Operation** (Hide/Encrypt) and **Reverse Operation** (Extract/Decrypt).
2. **Execution Routing:**
   * **Local Track:** Client-side encoding (Base64, Hex) and symmetric/asymmetric WebCrypto operations execute entirely inside the user's browser.
   * **Remote Microservice Track:** Complex media manipulations (image LSB, DCT steganography, audio/video processing, digital watermarking) send binary/form payloads to the Python FastAPI microservice.
3. **Stateless Processing:** Input files are stored temporarily in RAM during processing and returned directly in the response stream. No database or disk storage is utilized.

---

## 2. Tech Stack Matrix

| Layer                    | Primary Technology        | Key Libraries / Utilities                       | Purpose                                                                         |
| :----------------------- | :------------------------ | :---------------------------------------------- | :------------------------------------------------------------------------------ |
| **Frontend Framework**   | Next.js 14+ (App Router)  | React, TypeScript                               | Component management, routing, SSR/SSG layout rendering.                        |
| **Styling & UI**         | Tailwind CSS              | Lucide React, Radix UI / Shadcn UI              | Responsive utility styling, dark mode, accessible control panels.               |
| **Client Cryptography**  | Native WebCrypto API      | `crypto.subtle`, JS-Base64                      | High-performance, secure client-side hashing and cipher ops.                    |
| **Backend Runtime**      | Python 3.11+              | FastAPI, Uvicorn                                | High-throughput asynchronous REST API for complex media algorithms.             |
| **Media Manipulation**   | Python Data Science Stack | OpenCV (`opencv-python`), Pillow (`PIL`), NumPy | Pixel matrix manipulation, frequency domain transformations, signal processing. |
| **Backend Cryptography** | PyCryptodome              | `Crypto.Cipher`                                 | Backup server-side cryptographic primitives and key generation.                 |

---

## 3. Directory & File Structure

```text
ciphervault-toolkit/
├── .github/                      # CI/CD workflows and PR templates
│   └── workflows/                # Automated testing and linting pipelines
├── backend/                      # Python FastAPI Microservice
│   ├── app/
│   │   ├── api/                  # API Route controllers
│   │   │   ├── stego_routes.py   # Image, Audio, Video, Text stego endpoints
│   │   │   ├── watermark_routes.py # Digital watermarking endpoints
│   │   │   └── covert_routes.py  # Network protocol simulation endpoints
│   │   ├── core/                 # App configuration & middleware
│   │   │   ├── config.py         # CORS settings, upload limits
│   │   │   └── security.py       # Input validation & sanitization
│   │   ├── services/             # Core algorithmic engines
│   │   │   ├── stego_engine.py   # LSB, DCT, DWT matrix operations
│   │   │   ├── watermark_engine.py # Visible & fragile watermarking
│   │   │   └── covert_engine.py  # Protocol-field covert channel handlers
│   │   └── main.py               # FastAPI entry point & route registration
│   ├── tests/                    # Backend unit tests (Pytest)
│   ├── Dockerfile                # Backend container configuration
│   └── requirements.txt          # Python dependencies
├── src/                          # Next.js Frontend App
│   ├── app/                      # App router pages & layouts
│   │   ├── cryptography/         # AES, RSA, ECC, Hashing tool pages
│   │   ├── steganography/        # Image, Audio, Video, Text stego pages
│   │   ├── encoding/             # Base64, Hex, URL, Binary pages
│   │   ├── text-hiding/          # Unicode, Whitespace, Acrostic pages
│   │   ├── covert-channels/      # Protocol simulation visualizers
│   │   ├── watermarking/         # Media copyright protection pages
│   │   ├── globals.css           # Global Tailwind directives
│   │   ├── layout.tsx            # Global Navbar, Footer, and Provider wrap
│   │   └── page.tsx              # Application Landing Page / Dashboard
│   ├── components/               # Reusable UI Components
│   │   ├── ui/                   # Buttons, Inputs, Cards, Toggles (Shadcn)
│   │   ├── layout/               # Header, Sidebar, Educational Drawer
│   │   └── shared/               # ToolPanel container, File Dropzone
│   ├── lib/                      # Frontend helper functions & modules
│   │   ├── crypto/               # WebCrypto API wrappers
│   │   ├── encoding/             # Local text/hex/base64 converters
│   │   └── api-client.ts         # Axios/Fetch wrapper for FastAPI requests
│   └── types/                    # TypeScript interfaces & type definitions
├── .gitignore                    # Git ignore specifications
├── ARCHITECTURE.md               # App Architecture & Structure Docs
├── PRD.md                        # Product Requirements Document
└── README.md                     # Main Repository Overview