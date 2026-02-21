// ============================================================
// PWA Install Banner + Service Worker registration
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {/* SW registration failed silently */});
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
    setDismissed(true);
  };

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 glass rounded-2xl px-5 py-3.5 flex items-center gap-4 shadow-[0_8px_40px_rgba(167,139,250,0.2)] animate-modal-enter max-w-sm w-[calc(100%-2rem)]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#d946ef]">
        <Download className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/80 truncate">
          Install LUMINA
        </p>
        <p className="text-[11px] text-white/35">
          Add to home screen for the full experience
        </p>
      </div>
      <button
        onClick={handleInstall}
        className="shrink-0 rounded-lg bg-[#a78bfa]/20 px-3 py-1.5 text-xs font-semibold text-[#a78bfa] hover:bg-[#a78bfa]/30 transition-colors"
      >
        Install
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-1 text-white/20 hover:text-white/40 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
