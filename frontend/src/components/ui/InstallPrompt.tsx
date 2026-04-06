"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "apk-pwa-install-dismissed";
const DISMISSED_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed recently
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISSED_DURATION) return;
      localStorage.removeItem(DISMISSED_KEY);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Small delay so page loads first
      setTimeout(() => setShowBanner(true), 3000);
    };

    const handleAppInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="mx-auto max-w-lg p-4">
        <div className="flex items-center gap-3 rounded-xl border border-cyber-400/20 bg-gray-900/95 px-4 py-3 shadow-lg shadow-cyber-400/5 backdrop-blur-sm">
          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyber-400/10">
            <Download className="h-5 w-5 text-cyber-400" />
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">
              Install APK World
            </p>
            <p className="text-xs text-gray-400">
              Use tools offline &amp; get a native app experience
            </p>
          </div>

          {/* Actions */}
          <button
            onClick={handleInstall}
            className="shrink-0 rounded-lg bg-cyber-400 px-3 py-1.5 text-xs font-bold text-gray-950 transition-colors hover:bg-cyber-300"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-md p-1 text-gray-500 transition-colors hover:text-gray-300"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
