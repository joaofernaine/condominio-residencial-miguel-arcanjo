import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, ChevronDown, ChevronUp } from "lucide-react";

import { supabase } from "@/lib/supabase";

type ContatoRow = {
  id: string;
  condominio_id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  mensagem: string;
  lido: boolean;
  created_at: string;
};

function fmtDateTime(v: string) {
  const d = new Date(v);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function MensagensExternasAdminSection({ condominioId }: { condominioId: string }) {
  const [items, setItems] = useState<ContatoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contatos_publicos")
        .select("*")
        .eq("condominio_id", condominioId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data ?? []) as ContatoRow[]);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar mensagens externas.");
    } finally {
      setLoading(false);
    }
  }, [condominioId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const naoLidos = useMemo(() => items.filter((i) => !i.lido).length, [items]);

  const toggle = async (item: ContatoRow) => {
    const willOpen = expandedId !== item.id;
    setExpandedId(willOpen ? item.id : null);
    if (willOpen && !item.lido) {
      try {
        const { error } = await supabase
          .from("contatos_publicos")
          .update({ lido: true })
          .eq("id", item.id);
        if (error) throw error;
        setItems((prev) => prev.map((c) => (c.id === item.id ? { ...c, lido: true } : c)));
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <section className="border-t border-border bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <Mail className="h-3.5 w-3.5" /> Comunicação externa
          </span>
          <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
            Mensagens externas
            {naoLidos > 0 && (
              <span className="ml-2 rounded-full bg-destructive px-2 py-0.5 align-middle text-xs font-semibold text-destructive-foreground">
                {naoLidos} {naoLidos === 1 ? "não lida" : "não lidas"}
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mensagens enviadas pelo formulário público do site.
          </p>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
              Nenhuma mensagem recebida.
            </div>
          ) : (
            <ul className="grid gap-3">
              {items.map((c) => {
                const open = expandedId === c.id;
                return (
                  <li key={c.id} className="rounded-2xl border border-border bg-card shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggle(c)}
                      className="flex w-full items-start justify-between gap-3 p-4 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{c.nome}</p>
                          {!c.lido && (
                            <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive-foreground">
                              Novo
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[c.email, c.telefone].filter(Boolean).join(" · ") || "sem contato"}
                          <span className="ml-2">{fmtDateTime(c.created_at)}</span>
                        </p>
                        {!open && (
                          <p className="mt-1 line-clamp-1 text-sm text-foreground/70">{c.mensagem}</p>
                        )}
                      </div>
                      {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {open && (
                      <div className="border-t border-border p-4">
                        <p className="whitespace-pre-wrap text-sm text-foreground">{c.mensagem}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
