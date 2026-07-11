import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";

async function countPendencias(condominioId: string) {
  const queries = [
    supabase.from("contatos_publicos").select("id", { count: "exact", head: true }).eq("condominio_id", condominioId).eq("lido", false),
    supabase.from("chamados").select("id", { count: "exact", head: true }).eq("condominio_id", condominioId).eq("status", "aberto"),
    supabase.from("reservas").select("id", { count: "exact", head: true }).eq("condominio_id", condominioId).eq("status", "pendente"),
    supabase.from("visitantes").select("id", { count: "exact", head: true }).eq("condominio_id", condominioId).eq("status", "pendente"),
    supabase.from("classificados").select("id", { count: "exact", head: true }).eq("condominio_id", condominioId).eq("status", "pendente"),
  ];
  const results = await Promise.all(queries.map((q) => q.then((r) => r.count ?? 0).catch(() => 0)));
  return results.reduce((a, b) => a + b, 0);
}

export function AdminPendenciasBadge({ condominioId }: { condominioId: string }) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let alive = true;
    const tick = () => {
      countPendencias(condominioId)
        .then((n) => { if (alive) setTotal(n); })
        .catch(() => {});
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, [condominioId]);

  return (
    <div className="relative">
      <div className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--gold)]/20 text-[color:var(--gold)]">
        <Bell className="h-4 w-4" />
      </div>
      {total > 0 && (
        <span
          className="absolute -right-1 -top-1 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground"
          aria-label={`${total} pendências`}
        >
          {total > 99 ? "99+" : total}
        </span>
      )}
    </div>
  );
}
