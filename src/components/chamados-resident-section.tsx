import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, MessageSquare, Plus } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import type { Profile } from "@/lib/portal-data";

export type ChamadoStatus = "aberto" | "em_andamento" | "resolvido";
export type ChamadoCategoria = "manutencao" | "sugestao" | "reclamacao" | "outro";

export type ChamadoRow = {
  id: string;
  condominio_id: string;
  morador_id: string;
  titulo: string;
  descricao: string;
  categoria: ChamadoCategoria;
  status: ChamadoStatus;
  resposta_sindica: string | null;
  respondido_em: string | null;
  created_at: string;
  updated_at: string;
};

export const CHAMADO_STATUS_LABEL: Record<ChamadoStatus, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
};

export const CHAMADO_STATUS_CLASS: Record<ChamadoStatus, string> = {
  aberto: "bg-yellow-100 text-yellow-800 border-yellow-200",
  em_andamento: "bg-blue-100 text-blue-800 border-blue-200",
  resolvido: "bg-green-100 text-green-800 border-green-200",
};

export const CHAMADO_CATEGORIA_LABEL: Record<ChamadoCategoria, string> = {
  manutencao: "Manutenção",
  sugestao: "Sugestão",
  reclamacao: "Reclamação",
  outro: "Outro",
};

function fmtDateTime(v: string) {
  if (!v) return "—";
  const d = new Date(v);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function ChamadosResidentSection({ profile }: { profile: Profile }) {
  const [items, setItems] = useState<ChamadoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chamados")
        .select("*")
        .eq("morador_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data ?? []) as ChamadoRow[]);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar chamados.");
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const fechar = async (id: string) => {
    if (!confirm("Fechar este chamado?")) return;
    try {
      const { error } = await supabase
        .from("chamados")
        .update({ status: "resolvido", updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("morador_id", profile.id);
      if (error) throw error;
      toast.success("Chamado fechado.");
      reload();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao fechar chamado.");
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
            <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">Meus chamados</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Solicite manutenção, envie sugestões ou reclamações à administração.
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Abrir chamado
          </Button>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
              Nenhum chamado registrado.
            </div>
          ) : (
            <ul className="grid gap-3">
              {items.map((c) => (
                <li key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{c.titulo}</p>
                        <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
                          {CHAMADO_CATEGORIA_LABEL[c.categoria]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(c.created_at)}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{c.descricao}</p>
                      {c.resposta_sindica && (
                        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                            Resposta da administração:
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{c.resposta_sindica}</p>
                          {c.respondido_em && (
                            <p className="mt-1 text-[11px] text-muted-foreground">{fmtDateTime(c.respondido_em)}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${CHAMADO_STATUS_CLASS[c.status]}`}
                      >
                        {CHAMADO_STATUS_LABEL[c.status]}
                      </span>
                      {c.status !== "resolvido" && (
                        <Button size="sm" variant="outline" onClick={() => fechar(c.id)}>
                          <CheckCircle2 className="h-4 w-4" /> Fechar chamado
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <NewChamadoDialog open={open} onOpenChange={setOpen} profile={profile} onCreated={reload} />
    </section>
  );
}

function NewChamadoDialog({
  open,
  onOpenChange,
  profile,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: Profile;
  onCreated: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState<ChamadoCategoria>("manutencao");
  const [descricao, setDescricao] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitulo("");
      setCategoria("manutencao");
      setDescricao("");
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return toast.error("Informe o título.");
    if (!descricao.trim()) return toast.error("Informe a descrição.");
    setBusy(true);
    try {
      const { error } = await supabase.from("chamados").insert({
        condominio_id: profile.condominio_id,
        morador_id: profile.id,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categoria,
        status: "aberto",
      });
      if (error) throw error;
      toast.success("Chamado aberto.");
      onCreated();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao abrir chamado.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir chamado</DialogTitle>
          <DialogDescription>
            Chamado enviado pela unidade <span className="font-semibold">{profile.unidade}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="c-titulo">Título *</Label>
            <Input id="c-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={200} required />
          </div>
          <div>
            <Label>Categoria *</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as ChamadoCategoria)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="sugestao">Sugestão</SelectItem>
                <SelectItem value="reclamacao">Reclamação</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="c-desc">Mensagem *</Label>
            <Textarea
              id="c-desc"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={5}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Abrir chamado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
