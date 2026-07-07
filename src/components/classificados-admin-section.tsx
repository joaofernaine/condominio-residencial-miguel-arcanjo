import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ShieldCheck, Tag, Trash2, XCircle } from "lucide-react";

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
import { PhotoGallery } from "@/components/classificados-shell";
import {
  atualizarStatus,
  deletarClassificado,
  fetchClassificadosAdmin,
  STATUS_BADGE_CLASS,
  STATUS_LABEL,
  whatsappLink,
  type ClassificadoComFotos,
  type ClassificadoStatus,
} from "@/lib/classificados-data";

type FiltroStatus = "todos" | ClassificadoStatus;

const FILTROS: { value: FiltroStatus; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendente", label: "Pendente" },
  { value: "aprovado", label: "Aprovado" },
  { value: "recusado", label: "Recusado" },
  { value: "finalizado", label: "Finalizado" },
];

export function ClassificadosAdminSection({ condominioId }: { condominioId: string }) {
  const [items, setItems] = useState<ClassificadoComFotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FiltroStatus>("pendente");
  const [busy, setBusy] = useState(false);
  const [recusar, setRecusar] = useState<ClassificadoComFotos | null>(null);
  const [motivo, setMotivo] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<ClassificadoComFotos | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchClassificadosAdmin(condominioId);
      setItems(rows);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar classificados.");
    } finally {
      setLoading(false);
    }
  }, [condominioId]);

  useEffect(() => { reload(); }, [reload]);

  const filtrados = useMemo(
    () => (filtro === "todos" ? items : items.filter((i) => i.status === filtro)),
    [items, filtro],
  );

  const pendentesCount = useMemo(() => items.filter((i) => i.status === "pendente").length, [items]);

  const aprovar = async (id: string) => {
    setBusy(true);
    try {
      await atualizarStatus(id, "aprovado");
      toast.success("Anúncio aprovado.");
      reload();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao aprovar.");
    } finally {
      setBusy(false);
    }
  };

  const confirmarRecusa = async () => {
    if (!recusar || !motivo.trim()) return;
    setBusy(true);
    try {
      await atualizarStatus(recusar.id, "recusado", motivo.trim());
      toast.success("Anúncio recusado.");
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

  const excluir = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await deletarClassificado(confirmDelete.id);
      toast.success("Anúncio excluído.");
      setConfirmDelete(null);
      reload();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
              <ShieldCheck className="h-3.5 w-3.5" /> Moderação
            </span>
            <h2 className="mt-2 text-2xl font-medium md:text-3xl">Classificados</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {pendentesCount > 0
                ? `${pendentesCount} anúncio(s) aguardando aprovação.`
                : "Nenhum anúncio pendente no momento."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Filtrar</Label>
            <Select value={filtro} onValueChange={(v) => setFiltro(v as FiltroStatus)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTROS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtrados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Nenhum anúncio para este filtro.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filtrados.map((c) => (
                <article key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
                  {c.fotos.length > 0 && (
                    <div className="mb-3">
                      <PhotoGallery fotos={c.fotos} altBase={c.titulo} />
                    </div>
                  )}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold">{c.titulo}</h3>
                      {c.categoria && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Tag className="h-3 w-3" /> {c.categoria}
                        </span>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_BADGE_CLASS[c.status]}`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{c.descricao}</p>
                  <div className="mt-3 rounded-md bg-muted/40 p-2.5 text-xs">
                    <p><span className="font-medium">Morador:</span> {c.morador?.nome_completo ?? "—"} · Unidade {c.morador?.unidade ?? "—"}</p>
                    <p className="mt-1">
                      <span className="font-medium">WhatsApp:</span>{" "}
                      <a href={whatsappLink(c.whatsapp)} target="_blank" rel="noreferrer" className="underline">
                        {c.whatsapp}
                      </a>
                    </p>
                    <p className="mt-1"><span className="font-medium">Publicado:</span> {new Date(c.created_at).toLocaleString("pt-BR")}</p>
                    {c.status === "recusado" && c.motivo_recusa && (
                      <p className="mt-2 rounded bg-destructive/5 px-2 py-1 text-destructive">
                        Motivo: {c.motivo_recusa}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {c.status === "pendente" && (
                      <>
                        <Button size="sm" onClick={() => aprovar(c.id)} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700">
                          <CheckCircle2 className="mr-1 h-4 w-4" /> Aprovar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setRecusar(c)} disabled={busy}>
                          <XCircle className="mr-1 h-4 w-4" /> Recusar
                        </Button>
                      </>
                    )}
                    {c.status === "recusado" && (
                      <Button size="sm" variant="outline" onClick={() => aprovar(c.id)} disabled={busy}>
                        Aprovar mesmo assim
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmDelete(c)}
                      disabled={busy}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Excluir
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!recusar} onOpenChange={(o) => { if (!o) { setRecusar(null); setMotivo(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar anúncio</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Motivo *</Label>
            <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={4} placeholder="Explique ao morador o motivo da recusa" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setRecusar(null); setMotivo(""); }}>Cancelar</Button>
            <Button variant="destructive" disabled={!motivo.trim() || busy} onClick={confirmarRecusa}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Recusar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir anúncio</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir "{confirmDelete?.titulo}"? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" disabled={busy} onClick={excluir}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
