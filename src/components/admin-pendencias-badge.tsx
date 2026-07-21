import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PendenciasBreakdown = {
  reservas: number;
  classificados: number;
  visitantes: number;
  chamados: number;
  mensagens: number;
};

// Ordem = ordem em que as seções aparecem na página (AdminDashboard), usada
// pelo clique no sino pra rolar até a primeira que tiver pendência.
const PENDENCIA_ORDEM: { key: keyof PendenciasBreakdown; anchorId: string }[] = [
  { key: "reservas", anchorId: "admin-reservas" },
  { key: "classificados", anchorId: "admin-classificados" },
  { key: "visitantes", anchorId: "admin-visitantes" },
  { key: "chamados", anchorId: "admin-chamados" },
  { key: "mensagens", anchorId: "admin-mensagens" },
];

async function countPendencias(condominioId: string): Promise<PendenciasBreakdown> {
  const [mensagens, chamados, reservas, visitantes, classificados] = await Promise.all([
    supabase.from("contatos_publicos").select("id", { count: "exact", head: true }).eq("condominio_id", condominioId).eq("lido", false).then((r) => r.count ?? 0).catch(() => 0),
    supabase.from("chamados").select("id", { count: "exact", head: true }).eq("condominio_id", condominioId).eq("status", "aberto").then((r) => r.count ?? 0).catch(() => 0),
    supabase.from("reservas").select("id", { count: "exact", head: true }).eq("condominio_id", condominioId).eq("status", "pendente").then((r) => r.count ?? 0).catch(() => 0),
    supabase.from("visitantes").select("id", { count: "exact", head: true }).eq("condominio_id", condominioId).eq("status", "pendente").then((r) => r.count ?? 0).catch(() => 0),
    supabase.from("classificados").select("id", { count: "exact", head: true }).eq("condominio_id", condominioId).eq("status", "pendente").then((r) => r.count ?? 0).catch(() => 0),
  ]);
  return { reservas, classificados, visitantes, chamados, mensagens };
}

export function AdminPendenciasBadge({ condominioId }: { condominioId: string }) {
  const [breakdown, setBreakdown] = useState<PendenciasBreakdown>({
    reservas: 0,
    classificados: 0,
    visitantes: 0,
    chamados: 0,
    mensagens: 0,
  });

  useEffect(() => {
    let alive = true;
    const tick = () => {
      countPendencias(condominioId)
        .then((b) => { if (alive) setBreakdown(b); })
        .catch(() => {});
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, [condominioId]);

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

  const handleClick = () => {
    const primeira = PENDENCIA_ORDEM.find(({ key }) => breakdown[key] > 0);
    if (!primeira) return;
    document.getElementById(primeira.anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={total > 0 ? `${total} pendências — clique para ver a primeira` : "Sem pendências"}
    >
      <div className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--gold)]/20 text-[color:var(--gold)]">
        <Bell className="h-4 w-4" />
      </div>
      {total > 0 && (
        <span
          className="absolute -right-1 -top-1 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground"
          aria-hidden
        >
          {total > 99 ? "99+" : total}
        </span>
      )}
    </button>
  );
}
