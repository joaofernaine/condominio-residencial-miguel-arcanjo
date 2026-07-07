import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { usePortalAuth } from "@/hooks/use-portal-auth";
import { ClassificadosShell, PhotoGallery } from "@/components/classificados-shell";
import {
  CATEGORIAS_SUGERIDAS,
  atualizarClassificado,
  atualizarStatus,
  deletarClassificado,
  fetchMeusClassificados,
  inserirFoto,
  maskWhatsapp,
  removerFoto,
  uploadClassificadoFoto,
  whatsappToNumber,
  STATUS_BADGE_CLASS,
  STATUS_LABEL,
  type ClassificadoComFotos,
  type ClassificadoStatus,
} from "@/lib/classificados-data";

export const Route = createFileRoute("/classificados/meus")({
  head: () => ({
    meta: [{ title: "Meus anúncios — Marketplace" }],
  }),
  component: MeusClassificadosPage,
});

function MeusClassificadosPage() {
  const { profile, loading: authLoading } = usePortalAuth();
  const [items, setItems] = useState<ClassificadoComFotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | ClassificadoStatus>("todos");
  const [editando, setEditando] = useState<ClassificadoComFotos | null>(null);
  const [confirm, setConfirm] = useState<
    | { kind: "delete" | "finalizar" | "remover"; item: ClassificadoComFotos }
    | null
  >(null);

  const reload = () => {
    if (!profile) return;
    setLoading(true);
    fetchMeusClassificados(profile.id)
      .then(setItems)
      .catch((e) => {
        console.error(e);
        toast.error("Erro ao carregar seus anúncios.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!profile) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const filtrados = useMemo(
    () => (filtro === "todos" ? items : items.filter((i) => i.status === filtro)),
    [items, filtro],
  );

  const executarConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.kind === "finalizar") {
        await atualizarStatus(confirm.item.id, "finalizado");
        toast.success("Anúncio finalizado.");
      } else {
        await deletarClassificado(confirm.item.id);
        toast.success("Anúncio removido.");
      }
      setConfirm(null);
      reload();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao executar ação.");
    }
  };

  if (authLoading) {
    return (
      <ClassificadosShell title="Meus anúncios">
        <div className="grid place-items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </ClassificadosShell>
    );
  }
  if (!profile) {
    return (
      <ClassificadosShell title="Meus anúncios">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">Faça login para ver seus anúncios.</p>
            <Button asChild className="mt-4">
              <Link to="/">Ir para o portal</Link>
            </Button>
          </CardContent>
        </Card>
      </ClassificadosShell>
    );
  }

  return (
    <ClassificadosShell
      title="Meus anúncios"
      subtitle="Gerencie seus classificados"
      right={
        <>
          <Button asChild variant="outline" size="sm">
            <Link to="/classificados">Ver marketplace</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/classificados/novo">
              <Plus className="mr-1 h-4 w-4" /> Novo
            </Link>
          </Button>
        </>
      }
    >
      <div className="mb-4 flex items-center gap-2">
        <Select value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="recusado">Recusado</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid place-items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtrados.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum anúncio {filtro !== "todos" ? "com esse status" : "ainda"}.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtrados.map((c) => (
            <MyCard
              key={c.id}
              item={c}
              onEditar={() => setEditando(c)}
              onFinalizar={() => setConfirm({ kind: "finalizar", item: c })}
              onDeletar={() => setConfirm({ kind: "delete", item: c })}
              onRemover={() => setConfirm({ kind: "remover", item: c })}
            />
          ))}
        </div>
      )}

      {editando && (
        <EditDialog
          item={editando}
          onClose={() => setEditando(null)}
          onSaved={() => {
            setEditando(null);
            reload();
          }}
        />
      )}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "finalizar" ? "Marcar como finalizado?" : "Remover anúncio?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "finalizar"
                ? "O anúncio deixará de aparecer no marketplace."
                : "Essa ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executarConfirm}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ClassificadosShell>
  );
}

function MyCard({
  item,
  onEditar,
  onFinalizar,
  onDeletar,
  onRemover,
}: {
  item: ClassificadoComFotos;
  onEditar: () => void;
  onFinalizar: () => void;
  onDeletar: () => void;
  onRemover: () => void;
}) {
  const shortDesc = item.descricao.length > 100 ? item.descricao.slice(0, 100) + "…" : item.descricao;
  const dataFormatada = new Date(item.created_at).toLocaleDateString("pt-BR");
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 p-4">
        <PhotoGallery fotos={item.fotos} altBase={item.titulo} />
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{item.titulo}</h3>
            {item.categoria && (
              <p className="text-xs text-muted-foreground">{item.categoria}</p>
            )}
          </div>
          {item.status === "recusado" && item.motivo_recusa ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className={STATUS_BADGE_CLASS[item.status]}>
                    {STATUS_LABEL[item.status]}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">Motivo: {item.motivo_recusa}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Badge variant="outline" className={STATUS_BADGE_CLASS[item.status]}>
              {STATUS_LABEL[item.status]}
            </Badge>
          )}
        </div>

        {item.status === "recusado" && item.motivo_recusa && (
          <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-900 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Anúncio recusado</p>
              <p>{item.motivo_recusa}</p>
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground">{shortDesc}</p>
        <p className="text-xs text-muted-foreground">Criado em {dataFormatada}</p>

        <div className="flex flex-wrap gap-2">
          {(item.status === "pendente" || item.status === "aprovado") && (
            <Button variant="outline" size="sm" onClick={onEditar}>
              <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
            </Button>
          )}
          {item.status === "aprovado" && (
            <Button variant="outline" size="sm" onClick={onFinalizar}>
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Finalizado
            </Button>
          )}
          {item.status === "pendente" && (
            <Button variant="outline" size="sm" onClick={onDeletar}>
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Deletar
            </Button>
          )}
          {item.status === "recusado" && (
            <Button variant="outline" size="sm" onClick={onRemover}>
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Remover
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const TITULO_MAX = 255;
const DESC_MAX = 2000;
const MAX_FOTOS = 5;
const MAX_BYTES = 10 * 1024 * 1024;

function EditDialog({
  item,
  onClose,
  onSaved,
}: {
  item: ClassificadoComFotos;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [titulo, setTitulo] = useState(item.titulo);
  const [descricao, setDescricao] = useState(item.descricao);
  const [categoria, setCategoria] = useState(item.categoria ?? "");
  const [whatsapp, setWhatsapp] = useState(item.whatsapp);
  const [fotosExistentes, setFotosExistentes] = useState(item.fotos);
  const [novasFotos, setNovasFotos] = useState<{ key: string; file: File; previewUrl: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const totalFotos = fotosExistentes.length + novasFotos.length;

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_FOTOS - totalFotos;
    if (remaining <= 0) {
      toast.error(`Máximo ${MAX_FOTOS} fotos.`);
      return;
    }
    const toAdd: typeof novasFotos = [];
    for (const f of Array.from(files).slice(0, remaining)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > MAX_BYTES) {
        toast.error(`"${f.name}" excede 10MB.`);
        continue;
      }
      toAdd.push({
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        previewUrl: URL.createObjectURL(f),
      });
    }
    setNovasFotos((p) => [...p, ...toAdd]);
  };

  const removerExistente = async (id: string, path: string) => {
    try {
      await removerFoto(id, path);
      setFotosExistentes((p) => p.filter((f) => f.id !== id));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover foto.");
    }
  };

  const canSubmit =
    titulo.trim() &&
    descricao.trim() &&
    whatsappToNumber(whatsapp).length >= 10 &&
    !saving;

  const handleSave = async () => {
    setSaving(true);
    try {
      await atualizarClassificado(item.id, {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categoria: categoria.trim() || null,
        whatsapp: whatsapp.trim(),
      });
      for (const f of novasFotos) {
        try {
          const up = await uploadClassificadoFoto(item.id, f.file);
          await inserirFoto({
            classificado_id: item.id,
            foto_url: up.url,
            storage_path: up.storage_path,
            file_name: up.file_name,
          });
        } catch (err) {
          console.error(err);
        }
      }
      toast.success("Anúncio atualizado. Aguardando nova aprovação.");
      novasFotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      onSaved();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar anúncio</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Título *</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value.slice(0, TITULO_MAX))} maxLength={TITULO_MAX} />
            <p className="text-right text-xs text-muted-foreground">{titulo.length}/{TITULO_MAX}</p>
          </div>
          <div className="space-y-1">
            <Label>Descrição *</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value.slice(0, DESC_MAX))} rows={4} maxLength={DESC_MAX} />
            <p className="text-right text-xs text-muted-foreground">{descricao.length}/{DESC_MAX}</p>
          </div>
          <div className="space-y-1">
            <Label>Categoria</Label>
            <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} list="edit-cats" />
            <datalist id="edit-cats">
              {CATEGORIAS_SUGERIDAS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1">
            <Label>WhatsApp *</Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))} inputMode="tel" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Fotos ({totalFotos}/{MAX_FOTOS})</Label>
              <input
                ref={fileRef}
                type="file"
                hidden
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button type="button" size="sm" variant="outline" disabled={totalFotos >= MAX_FOTOS} onClick={() => fileRef.current?.click()}>
                <Plus className="mr-1 h-4 w-4" /> Adicionar
              </Button>
            </div>
            {(fotosExistentes.length > 0 || novasFotos.length > 0) && (
              <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
                {fotosExistentes.map((f) => (
                  <div key={f.id} className="relative h-28 w-28 shrink-0 snap-start overflow-hidden rounded-lg border bg-muted">
                    <img src={f.foto_url} alt="foto" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removerExistente(f.id, f.storage_path)}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white"
                      aria-label="Remover"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {novasFotos.map((p) => (
                  <div key={p.key} className="relative h-28 w-28 shrink-0 snap-start overflow-hidden rounded-lg border bg-muted">
                    <img src={p.previewUrl} alt="preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(p.previewUrl);
                        setNovasFotos((prev) => prev.filter((x) => x.key !== p.key));
                      }}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white"
                      aria-label="Remover"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!canSubmit}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
