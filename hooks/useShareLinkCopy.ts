"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useShareLinkCopy() {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyUrl = useCallback((url: string) => {
    if (typeof window === "undefined") return;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  return { copied, copyUrl };
}
