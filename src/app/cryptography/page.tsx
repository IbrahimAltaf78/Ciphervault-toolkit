"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { ToolPanel } from "@/components/shared/ToolPanel";
import { PendingModule } from "@/components/shared/PendingModule";
import type { ToolMode } from "@/types";

/**
 * Route skeleton. Ciphers land here in Phase 2, built on `window.crypto.subtle`.
 */
export default function CryptographyPage() {
  const [mode, setMode] = useState<ToolMode>("forward");

  return (
    <ToolPanel
      title="Cryptography"
      description="AES-GCM, RSA and SHA-256 / SHA-3 primitives via the native WebCrypto API."
      paradigm="cryptography"
      icon={KeyRound}
      mode={mode}
      onModeChange={setMode}
      forwardLabel="Encrypt"
      reverseLabel="Decrypt"
      explainer={
        <p>
          Cipher operations run inside the browser through{" "}
          <code>window.crypto.subtle</code>. Keys and passphrases stay in memory
          for the length of one operation and are never sent to the server,
          persisted, or written to logs.
        </p>
      }
    >
      <PendingModule
        phase="Phase 2"
        operation={mode === "forward" ? "Encryption" : "Decryption"}
        capabilities={[
          "AES-GCM with PBKDF2 passphrase derivation",
          "RSA-OAEP keypair generation and exchange",
          "SHA-256 and SHA-3 digest comparison",
        ]}
      />
    </ToolPanel>
  );
}
