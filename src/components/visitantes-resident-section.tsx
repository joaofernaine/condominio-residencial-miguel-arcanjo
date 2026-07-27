import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Car, Loader2, Plus, Trash2, User, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NovoVisitanteDialog } from "@/components/visitantes-novo-dialog";
import {
  STATUS_CLASS,
  STATUS_LABEL,
  deletarVisitante,
  fetchVisitantesDoMorador,
  fmtDataBr,
  pessoasDoVisitante,
  placasDoVisitante,
  type VisitanteRow,
} from "@/lib/visitantes-data";
import type { Profile } from "@/lib/portal-data";

export function VisitantesResidentSection({ profile }: { profile: Profile }) {
  const [items, setItems] = useState<VisitanteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchVisitantesDoMorador(profile.id));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar visitantes.");
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este pré-cadastro?")) return;
    try {
      await deletarVisitante(id);
      toast.success("Visitante removido.");
      reload();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover.");
    }
  };

  return (
    <section className="border-t border-border bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <UserCheck className="h-3.5 w-3.5" /> Portaria
            </span>
            <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">Meus visitantes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pré-cadastre visitantes para agilizar a entrada na portaria.
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Cadastrar visitante
          </Button>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
              Nenhum visitante cadastrado.
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {items.map((v) => {
                const isAirbnb = v.tipo_visita === "airbnb";
                const pessoas = pessoasDoVisitante(v);
                const placas = placasDoVisitante(v);
                return (
                  <li key={v.id} className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <User className="h-4 w-4 shrink-0 text-primary" />
                          <p className="break-words font-medium">{v.nome_visitante}</p>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              isAirbnb
                                ? "border-purple-200 bg-purple-100 text-purple-800"
                                : "border-border bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {isAirbnb ? "Airbnb" : "Visita"}
                          </span>
                          {pessoas.length > 1 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                              {pessoas.length} pessoas
                            </span>
                          )}
                        </div>
                        <ul className="mt-1.5 space-y-0.5">
                          {pessoas.map((p, i) => (
                            <li key={i} className="break-words text-xs text-muted-foreground">
                              <span className="text-foreground">
                                {i + 1}. {p.nome}
                              </span>
                              {p.cpf ? ` — CPF ${p.cpf}` : " — CPF não informado"}
                            </li>
                          ))}
                        </ul>
                        {placas.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {placas.map((placa, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
                              >
                                <Car className="h-3 w-3" /> {placa}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {fmtDataBr(v.data_entrada)} → {fmtDataBr(v.data_saida)}
                        </p>
                        {v.observacoes && (
                          <p className="mt-2 text-xs text-muted-foreground">{v.observacoes}</p>
                        )}
                        {v.status === "recusado" && v.motivo_recusa && (
                          <p className="mt-2 rounded-md bg-destructive/5 px-2.5 py-1.5 text-[11px] text-destructive">
                            Motivo: {v.motivo_recusa}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_CLASS[v.status]}`}
                        >
                          {STATUS_LABEL[v.status]}
                        </span>
                        {(v.status === "pendente" || v.status === "recusado") && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(v.id)}
                            aria-label="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <NovoVisitanteDialog open={open} onOpenChange={setOpen} profile={profile} onCreated={reload} />
    </section>
  );
}
