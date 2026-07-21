import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, MessageSquare, Reply } from "lucide-react";

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
  CHAMADO_CATEGORIA_LABEL,
  CHAMADO_STATUS_CLASS,
  CHAMADO_STATUS_LABEL,
  type ChamadoCategoria,
  type ChamadoRow,
  type ChamadoStatus,
} from "./chamados-resident-section";

type ChamadoComMorador = ChamadoRow & {
  morador: { nome_completo: string; unidade: string } | null;
};

type FiltroStatus = "todos" | ChamadoStatus;
type FiltroCategoria = "todas" | ChamadoCategoria;

function fmtDateTime(v: string) {
  if (!v) return "—";
  const d = new Date(v);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function ChamadosAdminSection({ condominioId }: { condominioId: string }) {
  const [items, setItems] = useState<ChamadoComMorador[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [filtroCat, setFiltroCat] = useState<FiltroCategoria>("todas");
  const [responder, setResponder] = useState<ChamadoComMorador | null>(null);
  const [resposta, setResposta] = useState("");
  const [novoStatus, setNovoStatus] = useState<ChamadoStatus>("em_andamento");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chamados")
        .select("*, morador:profiles(nome_completo, unidade)")
        .eq("condominio_id", condominioId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data ?? []) as unknown as ChamadoComMorador[]);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar chamados.");
    } finally {
      setLoading(false);
    }
  }, [condominioId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtrados = useMemo(
    () =>
      items.filter(
        (c) =>
          (filtroStatus === "todos" || c.status === filtroStatus) &&
          (filtroCat === "todas" || c.categoria === filtroCat),
      ),
    [items, filtroStatus, filtroCat],
  );

  const abertos = items.filter((c) => c.status === "aberto").length;

  const abrirResponder = (c: ChamadoComMorador) => {
    setResponder(c);
    setResposta(c.resposta_sindica ?? "");
    setNovoStatus(c.status === "aberto" ? "em_andamento" : c.status);
  };

  const confirmar = async () => {
    if (!responder) return;
    if (!resposta.trim()) return toast.error("Digite uma resposta.");
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("chamados")
        .update({
          resposta_sindica: resposta.trim(),
          status: novoStatus,
          respondido_em: now,
          updated_at: now,
        })
        .eq("id", responder.id);
      if (error) throw error;
      toast.success("Resposta enviada.");
      setResponder(null);
      setResposta("");
      reload();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao responder.");
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
              <MessageSquare className="h-3.5 w-3.5" /> Canal do morador
            </span>
            <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">Chamados</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {abertos} {abertos === 1 ? "chamado aberto" : "chamados abertos"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as FiltroStatus)}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroCat} onValueChange={(v) => setFiltroCat(v as FiltroCategoria)}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas categorias</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="sugestao">Sugestão</SelectItem>
                <SelectItem value="reclamacao">Reclamação</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
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
              Nenhum chamado encontrado.
            </div>
          ) : (
            <ul className="grid gap-3">
              {filtrados.map((c) => (
                <li key={c.id} className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{c.titulo}</p>
                        <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
                          {CHAMADO_CATEGORIA_LABEL[c.categoria]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs">
                        <span className="font-medium">{c.morador?.nome_completo ?? "—"}</span>
                        {c.morador?.unidade && (
                          <span className="ml-1 rounded-full bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-secondary-foreground">
                            {c.morador.unidade}
                          </span>
                        )}
                        <span className="ml-2 text-muted-foreground">{fmtDateTime(c.created_at)}</span>
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{c.descricao}</p>
                      {c.resposta_sindica && (
                        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                            Resposta enviada:
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{c.resposta_sindica}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${CHAMADO_STATUS_CLASS[c.status]}`}
                      >
                        {CHAMADO_STATUS_LABEL[c.status]}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => abrirResponder(c)}>
                        <Reply className="h-4 w-4" /> Responder
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog open={!!responder} onOpenChange={(v) => !v && setResponder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder chamado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {responder && (
              <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                <p className="font-medium">{responder.titulo}</p>
                <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{responder.descricao}</p>
              </div>
            )}
            <div>
              <Label htmlFor="c-resposta">Resposta</Label>
              <Textarea
                id="c-resposta"
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                rows={5}
              />
            </div>
            <div>
              <Label>Novo status</Label>
              <Select value={novoStatus} onValueChange={(v) => setNovoStatus(v as ChamadoStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponder(null)} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={confirmar} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar resposta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
