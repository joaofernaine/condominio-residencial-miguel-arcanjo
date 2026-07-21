import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Car, CheckCircle2, Loader2, User, UserCheck, Users, XCircle } from "lucide-react";

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
import type { VisitanteRow, VisitanteStatus } from "@/components/visitantes-resident-section";

type FiltroStatus = "todos" | VisitanteStatus;

const FILTROS: { value: FiltroStatus; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendente", label: "Pendente" },
  { value: "aprovado", label: "Aprovado" },
  { value: "recusado", label: "Recusado" },
];

const STATUS_LABEL: Record<VisitanteStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

const STATUS_CLASS: Record<VisitanteStatus, string> = {
  pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  aprovado: "bg-green-100 text-green-800 border-green-200",
  recusado: "bg-red-100 text-red-800 border-red-200",
};

function fmtDate(v: string) {
  if (!v) return "—";
  const [y, m, d] = v.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

type VisitanteComMorador = VisitanteRow & {
  morador: { nome_completo: string; unidade: string } | null;
};

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
      const { data, error } = await supabase
        .from("visitantes")
        .select("*, morador:profiles(nome_completo, unidade)")
        .eq("condominio_id", condominioId)
        .order("data_entrada", { ascending: true });
      if (error) throw error;
      setItems((data ?? []) as unknown as VisitanteComMorador[]);
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

  const filtrados = useMemo(
    () => (filtro === "todos" ? items : items.filter((v) => v.status === filtro)),
    [items, filtro],
  );

  const aprovar = async (id: string) => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("visitantes")
        .update({ status: "aprovado", motivo_recusa: null })
        .eq("id", id);
      if (error) throw error;
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
      const { error } = await supabase
        .from("visitantes")
        .update({ status: "recusado", motivo_recusa: motivo.trim() })
        .eq("id", recusar.id);
      if (error) throw error;
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
              {filtrados.map((v) => (
                <li key={v.id} className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <User className="h-4 w-4 shrink-0 text-primary" />
                        <p className="truncate font-medium">{v.nome_visitante}</p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            v.tipo_visita === "airbnb"
                              ? "border-purple-200 bg-purple-100 text-purple-800"
                              : "border-border bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {v.tipo_visita === "airbnb" ? "Airbnb" : "Visita"}
                        </span>
                        {v.tipo_visita === "airbnb" && (v.acompanhantes ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-800">
                            <Users className="h-3 w-3" /> {v.acompanhantes} acompanhantes
                          </span>
                        )}
                      </div>
                      {v.cpf && (
                        <p className="mt-0.5 text-xs text-muted-foreground">CPF: {v.cpf}</p>
                      )}
                      {v.placa_veiculo && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Car className="h-3 w-3" /> {v.placa_veiculo}
                        </p>
                      )}
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {fmtDate(v.data_entrada)} → {fmtDate(v.data_saida)}
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
              ))}
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
