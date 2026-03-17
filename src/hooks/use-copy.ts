"use client";

import { useState } from "react";

/**
 * Hook for copy-to-clipboard with 2-second "Copied!" feedback.
 */
export function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (text: string, key?: string) => {
    navigator.clipboard.writeText(text).then(() => {
      const k = key ?? text;
      setCopiedKey(k);
      setTimeout(() => setCopiedKey(null), 2000);
    }).catch(() => {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      const k = key ?? text;
      setCopiedKey(k);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const isCopied = (key: string) => copiedKey === key;

  return { copy, isCopied, copiedKey };
}
