import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Car, CheckCircle2, Loader2, User, UserCheck, XCircle } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STATUS_CLASS,
  STATUS_LABEL,
  atualizarStatusVisitante,
  fetchVisitantesDoCondominio,
  fmtDataBr,
  pessoasDoVisitante,
  placasDoVisitante,
  type VisitanteComMorador,
  type VisitanteStatus,
} from "@/lib/visitantes-data";

type FiltroStatus = "todos" | VisitanteStatus;

const FILTROS: { value: FiltroStatus; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendente", label: "Pendente" },
  { value: "aprovado", label: "Aprovado" },
  { value: "recusado", label: "Recusado" },
];

export function VisitantesAdminSection({ condominioId }: { condominioId: string }) {
  const [items, setItems] = useState<VisitanteComMorador[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FiltroStatus>("pendente");
  const [busy, setBusy] = useState(false);
  const [recusar, setRecusar] = useState<VisitanteComMorador | null>(null);
  const [motivo, setMotivo] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchVisitantesDoCondominio(condominioId));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar visitantes.");
    } finally {
      setLoading(false);
    }
  }, [condominioId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Sem isso, quem já estava com a tela aberta antes de um pedido novo
  // chegar só veria depois de recarregar a página na mão — foi exatamente
  // o que aconteceu com a síndica: um morador cadastrou visitante e não
  // "apareceu" pra ela até alguém dar refresh.
  useEffect(() => {
    const channel = supabase
      .channel(`visitantes-admin-${condominioId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visitantes", filter: `condominio_id=eq.${condominioId}` },
        () => reload(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [condominioId, reload]);

  const filtrados = useMemo(
    () => (filtro === "todos" ? items : items.filter((v) => v.status === filtro)),
    [items, filtro],
  );

  const aprovar = async (id: string) => {
    setBusy(true);
    try {
      await atualizarStatusVisitante(id, "aprovado", null);
      toast.success("Visitante aprovado.");
      reload();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao aprovar.");
    } finally {
      setBusy(false);
    }
  };

  const confirmarRecusa = async () => {
    if (!recusar) return;
    if (!motivo.trim()) return toast.error("Informe o motivo da recusa.");
    setBusy(true);
    try {
      await atualizarStatusVisitante(recusar.id, "recusado", motivo.trim());
      toast.success("Visitante recusado.");
      setRecusar(null);
      setMotivo("");
      reload();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao recusar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border-t border-border bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <UserCheck className="h-3.5 w-3.5" /> Moderação
            </span>
            <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">Visitantes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Aprove ou recuse pré-cadastros de visitantes.
            </p>
          </div>
          <div className="w-full sm:w-56">
            <Select value={filtro} onValueChange={(v) => setFiltro(v as FiltroStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTROS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : filtrados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
              Nenhum visitante encontrado.
            </div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {filtrados.map((v) => {
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
                              v.tipo_visita === "airbnb"
                                ? "border-purple-200 bg-purple-100 text-purple-800"
                                : "border-border bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {v.tipo_visita === "airbnb" ? "Airbnb" : "Visita"}
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
                        <p className="mt-2 text-xs">
                          <span className="font-medium">{v.morador?.nome_completo ?? "—"}</span>
                          {v.morador?.unidade && (
                            <span className="ml-1 rounded-full bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-secondary-foreground">
                              {v.morador.unidade}
                            </span>
                          )}
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
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_CLASS[v.status]}`}
                      >
                        {STATUS_LABEL[v.status]}
                      </span>
                    </div>
                    {v.status === "pendente" && (
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <Button
                          size="sm"
                          onClick={() => aprovar(v.id)}
                          disabled={busy}
                          className="w-full sm:w-auto"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRecusar(v);
                            setMotivo("");
                          }}
                          disabled={busy}
                          className="w-full sm:w-auto"
                        >
                          <XCircle className="h-4 w-4" /> Recusar
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <Dialog open={!!recusar} onOpenChange={(v) => !v && setRecusar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar visitante</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo-recusa">Motivo (obrigatório)</Label>
            <Textarea
              id="motivo-recusa"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder="Explique o motivo da recusa"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecusar(null)} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={confirmarRecusa} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar recusa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
