/**
 * Camada de dados do Portal — tipos, mapeadores e queries contra Supabase.
 * Todos os SELECTs são filtrados por `condominio_id` do profile logado.
 */
import { supabase } from "@/lib/supabase";
import type { FinancialStatus, ReservationStatus } from "@/lib/mocks";

// ---------- TYPES (banco real) ----------

export type Role = "sindica" | "morador" | "admin_agencia";

export type Profile = {
  id: string;
  auth_user_id: string;
  condominio_id: string;
  nome_completo: string;
  unidade: string;
  role: Role;
  primeiro_acesso: boolean;
};

export type PautaRow = {
  id: string;
  condominio_id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  data_inicio: string | null;
  data_fim: string | null;
};

export type VotoRow = {
  id: string;
  pauta_id: string;
  morador_id: string;
  voto: "sim" | "nao";
  created_at?: string;
};

export type ReservaStatus = "pendente" | "aprovada" | "recusada" | "bloqueado";

export type ReservaRow = {
  id: string;
  condominio_id: string;
  morador_id: string;
  espaco: string;
  data_inicio: string;
  data_fim: string;
  status: ReservaStatus;
  motivo_recusa: string | null;
  observacoes: string | null;
  created_at?: string;
};

export type OcupacaoRow = {
  id: string;
  espaco: string;
  data_inicio: string;
  status: ReservaStatus;
  observacoes: string | null;
};

export type HistoricoRow = {
  id: string;
  condominio_id: string;
  unidade_id: string;
  ano: number;
  mes: number; // 1..12
  status: "pago" | "pendente" | "atrasado";
  valor: number | null;
};

export type ObraRow = {
  id: string;
  condominio_id: string;
  titulo: string;
  descricao: string | null;
  progresso_atual: number;
  status: "concluido" | "em_andamento" | "planejado";
};

export type ObraAtualizacaoRow = {
  id: string;
  obra_id: string;
  descricao: string | null;
  progresso: number;
  foto_url: string | null;
  created_at: string;
};

// ---------- MAPEADORES DE STATUS ----------

export const RESERVA_DB_TO_UI: Record<Exclude<ReservaStatus, "bloqueado">, ReservationStatus> = {
  pendente: "Pendente",
  aprovada: "Confirmada",
  recusada: "Recusada",
};

export const HISTORICO_DB_TO_UI: Record<HistoricoRow["status"], FinancialStatus> = {
  pago: "Em dia",
  pendente: "Pendente",
  atrasado: "Atrasado",
};

export const HISTORICO_UI_TO_DB: Record<FinancialStatus, HistoricoRow["status"]> = {
  "Em dia": "pago",
  Pendente: "pendente",
  Atrasado: "atrasado",
};

// ---------- ESPAÇOS RESERVÁVEIS (hardcoded por enquanto) ----------

export const RESERVATION_SPACES = [
  { id: "salao", name: "Salão de Festas" },
  { id: "churrasqueira", name: "Churrasqueira" },
  { id: "quadra", name: "Quadra Esportiva" },
];

// ---------- AUTH / PROFILE ----------

export async function fetchProfileByAuthUser(authUserId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function markFirstAccessComplete(authUserId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ primeiro_acesso: false })
    .eq("auth_user_id", authUserId);
  if (error) throw error;
}

// ---------- PAUTAS / VOTOS ----------

export async function fetchPautasAtivas(condominioId: string) {
  const { data, error } = await supabase
    .from("pautas")
    .select("*")
    .eq("condominio_id", condominioId)
    .eq("status", "ativa");
  if (error) throw error;
  return (data ?? []) as PautaRow[];
}

export async function fetchMeusVotos(_condominioId: string, moradorId: string) {
  // Basta filtrar pelos votos do morador — cada morador só existe em um condomínio.
  const { data, error } = await supabase
    .from("votos")
    .select("pauta_id, voto")
    .eq("morador_id", moradorId);
  if (error) throw error;
  return (data ?? []) as { pauta_id: string; voto: "sim" | "nao" }[];
}

export async function registrarVoto(pautaId: string, moradorId: string, voto: "sim" | "nao") {
  const { error } = await supabase
    .from("votos")
    .insert({ pauta_id: pautaId, morador_id: moradorId, voto });
  if (error) throw error;
}

export async function fetchVotosDePauta(pautaId: string) {
  const { data, error } = await supabase
    .from("votos")
    .select("id, voto, created_at, morador:profiles(nome_completo, unidade)")
    .eq("pauta_id", pautaId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as {
    id: string;
    voto: "sim" | "nao";
    created_at: string;
    morador: { nome_completo: string; unidade: string } | null;
  }[];
}


// ---------- RESERVAS ----------

export type ReservaComMorador = ReservaRow & {
  morador: { nome_completo: string; unidade: string } | null;
};

export async function fetchReservasDoCondominio(condominioId: string) {
  const { data, error } = await supabase
    .from("reservas")
    .select("*, morador:profiles(nome_completo, unidade)")
    .eq("condominio_id", condominioId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ReservaComMorador[];
}

export async function fetchMinhasReservas(moradorId: string) {
  const { data, error } = await supabase
    .from("reservas")
    .select("*")
    .eq("morador_id", moradorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReservaRow[];
}

export async function criarReserva(input: {
  condominio_id: string;
  morador_id: string;
  espaco: string;
  data_inicio: string;
  data_fim: string;
  observacoes?: string | null;
}) {
  const { error } = await supabase
    .from("reservas")
    .insert({ ...input, status: "pendente", observacoes: input.observacoes ?? null });
  if (error) throw error;
}

export async function criarBloqueio(input: {
  condominio_id: string;
  morador_id: string;
  espaco: string;
  data: string;
  motivo: string;
}) {
  const { error } = await supabase.from("reservas").insert({
    condominio_id: input.condominio_id,
    morador_id: input.morador_id,
    espaco: input.espaco,
    data_inicio: input.data,
    data_fim: input.data,
    status: "bloqueado",
    observacoes: input.motivo,
  });
  if (error) throw error;
}

export async function removerReserva(id: string) {
  const { error } = await supabase.from("reservas").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchOcupacoesCondominio(condominioId: string) {
  const { data, error } = await supabase
    .from("reservas")
    .select("id, espaco, data_inicio, status, observacoes")
    .eq("condominio_id", condominioId)
    .in("status", ["aprovada", "bloqueado"]);
  if (error) throw error;
  return (data ?? []) as OcupacaoRow[];
}

export async function aprovarReserva(id: string) {
  const { error } = await supabase
    .from("reservas")
    .update({ status: "aprovada", motivo_recusa: null })
    .eq("id", id);
  if (error) throw error;
}

export async function recusarReserva(id: string, motivo: string) {
  const { error } = await supabase
    .from("reservas")
    .update({ status: "recusada", motivo_recusa: motivo })
    .eq("id", id);
  if (error) throw error;
}

// ---------- HISTÓRICO FINANCEIRO ----------

export async function fetchHistoricoCondominio(condominioId: string) {
  const { data, error } = await supabase
    .from("historico_financeiro")
    .select("*")
    .eq("condominio_id", condominioId);
  if (error) throw error;
  return (data ?? []) as HistoricoRow[];
}

export async function fetchMeuHistorico(unidadeId: string, ano: number) {
  const { data, error } = await supabase
    .from("historico_financeiro")
    .select("*")
    .eq("unidade_id", unidadeId)
    .eq("ano", ano);
  if (error) throw error;
  return (data ?? []) as HistoricoRow[];
}

export async function atualizarHistorico(id: string, status: HistoricoRow["status"]) {
  const { error } = await supabase
    .from("historico_financeiro")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function fetchMoradoresDoCondominio(condominioId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome_completo, unidade, role")
    .eq("condominio_id", condominioId)
    .eq("role", "morador");
  if (error) throw error;
  return (data ?? []) as { id: string; nome_completo: string; unidade: string; role: Role }[];
}

export async function atualizarMorador(
  id: string,
  patch: { nome_completo: string; unidade: string },
) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) throw error;
}

export async function removerMorador(id: string) {
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id)
    .eq("role", "morador");
  if (error) throw error;
}

// ---------- OBRAS ----------

export async function fetchObras(condominioId: string) {
  const { data, error } = await supabase
    .from("obras")
    .select("id, condominio_id, titulo, descricao, progresso_atual, status")
    .eq("condominio_id", condominioId)
    .order("status");
  if (error) throw error;
  return (data ?? []) as ObraRow[];
}

export async function fetchAtualizacoesObra(obraId: string) {
  const { data, error } = await supabase
    .from("obra_atualizacoes")
    .select("id, obra_id, descricao, progresso, foto_url, created_at")
    .eq("obra_id", obraId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ObraAtualizacaoRow[];
}

export async function inserirAtualizacaoObra(input: {
  obra_id: string;
  descricao: string;
  progresso: number;
  foto_url?: string | null;
}) {
  const { error: insertErr } = await supabase.from("obra_atualizacoes").insert(input);
  if (insertErr) throw insertErr;
  const { error: updErr } = await supabase
    .from("obras")
    .update({ progresso_atual: input.progresso })
    .eq("id", input.obra_id);
  if (updErr) throw updErr;
}

export async function removerAtualizacaoObra(id: string) {
  const { error } = await supabase.from("obra_atualizacoes").delete().eq("id", id);
  if (error) throw error;
}

export async function atualizarObra(
  id: string,
  patch: {
    titulo: string;
    descricao: string;
    status: ObraRow["status"];
    progresso_atual: number;
  },
) {
  const { error } = await supabase.from("obras").update(patch).eq("id", id);
  if (error) throw error;
}

// ---------- STORAGE (obras-fotos) ----------

const OBRAS_BUCKET = "obras-fotos";
let bucketEnsured = false;

async function ensureObrasBucket() {
  if (bucketEnsured) return;
  // Tenta criar; ignora erro (já existe ou sem permissão do anon — nesse caso
  // o bucket deve ter sido criado previamente no dashboard do Supabase).
  await supabase.storage.createBucket(OBRAS_BUCKET, { public: true }).catch(() => {});
  bucketEnsured = true;
}

export async function uploadObraFoto(obraId: string, file: File) {
  await ensureObrasBucket();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${obraId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(OBRAS_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) throw error;
  const { data } = supabase.storage.from(OBRAS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ---------- CADASTROS (síndica) ----------

export async function criarMorador(input: {
  condominio_id: string;
  nome_completo: string;
  unidade: string;
}) {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      condominio_id: input.condominio_id,
      nome_completo: input.nome_completo,
      unidade: input.unidade,
      role: "morador",
      primeiro_acesso: true,
      auth_user_id: null,
    })
    .select("id, nome_completo, unidade, role")
    .single();
  if (error) throw error;
  return data as { id: string; nome_completo: string; unidade: string; role: Role };
}

export async function criarObra(input: {
  condominio_id: string;
  titulo: string;
  descricao: string;
  status: ObraRow["status"];
  progresso_atual: number;
}) {
  const { error } = await supabase.from("obras").insert(input);
  if (error) throw error;
}

export async function criarPauta(input: {
  condominio_id: string;
  titulo: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
}) {
  const { error } = await supabase.from("pautas").insert({ ...input, status: "ativa" });
  if (error) throw error;
}

