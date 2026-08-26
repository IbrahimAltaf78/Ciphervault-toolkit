# Product Requirements Document (PRD): CipherVault

## 1. Executive Summary & Vision
CipherVault is a unified, web-based toolkit that integrates six distinct data-hiding and cryptography paradigms into a single responsive application. The platform enables users to perform bidirectional operations—hiding/encrypting/encoding and extracting/decrypting/decoding—across text, media files, network protocol simulations, and mathematical primitives.

---

## 2. Targeted Users
* **Cybersecurity Students & Academics:** Users seeking visual, interactive demonstrations of cryptography, steganography, and covert-channel concepts for educational purposes.
* **CTF Competitors & Analysts:** Developers needing rapid web-based tools to convert formats, inspect payloads, or perform quick data decoding operations.
* **Portfolio Evaluators & Engineers:** Technical reviewers assessing the team's software architecture, stateless design, and adherence to security practices.

---

## 3. Feature Specifications

| Category              | Key Modules                                                                         | Requirements & Capabilities                                                                                |
| :-------------------- | :---------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| **Cryptography**      | Symmetric (AES, DES, 3DES), Asymmetric (RSA, ECC), Hashing (SHA-256, SHA-3), Hybrid | Client-side WebCrypto execution where possible, key generation, strict input validation, zero key logging. |
| **Steganography**     | Image (LSB, DCT/DWT), Audio (WAV), Video (MP4/AVI), Text, Network, File             | Payload embedding into media formats, automatic format verification (rejecting lossy formats for LSB).     |
| **Text-Based Hiding** | Whitespace, Zero-Width Unicode, Capitalization, Acrostic, Punctuation, Word-Choice  | Concealing secret messages within natural text; bidirectional extraction.                                  |
| **Encoding**          | Base64, Base32, Hex, Binary, URL, ASCII                                             | Instant, client-side data transformations (<200ms) with character set validation.                          |
| **Covert Channels**   | Timing, Storage, Protocol-Field Visualizers                                         | Interactive sandboxed visualizers demonstrating data exfiltration without network hazards.                 |
| **Watermarking**      | Visible Text/Logo Overlay, Invisible LSB, Robust, Fragile                           | Media copyright mark embedding and tamper-detection validation.                                            |

---

## 4. Key Architectural Pillars
* **Bidirectional Dynamic Interface:** Every module features a unified tool panel with a toggle switch between forward operations (`Hide/Encrypt/Encode`) and reverse operations (`Extract/Decrypt/Decode`).
* **Stateless & Security-First:** Zero server persistence of sensitive user payloads; operations run in-memory and are discarded immediately.
* **Educational Integration:** Dedicated "How this works" expandable explainer cards embedded on every tool panel.