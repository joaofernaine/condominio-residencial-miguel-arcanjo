/**
 * Marketplace de classificados — camada de dados.
 * Tabelas: classificados, classificados_fotos.
 * Bucket público: classificados-fotos.
 */
import { supabase } from "@/lib/supabase";

export type ClassificadoStatus = "pendente" | "aprovado" | "recusado" | "finalizado";

export type ClassificadoRow = {
  id: string;
  condominio_id: string;
  morador_id: string;
  titulo: string;
  descricao: string;
  categoria: string | null;
  whatsapp: string;
  status: ClassificadoStatus;
  motivo_recusa: string | null;
  created_at: string;
  updated_at: string;
};

export type ClassificadoFotoRow = {
  id: string;
  classificado_id: string;
  foto_url: string;
  storage_path: string;
  file_name: string;
  created_at: string;
};

export type ClassificadoComFotos = ClassificadoRow & {
  fotos: ClassificadoFotoRow[];
  morador?: { nome_completo: string; unidade: string } | null;
};

const BUCKET = "classificados-fotos";

// ---------- Storage ----------

export async function uploadClassificadoFoto(classificadoId: string, file: File) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${classificadoId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, storage_path: path, file_name: file.name };
}

export async function inserirFoto(input: {
  classificado_id: string;
  foto_url: string;
  storage_path: string;
  file_name: string;
}) {
  const { error } = await supabase.from("classificados_fotos").insert(input);
  if (error) throw error;
}

export async function removerFoto(id: string, storagePath: string) {
  await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {});
  const { error } = await supabase.from("classificados_fotos").delete().eq("id", id);
  if (error) throw error;
}

// ---------- CRUD classificado ----------

export async function criarClassificado(input: {
  condominio_id: string;
  morador_id: string;
  titulo: string;
  descricao: string;
  categoria: string | null;
  whatsapp: string;
}) {
  const { data, error } = await supabase
    .from("classificados")
    .insert({ ...input, status: "pendente" as ClassificadoStatus })
    .select("id")
    .single();
  if (error) throw error;
  return data as { id: string };
}

export async function atualizarClassificado(
  id: string,
  patch: {
    titulo: string;
    descricao: string;
    categoria: string | null;
    whatsapp: string;
  },
) {
  // Ao editar, retorna para pendente para nova moderação.
  const { error } = await supabase
    .from("classificados")
    .update({ ...patch, status: "pendente", motivo_recusa: null })
    .eq("id", id);
  if (error) throw error;
}

export async function deletarClassificado(id: string) {
  // Remove fotos do storage antes.
  const { data: fotos } = await supabase
    .from("classificados_fotos")
    .select("storage_path")
    .eq("classificado_id", id);
  const paths = (fotos ?? []).map((f: { storage_path: string }) => f.storage_path).filter(Boolean);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths).catch(() => {});
  const { error } = await supabase.from("classificados").delete().eq("id", id);
  if (error) throw error;
}

export async function atualizarStatus(
  id: string,
  status: ClassificadoStatus,
  motivo_recusa?: string | null,
) {
  const { error } = await supabase
    .from("classificados")
    .update({ status, motivo_recusa: motivo_recusa ?? null })
    .eq("id", id);
  if (error) throw error;
}

// ---------- Fetchers ----------

async function anexarFotos(rows: ClassificadoRow[]): Promise<ClassificadoComFotos[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const { data: fotos, error } = await supabase
    .from("classificados_fotos")
    .select("*")
    .in("classificado_id", ids)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const byId = new Map<string, ClassificadoFotoRow[]>();
  (fotos ?? []).forEach((f) => {
    const arr = byId.get((f as ClassificadoFotoRow).classificado_id) ?? [];
    arr.push(f as ClassificadoFotoRow);
    byId.set((f as ClassificadoFotoRow).classificado_id, arr);
  });
  return rows.map((r) => ({ ...r, fotos: byId.get(r.id) ?? [] }));
}

export async function fetchMeusClassificados(moradorId: string) {
  const { data, error } = await supabase
    .from("classificados")
    .select("*")
    .eq("morador_id", moradorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return anexarFotos((data ?? []) as ClassificadoRow[]);
}

export async function fetchClassificadoById(id: string) {
  const { data, error } = await supabase
    .from("classificados")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const withFotos = await anexarFotos([data as ClassificadoRow]);
  return withFotos[0];
}

export async function fetchClassificadosAprovados(
  condominioId: string,
  filtros: { categoria?: string; busca?: string; excluirMoradorId?: string } = {},
) {
  let q = supabase
    .from("classificados")
    .select("*")
    .eq("condominio_id", condominioId)
    .eq("status", "aprovado")
    .order("created_at", { ascending: false });
  if (filtros.categoria) q = q.eq("categoria", filtros.categoria);
  if (filtros.excluirMoradorId) q = q.neq("morador_id", filtros.excluirMoradorId);
  if (filtros.busca && filtros.busca.trim()) {
    const b = filtros.busca.trim().replace(/[%_]/g, "");
    q = q.or(`titulo.ilike.%${b}%,descricao.ilike.%${b}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as ClassificadoRow[];
  const withFotos = await anexarFotos(rows);
  // Anexa nome/unidade do morador
  const moradorIds = Array.from(new Set(rows.map((r) => r.morador_id)));
  if (moradorIds.length) {
    const { data: mors } = await supabase
      .from("profiles")
      .select("id, nome_completo, unidade")
      .in("id", moradorIds);
    const byId = new Map<string, { nome_completo: string; unidade: string }>();
    (mors ?? []).forEach((m: { id: string; nome_completo: string; unidade: string }) =>
      byId.set(m.id, { nome_completo: m.nome_completo, unidade: m.unidade }),
    );
    withFotos.forEach((r) => (r.morador = byId.get(r.morador_id) ?? null));
  }
  return withFotos;
}

export async function fetchCategoriasAprovadas(condominioId: string) {
  const { data, error } = await supabase
    .from("classificados")
    .select("categoria")
    .eq("condominio_id", condominioId)
    .eq("status", "aprovado");
  if (error) throw error;
  const set = new Set<string>();
  (data ?? []).forEach((r: { categoria: string | null }) => {
    if (r.categoria && r.categoria.trim()) set.add(r.categoria.trim());
  });
  return Array.from(set).sort();
}

export async function fetchClassificadosAdmin(
  condominioId: string,
  status?: ClassificadoStatus,
) {
  let q = supabase
    .from("classificados")
    .select("*")
    .eq("condominio_id", condominioId)
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as ClassificadoRow[];
  const withFotos = await anexarFotos(rows);
  const moradorIds = Array.from(new Set(rows.map((r) => r.morador_id)));
  if (moradorIds.length) {
    const { data: mors } = await supabase
      .from("profiles")
      .select("id, nome_completo, unidade")
      .in("id", moradorIds);
    const byId = new Map<string, { nome_completo: string; unidade: string }>();
    (mors ?? []).forEach((m: { id: string; nome_completo: string; unidade: string }) =>
      byId.set(m.id, { nome_completo: m.nome_completo, unidade: m.unidade }),
    );
    withFotos.forEach((r) => (r.morador = byId.get(r.morador_id) ?? null));
  }
  return withFotos;
}

// ---------- Helpers ----------

export const CATEGORIAS_SUGERIDAS = ["Aulas", "Serviços", "Venda", "Aluguel", "Outros"];

export function maskWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function whatsappToNumber(masked: string): string {
  return masked.replace(/\D/g, "");
}

export function whatsappLink(masked: string, texto?: string): string {
  const num = whatsappToNumber(masked);
  const full = num.startsWith("55") ? num : `55${num}`;
  const q = texto ? `?text=${encodeURIComponent(texto)}` : "";
  return `https://wa.me/${full}${q}`;
}

export const STATUS_LABEL: Record<ClassificadoStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
  finalizado: "Finalizado",
};

export const STATUS_BADGE_CLASS: Record<ClassificadoStatus, string> = {
  pendente: "bg-muted text-muted-foreground border-border",
  aprovado: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900",
  recusado: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-900",
  finalizado: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-900",
};
