import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, FileText, Loader2, Mail, Send, ShieldCheck } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState<ChamadoCategoria>("manutencao");
  const [descricao, setDescricao] = useState("");
  const [busy, setBusy] = useState(false);

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return toast.error("Informe o título.");
    if (!descricao.trim()) return toast.error("Informe a mensagem.");
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
      setTitulo("");
      setCategoria("manutencao");
      setDescricao("");
      reload();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao abrir chamado.");
    } finally {
      setBusy(false);
    }
  };

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
    <section className="bg-[#0f172a] py-16 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--gold)]">
              <Mail className="h-3.5 w-3.5" /> Canal do morador
            </span>
            <h2 className="mt-3 font-display text-3xl font-medium sm:text-4xl">Fale com a administração</h2>
            <p className="mt-3 text-white/70">Sua mensagem chega direto à síndica.</p>

            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10">
                  <Clock className="h-4 w-4" />
                </div>
                <p className="pt-2 text-sm text-white/80">Respondemos em até 48 horas úteis</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10">
                  <FileText className="h-4 w-4" />
                </div>
                <p className="pt-2 text-sm text-white/80">Seu chamado fica registrado e pode ser acompanhado aqui</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="pt-2 text-sm text-white/80">Tudo documentado para sua segurança</p>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-8 text-foreground shadow-2xl">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Unidade <span className="font-semibold text-foreground">{profile.unidade}</span>
            </p>
            <div>
              <Label htmlFor="ch-titulo">Título *</Label>
              <Input id="ch-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={200} required />
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
              <Label htmlFor="ch-msg">Mensagem *</Label>
              <Textarea
                id="ch-msg"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value.slice(0, 1000))}
                rows={5}
                required
                maxLength={1000}
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">{descricao.length}/1000</p>
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Enviar chamado</>}
            </Button>
          </form>
        </div>

        <div className="mt-12">
          <h3 className="font-display text-xl font-semibold text-white">Meus chamados</h3>
          <div className="mt-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-sm text-white/70">
                Nenhum chamado registrado.
              </div>
            ) : (
              <ul className="grid gap-3">
                {items.map((c) => (
                  <li key={c.id} className="min-w-0 rounded-2xl bg-white p-4 text-foreground shadow-sm">
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
                            <CheckCircle2 className="h-4 w-4" /> Fechar
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
      </div>
    </section>
  );
}
