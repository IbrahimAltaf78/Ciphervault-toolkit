# CipherVault: Development Rules & AI Collaboration Boundaries

## 1. Development Best Practices & Anti-Patterns

| Category             | What to Do (Mandatory)                                                          | What to Avoid (Forbidden)                                                                    |
| :------------------- | :------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------- |
| **State & Memory**   | Keep processing 100% stateless; process payloads in-memory via buffers/streams. | **NO** persistent storage of user files or secret keys on disk or databases.                 |
| **Data Handling**    | Reject non-conforming file types early at the API gateway layer.                | **NO** silent file conversions that destroy LSB payload data (e.g., converting PNG to JPEG). |
| **Component Design** | Build modular, isolated UI components with unified `Hide/Extract` mode toggles. | **NO** monolithic components mixing crypto logic directly into UI render blocks.             |
| **Branch Sync**      | Commit frequently using Conventional Commits (`feat:`, `fix:`, `docs:`).        | **NO** committing broken code directly to shared tracking branches without testing.          |

---

## 2. Technical Stack & Library Guardrails

* **Allowed Frontend Libraries:** Next.js native WebCrypto API (`window.crypto.subtle`), Tailwind CSS, Lucide React icons, Radix UI / Shadcn primitives.
* **Allowed Backend Libraries:** FastAPI, PyCryptodome (server crypto fallbacks), OpenCV (`opencv-python`), Pillow (`PIL`), NumPy.
* **Prohibited Dependencies:** 
  * Avoid heavy external cryptography libraries on the frontend when native WebCrypto covers the algorithm.
  * Avoid unmaintained or black-box steganography packages; all core payload embedding logic (LSB, DCT, Unicode hiding) must be implemented explicitly via clean matrix/string manipulation algorithms.

---

## 3. Error Handling & Security Standards

* **Explicit Error Messages:** Never crash the client UI on failed decodes. API endpoints must return structured JSON errors with explicit HTTP status codes (e.g., `400 Bad Request` for corrupted payloads or incorrect keys).
* **Input Validation:** Enforce strict file size limits (e.g., Max 10MB for media upload, 1MB for text) before handing payloads to processing pipelines.
* **Zero Key Logging:** Never send user-entered passphrases, symmetric keys, or private keys to external telemetry, analytics, or persistent log files.

---

## 4. Boundaries for AI Collaboration & Execution Scope

* **Code Verification:** All AI-generated cryptographic implementations must be validated against standardized test vectors (e.g., NIST vectors for AES/SHA).
* **Scope Discipline:** AI assistants must strictly adhere to the approved project architecture (`ARCHITECTURE.md`) and must not introduce unrequested databases, authentication servers, or external cloud storage services.
* **Educational Safety:** Covert channel simulations (network protocol visualizers) must remain strictly sandboxed inside local mock visualizers; AI assistants must never generate active network exploitation or automated exfiltration scripts.