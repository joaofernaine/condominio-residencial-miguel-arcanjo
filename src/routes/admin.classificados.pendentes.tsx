import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { usePortalAuth } from "@/hooks/use-portal-auth";
import { ClassificadosShell, PhotoGallery } from "@/components/classificados-shell";
import {
  atualizarStatus,
  fetchClassificadosAdmin,
  whatsappLink,
  type ClassificadoComFotos,
} from "@/lib/classificados-data";

export const Route = createFileRoute("/admin/classificados/pendentes")({
  head: () => ({ meta: [{ title: "Moderação — Marketplace" }] }),
  component: PendentesPage,
});

function PendentesPage() {
  const { profile, loading: authLoading } = usePortalAuth();
  const [items, setItems] = useState<ClassificadoComFotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [recusar, setRecusar] = useState<ClassificadoComFotos | null>(null);
  const [motivo, setMotivo] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = () => {
    if (!profile) return;
    setLoading(true);
    fetchClassificadosAdmin(profile.condominio_id, "pendente")
      .then(setItems)
      .catch((e) => {
        console.error(e);
        toast.error("Erro ao carregar pendentes.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!profile) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

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

  if (authLoading) {
    return (
      <ClassificadosShell title="Moderação">
        <div className="grid place-items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </ClassificadosShell>
    );
  }

  if (!profile || profile.role !== "sindica") {
    return (
      <ClassificadosShell title="Moderação">
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
      title="Moderar classificados"
      subtitle={`${items.length} pendente(s)`}
      right={
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/classificados">Ver todos</Link>
        </Button>
      }
    >
      {loading ? (
        <div className="grid place-items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
            Nenhum anúncio pendente.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <CardContent className="space-y-3 p-4">
                <PhotoGallery fotos={c.fotos} altBase={c.titulo} />
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold">{c.titulo}</h3>
                    {c.categoria && <Badge variant="secondary" className="mt-1">{c.categoria}</Badge>}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{new Date(c.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm">{c.descricao}</p>
                <div className="rounded-md bg-muted/40 p-2 text-xs">
                  <p><span className="font-medium">Morador:</span> {c.morador?.nome_completo ?? "—"} · Unidade {c.morador?.unidade ?? "—"}</p>
                  <p>
                    <span className="font-medium">WhatsApp:</span>{" "}
                    <a href={whatsappLink(c.whatsapp)} target="_blank" rel="noreferrer" className="underline">
                      {c.whatsapp}
                    </a>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => aprovar(c.id)} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Aprovar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setRecusar(c)} disabled={busy}>
                    <XCircle className="mr-1 h-4 w-4" /> Recusar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
    </ClassificadosShell>
  );
}
