import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

import { usePortalAuth } from "@/hooks/use-portal-auth";
import { ClassificadosShell } from "@/components/classificados-shell";
import {
  CATEGORIAS_SUGERIDAS,
  criarClassificado,
  inserirFoto,
  maskWhatsapp,
  uploadClassificadoFoto,
  whatsappToNumber,
} from "@/lib/classificados-data";

export const Route = createFileRoute("/classificados/novo")({
  head: () => ({
    meta: [{ title: "Novo anúncio — Marketplace" }],
  }),
  component: NovoClassificadoPage,
});

const MAX_FOTOS = 5;
const MAX_BYTES = 10 * 1024 * 1024;
const TITULO_MAX = 255;
const DESC_MAX = 2000;

type PhotoDraft = { key: string; file: File; previewUrl: string };

function NovoClassificadoPage() {
  const { profile, loading: authLoading } = usePortalAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [fotos, setFotos] = useState<PhotoDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    if (!titulo.trim() || titulo.length > TITULO_MAX) return false;
    if (!descricao.trim() || descricao.length > DESC_MAX) return false;
    if (whatsappToNumber(whatsapp).length < 10) return false;
    return true;
  }, [titulo, descricao, whatsapp]);

  const addFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const remaining = MAX_FOTOS - fotos.length;
    if (remaining <= 0) {
      toast.error(`Máximo de ${MAX_FOTOS} fotos.`);
      return;
    }
    const toAdd: PhotoDraft[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" não é uma imagem.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`"${file.name}" excede 10MB.`);
        continue;
      }
      toAdd.push({
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    setFotos((prev) => [...prev, ...toAdd]);
  };

  const removeFoto = (key: string) => {
    setFotos((prev) => {
      const target = prev.find((p) => p.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.key !== key);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!canSubmit) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await criarClassificado({
        condominio_id: profile.condominio_id,
        morador_id: profile.id,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categoria: categoria.trim() || null,
        whatsapp: whatsapp.trim(),
      });
      for (const f of fotos) {
        try {
          const up = await uploadClassificadoFoto(created.id, f.file);
          await inserirFoto({
            classificado_id: created.id,
            foto_url: up.url,
            storage_path: up.storage_path,
            file_name: up.file_name,
          });
        } catch (err) {
          console.error(err);
          toast.error(`Falha ao enviar "${f.file.name}".`);
        }
      }
      toast.success("Anúncio enviado! Aguardando aprovação da síndica.");
      fotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      navigate({ to: "/classificados/meus" });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar anúncio.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <ClassificadosShell title="Novo anúncio">
        <div className="grid place-items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </ClassificadosShell>
    );
  }

  if (!profile) {
    return (
      <ClassificadosShell title="Novo anúncio">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">Faça login no portal para criar anúncios.</p>
            <Button asChild className="mt-4">
              <Link to="/">Ir para o portal</Link>
            </Button>
          </CardContent>
        </Card>
      </ClassificadosShell>
    );
  }

  return (
    <ClassificadosShell title="Novo anúncio" subtitle="Preencha os dados e envie para aprovação">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="space-y-1">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value.slice(0, TITULO_MAX))}
                maxLength={TITULO_MAX}
                required
              />
              <p className="text-right text-xs text-muted-foreground">
                {titulo.length}/{TITULO_MAX}
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value.slice(0, DESC_MAX))}
                maxLength={DESC_MAX}
                rows={5}
                required
              />
              <p className="text-right text-xs text-muted-foreground">
                {descricao.length}/{DESC_MAX}
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="categoria">Categoria (opcional)</Label>
              <Input
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                list="categorias-sugeridas"
                placeholder="Ex: Aulas, Serviços, Venda, Aluguel..."
              />
              <datalist id="categorias-sugeridas">
                {CATEGORIAS_SUGERIDAS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1">
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))}
                placeholder="(11) 98765-4321"
                inputMode="tel"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Label>Fotos ({fotos.length}/{MAX_FOTOS})</Label>
                <p className="text-xs text-muted-foreground">Máx 10MB por imagem</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={fotos.length >= MAX_FOTOS}
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="mr-1 h-4 w-4" /> Adicionar foto
              </Button>
            </div>

            {fotos.length > 0 && (
              <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
                {fotos.map((p) => (
                  <div
                    key={p.key}
                    className="relative h-32 w-32 shrink-0 snap-start overflow-hidden rounded-lg border bg-muted"
                  >
                    <img src={p.previewUrl} alt="preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFoto(p.key)}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white hover:bg-black"
                      aria-label="Remover foto"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!canSubmit || submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Publicar
          </Button>
          <Button type="button" variant="ghost" asChild disabled={submitting}>
            <Link to="/classificados">Cancelar</Link>
          </Button>
        </div>
      </form>
    </ClassificadosShell>
  );
}

// Suppress unused warning for Trash2 import if not needed elsewhere.
void Trash2;
