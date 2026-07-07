import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { usePortalAuth } from "@/hooks/use-portal-auth";
import { ClassificadosShell, PhotoGallery } from "@/components/classificados-shell";
import {
  atualizarStatus,
  deletarClassificado,
  fetchClassificadosAdmin,
  STATUS_BADGE_CLASS,
  STATUS_LABEL,
  type ClassificadoComFotos,
  type ClassificadoStatus,
} from "@/lib/classificados-data";

export const Route = createFileRoute("/admin/classificados/")({
  head: () => ({ meta: [{ title: "Gerenciar classificados" }] }),
  component: AdminClassificadosPage,
});

function AdminClassificadosPage() {
  const { profile, loading: authLoading } = usePortalAuth();
  const [items, setItems] = useState<ClassificadoComFotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | ClassificadoStatus>("todos");
  const [confirmDel, setConfirmDel] = useState<ClassificadoComFotos | null>(null);

  const reload = () => {
    if (!profile) return;
    setLoading(true);
    fetchClassificadosAdmin(profile.condominio_id)
      .then(setItems)
      .catch((e) => {
        console.error(e);
        toast.error("Erro ao carregar.");
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

  const restaurar = async (id: string) => {
    try {
      await atualizarStatus(id, "pendente", null);
      toast.success("Anúncio restaurado para pendente.");
      reload();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao restaurar.");
    }
  };

  const finalizar = async (id: string) => {
    try {
      await atualizarStatus(id, "finalizado");
      toast.success("Anúncio finalizado.");
      reload();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao finalizar.");
    }
  };

  const deletar = async () => {
    if (!confirmDel) return;
    try {
      await deletarClassificado(confirmDel.id);
      toast.success("Anúncio removido.");
      setConfirmDel(null);
      reload();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover.");
    }
  };

  if (authLoading) {
    return (
      <ClassificadosShell title="Classificados">
        <div className="grid place-items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </ClassificadosShell>
    );
  }
  if (!profile || profile.role !== "sindica") {
    return (
      <ClassificadosShell title="Classificados">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Área restrita à síndica.
          </CardContent>
        </Card>
      </ClassificadosShell>
    );
  }

  return (
    <ClassificadosShell
      title="Gerenciar classificados"
      subtitle={`${items.length} anúncio(s)`}
      right={
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/classificados/pendentes">Moderar pendentes</Link>
        </Button>
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
            Nenhum anúncio.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtrados.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <CardContent className="space-y-3 p-4">
                <PhotoGallery fotos={c.fotos} altBase={c.titulo} />
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold">{c.titulo}</h3>
                  <Badge variant="outline" className={STATUS_BADGE_CLASS[c.status]}>
                    {STATUS_LABEL[c.status]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.morador?.nome_completo ?? "—"} · Unidade {c.morador?.unidade ?? "—"} ·{" "}
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {c.status === "recusado" && (
                    <Button variant="outline" size="sm" onClick={() => restaurar(c.id)}>
                      <RotateCcw className="mr-1 h-3.5 w-3.5" /> Restaurar
                    </Button>
                  )}
                  {c.status === "aprovado" && (
                    <Button variant="outline" size="sm" onClick={() => finalizar(c.id)}>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Finalizar
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={() => setConfirmDel(c)}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Deletar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover anúncio?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deletar}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ClassificadosShell>
  );
}
