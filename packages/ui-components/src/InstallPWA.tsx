import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export function InstallPWA({ variant = 'floating', className = '' }: { variant?: 'floating' | 'inline', className?: string }) {
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

  if (variant === 'inline') {
    return (
      <button 
        type="button"
        onClick={handleInstall}
        className={className || "flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 active:scale-95 transition-all w-full font-bold"}
      >
        <Download className="w-5 h-5" /> Install App
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 p-3 bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 rounded-xl items-center animate-in slide-in-from-bottom-5">
      <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Install App</span>
      <button 
        onClick={handleInstall}
        className="bg-emerald-600 text-white p-3 rounded-lg shadow hover:bg-emerald-700 active:scale-95 transition-all"
        title="Install Web App"
      >
        <Download className="w-5 h-5" />
      </button>
    </div>
  );
}
