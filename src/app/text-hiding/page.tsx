"use client";

import { useState } from "react";
import { Type } from "lucide-react";
import { ToolPanel } from "@/components/shared/ToolPanel";
import { PendingModule } from "@/components/shared/PendingModule";
import type { ToolMode } from "@/types";

/**
 * Route skeleton. Zero-width, whitespace and acrostic engines land in Phase 2.
 */
export default function TextHidingPage() {
  const [mode, setMode] = useState<ToolMode>("forward");

  return (
    <ToolPanel
      title="Text Hiding"
      description="Conceal messages inside ordinary text using zero-width Unicode, whitespace and acrostics."
      paradigm="text-hiding"
      icon={Type}
      mode={mode}
      onModeChange={setMode}
      forwardLabel="Hide"
      reverseLabel="Extract"
      explainer={
        <p>
          Zero-width characters such as <code>U+200B</code> and{" "}
          <code>U+200C</code> carry bits that render as nothing, so the cover
          text looks untouched while the payload rides along inside it.
          Extraction walks the string and reads those code points back out.
        </p>
      }
    >
      <PendingModule
        phase="Phase 2"
        operation={mode === "forward" ? "Hiding" : "Extraction"}
        capabilities={[
          "Zero-width Unicode bit carriers",
          "Trailing whitespace encoding",
          "Capitalisation and acrostic generation",
        ]}
      />
    </ToolPanel>
  );
}
