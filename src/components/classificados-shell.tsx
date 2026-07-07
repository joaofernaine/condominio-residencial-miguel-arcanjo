import { Link } from "@tanstack/react-router";
import { ChevronLeft, Store } from "lucide-react";
import { Toaster } from "sonner";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  right?: ReactNode;
  children: ReactNode;
};

export function ClassificadosShell({ title, subtitle, backTo = "/", backLabel = "Início", right, children }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-center" richColors />
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to={backTo}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {backLabel}
            </Link>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold sm:text-xl">{title}</h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}

export function PhotoGallery({ fotos, altBase }: { fotos: { id: string; foto_url: string }[]; altBase: string }) {
  if (!fotos.length) {
    return (
      <div className="grid h-40 w-full place-items-center rounded-lg border border-dashed bg-muted/30 text-xs text-muted-foreground">
        Sem fotos
      </div>
    );
  }
  return (
    <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
      {fotos.map((f, idx) => (
        <a
          key={f.id}
          href={f.foto_url}
          target="_blank"
          rel="noreferrer"
          className="relative block h-40 w-40 shrink-0 snap-start overflow-hidden rounded-lg border bg-muted sm:h-48 sm:w-48"
        >
          <img
            src={f.foto_url}
            alt={`${altBase} — foto ${idx + 1}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </a>
      ))}
    </div>
  );
}
