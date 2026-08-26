# CipherVault: Project Implementation Phases

## 1. Project Implementation Roadmap Overview

| Phase       | Focus Area                          | Key Deliverables                                               | Estimated Milestone |
| :---------- | :---------------------------------- | :------------------------------------------------------------- | :------------------ |
| **Phase 1** | Foundation & Architecture           | Next.js setup, FastAPI setup, UI layout, shared components     | Week 1              |
| **Phase 2** | Client-Side Engines                 | Base64/Hex encoding, WebCrypto API (AES/RSA/SHA), Text hiding  | Week 2 - 3          |
| **Phase 3** | Backend Stego & Watermarking        | Image LSB/DCT stego, Audio/Video engine, Digital watermarking  | Week 4 - 5          |
| **Phase 4** | Covert Channels & Visualizers       | Protocol simulation sandbox, timing/storage covert channels    | Week 6              |
| **Phase 5** | Educational Integration & UI Polish | "How it Works" interactive cards, mode toggles, error handling | Week 7              |
| **Phase 6** | Testing, Docker & Deployment        | Pytest/Jest suites, Dockerization, cloud hosting setup         | Week 8              |

---

## 2. Phase Breakdown & Tasks

### Phase 1: Foundation & Shared Infrastructure
* **Frontend Shell:** Initialize Next.js 14 App Router, configure Tailwind CSS, install Lucide React icons, and assemble the global navbar/footer.
* **Backend Microservice:** Scaffold the FastAPI application structure, configure CORS middleware, upload limiters, and set up Docker environment.
* **Shared UI Components:** Build standard `ToolPanel`, `FileDropzone`, `OutputViewer`, and `OperationToggle` (`Hide/Encrypt` vs. `Extract/Decrypt`) components.

### Phase 2: Client-Side Operations (Local Execution Track)
* **Encoding Module:** Implement instant in-browser encoding (Base64, Base32, Hexadecimal, Binary, URL, ASCII).
* **Cryptography Module:** Build AES-GCM, RSA keygen/encryption, and SHA-256/SHA-3 hashing using the native browser `WebCrypto API`.
* **Text-Based Steganography:** Implement zero-width Unicode hiding, whitespace alteration, and acrostic text generation.

### Phase 3: Backend Media Steganography & Watermarking
* **Image Steganography Engine:** Implement LSB (Least Significant Bit) embedding and DCT (Discrete Cosine Transform) frequency-domain hiding in Python using OpenCV and NumPy.
* **Audio & Video Stego:** Build WAV payload embedding and MP4 frame manipulation endpoints.
* **Digital Watermarking:** Implement visible logo overlay alongside fragile and robust LSB watermarking routines for copyright validation.

### Phase 4: Covert Channel Visualizers
* **Timing Channels:** Build interactive sandbox demonstrating data exfiltration via controlled packet delay variations.
* **Storage & Protocol Channels:** Create visualizers for TCP/IP header field payload embedding (e.g., TTL, IP Identification manipulation).

### Phase 5: Educational Integration & Refinement
* **Explainer Engine:** Attach collapsible "How This Works" cards to every tool page detailing math, matrix ops, and algorithmic steps.
* **Input Sanitization:** Enforce strict file verification (rejecting lossy format conversion to protect LSB payloads) and responsive toast notification warnings.

### Phase 6: Testing & Deployment Pipeline
* **Testing Suites:** Implement Jest tests for client converters and Pytest suites for FastAPI media transformations.
* **Deployment:** Containerize the backend with Docker, deploy client to Vercel, and host the microservice on Render/AWS.