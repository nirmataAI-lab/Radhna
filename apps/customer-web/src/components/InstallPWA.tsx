"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert("To install the app, tap the Share icon and select 'Add to Home Screen', or use your browser's install menu.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-[80px] left-4 right-4 z-50 bg-card p-4 rounded-xl shadow-xl border flex items-center justify-between">
      <div className="flex flex-col">
        <span className="font-semibold text-sm">Install Radhna App</span>
        <span className="text-xs text-muted-foreground">For a faster ordering experience!</span>
      </div>
      <button 
        onClick={handleInstall}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
      >
        <Download className="w-4 h-4" /> Install
      </button>
    </div>
  );
}
