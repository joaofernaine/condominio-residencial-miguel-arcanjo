import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, MessageCircle, Pencil, Plus, Store, Tag, Trash2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhotoGallery } from "@/components/classificados-shell";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/portal-data";
import {
  atualizarClassificado,
  atualizarStatus,
  CATEGORIAS_SUGERIDAS,
  criarClassificado,
  deletarClassificado,
  fetchClassificadosAprovados,
  fetchMeusClassificados,
  inserirFoto,
  maskWhatsapp,
  STATUS_BADGE_CLASS,
  STATUS_LABEL,
  uploadClassificadoFoto,
  whatsappLink,
  type ClassificadoComFotos,
} from "@/lib/classificados-data";

export function ClassificadosResidentSection({ profile }: { profile: Profile }) {
  const [aprovados, setAprovados] = useState<ClassificadoComFotos[]>([]);
  const [meus, setMeus] = useState<ClassificadoComFotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClassificadoComFotos | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ClassificadoComFotos | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [a, m] = await Promise.all([
        fetchClassificadosAprovados(profile.condominio_id),
        fetchMeusClassificados(profile.id),
      ]);
      setAprovados(a);
      setMeus(m);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar classificados.");
    } finally {
      setLoading(false);
    }
  }, [profile.condominio_id, profile.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const finalizar = async (c: ClassificadoComFotos) => {
    setBusy(true);
    try {
      await atualizarStatus(c.id, "finalizado");
      toast.success("Anúncio finalizado.");
      reload();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao finalizar.");
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
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
              <Store className="h-3.5 w-3.5" /> Marketplace interno
            </span>
            <h2 className="mt-3 text-3xl font-medium md:text-4xl">Classificados dos moradores</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Serviços, vendas, aulas e recomendações da vizinhança.
            </p>
          </div>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" /> Publicar anúncio
          </Button>
        </div>

        {loading ? (
          <div className="mt-10 grid place-items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="mt-10">
              {aprovados.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                  Nenhum classificado publicado ainda.
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {aprovados.map((c) => (
                    <PublicClassificadoCard key={c.id} item={c} />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-14">
              <h3 className="text-xl font-medium">Meus anúncios</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Acompanhe o status da moderação e gerencie seus anúncios.
              </p>
              <div className="mt-6">
                {meus.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                    Você ainda não publicou nenhum anúncio.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {meus.map((c) => (
                      <MyClassificadoCard
                        key={c.id}
                        item={c}
                        busy={busy}
                        onEdit={() => { setEditing(c); setFormOpen(true); }}
                        onFinalizar={() => finalizar(c)}
                        onDelete={() => setConfirmDelete(c)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <ClassificadoFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        profile={profile}
        editing={editing}
        onSaved={reload}
      />

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

function PublicClassificadoCard({ item }: { item: ClassificadoComFotos }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1">
      {item.fotos.length > 0 && (
        <div className="border-b border-border p-3">
          <PhotoGallery fotos={item.fotos} altBase={item.titulo} />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        {item.categoria && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[color:var(--sage)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--sage)]">
            <Tag className="h-3 w-3" /> {item.categoria}
          </span>
        )}
        <h3 className="mt-3 text-base font-semibold leading-snug">{item.titulo}</h3>
        <p className="mt-2 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {item.descricao}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          {item.morador?.nome_completo ?? "Morador"}
          {item.morador?.unidade ? ` · Unidade ${item.morador.unidade}` : ""}
        </p>
        <Button asChild className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700">
          <a
            href={whatsappLink(item.whatsapp, `Olá! Vi seu anúncio "${item.titulo}" no portal do condomínio.`)}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="mr-2 h-4 w-4" /> Chamar no WhatsApp
          </a>
        </Button>
      </div>
    </article>
  );
}

function MyClassificadoCard({
  item, busy, onEdit, onFinalizar, onDelete,
}: {
  item: ClassificadoComFotos;
  busy: boolean;
  onEdit: () => void;
  onFinalizar: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate font-semibold">{item.titulo}</h4>
          {item.categoria && (
            <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Tag className="h-3 w-3" /> {item.categoria}
            </span>
          )}
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_BADGE_CLASS[item.status]}`}>
          {STATUS_LABEL[item.status]}
        </span>
      </div>
      <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
        {item.descricao}
      </p>
      {item.status === "recusado" && item.motivo_recusa && (
        <p className="mt-3 rounded-md bg-destructive/5 px-2.5 py-1.5 text-[11px] text-destructive">
          Motivo da recusa: {item.motivo_recusa}
        </p>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">
        Publicado em {new Date(item.created_at).toLocaleDateString("pt-BR")}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.status !== "finalizado" && (
          <Button size="sm" variant="outline" onClick={onEdit} disabled={busy}>
            <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
          </Button>
        )}
        {item.status === "aprovado" && (
          <Button size="sm" variant="outline" onClick={onFinalizar} disabled={busy}>
            Finalizar
          </Button>
        )}
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete} disabled={busy}>
          <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
        </Button>
      </div>
    </article>
  );
}

// ---------- Form dialog ----------

type FotoNova = { file: File; previewUrl: string };
type FotoExistente = { id: string; foto_url: string; storage_path: string };

function ClassificadoFormDialog({
  open, onOpenChange, profile, editing, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  profile: Profile;
  editing: ClassificadoComFotos | null;
  onSaved: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [fotosNovas, setFotosNovas] = useState<FotoNova[]>([]);
  const [fotosExistentes, setFotosExistentes] = useState<FotoExistente[]>([]);
  const [fotosParaRemover, setFotosParaRemover] = useState<FotoExistente[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitulo(editing.titulo);
      setCategoria(editing.categoria ?? "");
      setDescricao(editing.descricao);
      setWhatsapp(maskWhatsapp(editing.whatsapp));
      setFotosExistentes(editing.fotos.map((f) => ({ id: f.id, foto_url: f.foto_url, storage_path: f.storage_path })));
    } else {
      setTitulo("");
      setCategoria("");
      setDescricao("");
      setWhatsapp("");
      setFotosExistentes([]);
    }
    setFotosNovas([]);
    setFotosParaRemover([]);
  }, [open, editing]);

  const canSubmit = useMemo(
    () => titulo.trim().length > 0 && descricao.trim().length > 0 && whatsapp.replace(/\D/g, "").length >= 10,
    [titulo, descricao, whatsapp],
  );

  const handleAddFiles = (files: FileList | null) => {
    if (!files) return;
    const novas: FotoNova[] = [];
    Array.from(files).forEach((f) => {
      if (!f.type.startsWith("image/")) return;
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`"${f.name}" excede 10MB.`);
        return;
      }
      novas.push({ file: f, previewUrl: URL.createObjectURL(f) });
    });
    setFotosNovas((cur) => [...cur, ...novas]);
  };

  const removerNova = (idx: number) => {
    setFotosNovas((cur) => {
      const c = [...cur];
      URL.revokeObjectURL(c[idx].previewUrl);
      c.splice(idx, 1);
      return c;
    });
  };

  const removerExistente = (foto: FotoExistente) => {
    setFotosExistentes((cur) => cur.filter((f) => f.id !== foto.id));
    setFotosParaRemover((cur) => [...cur, foto]);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const payload = {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categoria: categoria.trim() || null,
        whatsapp: whatsapp.replace(/\D/g, ""),
      };
      let classificadoId: string;
      if (editing) {
        await atualizarClassificado(editing.id, payload);
        classificadoId = editing.id;
        // remover fotos marcadas
        for (const f of fotosParaRemover) {
          await supabase.storage.from("classificados-fotos").remove([f.storage_path]).catch(() => {});
          await supabase.from("classificados_fotos").delete().eq("id", f.id);
        }
      } else {
        const created = await criarClassificado({
          condominio_id: profile.condominio_id,
          morador_id: profile.id,
          ...payload,
        });
        classificadoId = created.id;
      }
      for (const nf of fotosNovas) {
        const up = await uploadClassificadoFoto(classificadoId, nf.file);
        await inserirFoto({
          classificado_id: classificadoId,
          foto_url: up.url,
          storage_path: up.storage_path,
          file_name: up.file_name,
        });
      }
      toast.success(editing ? "Anúncio atualizado — aguardando nova aprovação." : "Anúncio enviado para aprovação!");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar anúncio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar anúncio" : "Publicar novo anúncio"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value.slice(0, 255))} placeholder="Ex: Aulas de violão" />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Input
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ex: Serviço, Venda, Aulas, Pet Care"
              list="cat-sugestoes"
            />
            <datalist id="cat-sugestoes">
              {CATEGORIAS_SUGERIDAS.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição *</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value.slice(0, 2000))}
              rows={5}
              placeholder="Detalhe seu anúncio"
            />
            <p className="text-right text-[11px] text-muted-foreground">{descricao.length}/2000</p>
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp *</Label>
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))}
              placeholder="(11) 99999-8888"
              inputMode="numeric"
            />
          </div>
          <div className="space-y-2">
            <Label>Fotos (opcional)</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground hover:bg-accent">
              <Upload className="h-4 w-4" />
              Adicionar fotos
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => { handleAddFiles(e.target.files); e.currentTarget.value = ""; }}
              />
            </label>
            {(fotosExistentes.length + fotosNovas.length) > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {fotosExistentes.map((f) => (
                  <div key={f.id} className="relative aspect-square overflow-hidden rounded-md border">
                    <img src={f.foto_url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removerExistente(f)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                      aria-label="Remover foto"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {fotosNovas.map((nf, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-md border">
                    <img src={nf.previewUrl} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removerNova(i)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                      aria-label="Remover foto"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? "Salvar alterações" : "Publicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
