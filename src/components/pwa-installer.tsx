import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

const DISMISS_KEY = "pwa-install-dismissed";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isPreviewHost() {
  if (typeof window === "undefined") return true;
  const h = window.location.hostname;
  return (
    h.startsWith("id-preview--") ||
    h.startsWith("preview--") ||
    h === "lovableproject.com" ||
    h.endsWith(".lovableproject.com") ||
    h.endsWith(".lovableproject-dev.com") ||
    h.endsWith(".beta.lovable.dev") ||
    h === "localhost" ||
    h === "127.0.0.1" ||
    window.self !== window.top
  );
}

export function PwaInstaller() {
  const [prompt, setPrompt] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Register SW only in production, non-preview
    if (
      "serviceWorker" in navigator &&
      !isPreviewHost() &&
      import.meta.env.PROD
    ) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      });
    }

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    if (!isMobile) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  if (!visible || !prompt) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      /* ignore */
    }
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-lg sm:hidden">
      <Download className="h-5 w-5 shrink-0 text-primary" />
      <p className="flex-1 text-sm">Instale o app para acesso rápido</p>
      <Button size="sm" onClick={install}>Instalar</Button>
      <button
        onClick={dismiss}
        aria-label="Dispensar"
        className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
