import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, MessageCircle, Search, Plus, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { usePortalAuth } from "@/hooks/use-portal-auth";
import { ClassificadosShell, PhotoGallery } from "@/components/classificados-shell";
import {
  fetchCategoriasAprovadas,
  fetchClassificadosAprovados,
  whatsappLink,
  type ClassificadoComFotos,
} from "@/lib/classificados-data";
import { LANDING_CONDOMINIO_ID } from "@/lib/portal-data";

export const Route = createFileRoute("/classificados/")({
  head: () => ({
    meta: [
      { title: "Marketplace — Portal do Condomínio" },
      { name: "description", content: "Classificados dos moradores: aulas, serviços, vendas e aluguéis." },
    ],
  }),
  component: PublicClassificadosPage,
});

function PublicClassificadosPage() {
  const { profile, loading: authLoading } = usePortalAuth();
  const condominioId = profile?.condominio_id ?? LANDING_CONDOMINIO_ID;

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("todas");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [items, setItems] = useState<ClassificadoComFotos[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoriasAprovadas(condominioId).then(setCategorias).catch(console.error);
  }, [condominioId]);

  useEffect(() => {
    setLoading(true);
    fetchClassificadosAprovados(condominioId, {
      categoria: categoria === "todas" ? undefined : categoria,
      busca: busca.trim() || undefined,
      excluirMoradorId: profile?.id,
    })
      .then(setItems)
      .catch((e) => {
        console.error(e);
        toast.error("Erro ao carregar anúncios.");
      })
      .finally(() => setLoading(false));
  }, [condominioId, categoria, busca, profile?.id]);

  return (
    <ClassificadosShell
      title="Marketplace"
      subtitle="Anúncios aprovados dos moradores"
      right={
        profile ? (
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/classificados/meus">Meus anúncios</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/classificados/novo">
                <Plus className="mr-1 h-4 w-4" /> Anunciar
              </Link>
            </Button>
          </>
        ) : null
      }
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título ou descrição"
            className="pl-8"
          />
        </div>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {authLoading || loading ? (
        <div className="grid place-items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum anúncio encontrado.
            {profile && (
              <div className="mt-4">
                <Button asChild size="sm">
                  <Link to="/classificados/novo">
                    <Plus className="mr-1 h-4 w-4" /> Criar o primeiro
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((c) => (
            <PublicCard key={c.id} item={c} />
          ))}
        </div>
      )}
    </ClassificadosShell>
  );
}

function PublicCard({ item }: { item: ClassificadoComFotos }) {
  const shortDesc = useMemo(
    () => (item.descricao.length > 150 ? item.descricao.slice(0, 150) + "…" : item.descricao),
    [item.descricao],
  );
  const dataFormatada = new Date(item.created_at).toLocaleDateString("pt-BR");
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 p-4">
        <PhotoGallery fotos={item.fotos} altBase={item.titulo} />
        <div className="space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{item.titulo}</h3>
            {item.categoria && (
              <Badge variant="secondary" className="shrink-0">
                <Tag className="mr-1 h-3 w-3" /> {item.categoria}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{shortDesc}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {item.morador?.nome_completo ? `${item.morador.nome_completo} · ` : ""}
            {dataFormatada}
          </span>
        </div>
        <Button asChild className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
          <a
            href={whatsappLink(item.whatsapp, `Olá! Vi seu anúncio "${item.titulo}" no portal do condomínio.`)}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="mr-2 h-4 w-4" /> Chamar no WhatsApp
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
