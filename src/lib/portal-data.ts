/**
 * Camada de dados do Portal — tipos, mapeadores e queries contra Supabase.
 * Todos os SELECTs são filtrados por `condominio_id` do profile logado.
 */
import { supabase } from "@/lib/supabase";
import type { FinancialStatus, ReservationStatus } from "@/lib/mocks";

// ---------- TYPES (banco real) ----------

// "zelador" é legado — nenhum fluxo de cadastro cria mais esse role
// (criar-funcionario agora usa "morador" com unidade null + permissões
// granulares). Mantido no tipo só pra não quebrar profiles antigos que
// ainda tenham esse valor no banco.
export type Role = "sindica" | "morador" | "admin_agencia" | "zelador";

export type Permissao =
  | "ver_financeiro"
  | "editar_financeiro"
  | "gerenciar_moradores"
  | "excluir_morador"
  | "gerenciar_obras"
  | "gerenciar_votacoes"
  | "publicar_avisos"
  | "moderar_classificados"
  | "responder_chamados"
  | "aprovar_visitantes"
  | "aprovar_reservas"
  | "cadastrar_funcionario";

export const PERMISSOES_DISPONIVEIS: { id: Permissao; label: string }[] = [
  { id: "ver_financeiro", label: "Ver financeiro" },
  { id: "editar_financeiro", label: "Editar financeiro (importar relatório, marcar pago)" },
  { id: "gerenciar_moradores", label: "Cadastrar/editar morador" },
  { id: "excluir_morador", label: "Excluir morador" },
  { id: "gerenciar_obras", label: "Gerenciar obras" },
  { id: "gerenciar_votacoes", label: "Gerenciar votações" },
  { id: "publicar_avisos", label: "Publicar avisos e configurar a landing (amenidades, sobre)" },
  { id: "moderar_classificados", label: "Moderar classificados" },
  { id: "responder_chamados", label: "Responder/fechar chamados" },
  { id: "aprovar_visitantes", label: "Aprovar/recusar visitantes" },
  { id: "aprovar_reservas", label: "Aprovar/recusar reservas" },
  { id: "cadastrar_funcionario", label: "Cadastrar funcionário" },
];

export type Profile = {
  id: string;
  auth_user_id: string;
  condominio_id: string;
  nome_completo: string;
  unidade: string;
  role: Role;
  primeiro_acesso: boolean;
  titulo_funcao: string | null;
  permissoes: Permissao[];
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
  { id: "churrasqueira", name: "Churrasqueira" },
];

// ---------- AUTH / PROFILE ----------

export async function fetchProfileByAuthUser(authUserId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, profile_permissoes(permissao)")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { profile_permissoes, ...rest } = data as unknown as Profile & {
    profile_permissoes: { permissao: Permissao }[] | null;
  };
  return { ...rest, permissoes: (profile_permissoes ?? []).map((p) => p.permissao) } as Profile;
}

export async function fetchPermissoesDoProfile(profileId: string) {
  const { data, error } = await supabase
    .from("profile_permissoes")
    .select("permissao")
    .eq("profile_id", profileId);
  if (error) throw error;
  return (data ?? []).map((p) => p.permissao as Permissao);
}

export async function definirPermissoes(profileId: string, permissoes: Permissao[], tituloFuncao: string | null) {
  const { error: updErr } = await supabase
    .from("profiles")
    .update({ titulo_funcao: tituloFuncao })
    .eq("id", profileId);
  if (updErr) throw updErr;

  const { error: delErr } = await supabase
    .from("profile_permissoes")
    .delete()
    .eq("profile_id", profileId);
  if (delErr) throw delErr;

  if (permissoes.length > 0) {
    const { error: insErr } = await supabase
      .from("profile_permissoes")
      .insert(permissoes.map((permissao) => ({ profile_id: profileId, permissao })));
    if (insErr) throw insErr;
  }
}

export async function markFirstAccessComplete(authUserId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ primeiro_acesso: false })
    .eq("auth_user_id", authUserId);
  if (error) throw error;
}

// ---------- ALERTAS DE PENDÊNCIA POR E-MAIL ----------
// "Destinatário elegível" = quem já tem como aprovar visitante ou reserva
// (sindica, admin_agencia, ou permissão granular aprovar_visitantes/
// aprovar_reservas) — a síndica só liga/desliga o e-mail pra quem já
// pode agir, não define quem pode agir (isso é "Gerenciar função").

export type DestinatarioAlerta = {
  id: string;
  nome_completo: string;
  role: Role;
  titulo_funcao: string | null;
  recebeAlertaVisitante: boolean;
  recebeAlertaReserva: boolean;
  receber_alertas_pendencia: boolean;
};

export async function fetchDestinatariosAlertas(condominioId: string): Promise<DestinatarioAlerta[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome_completo, role, titulo_funcao, receber_alertas_pendencia, profile_permissoes(permissao)")
    .eq("condominio_id", condominioId);
  if (error) throw error;
  return (data ?? [])
    .map((p) => {
      const perms = ((p.profile_permissoes ?? []) as { permissao: Permissao }[]).map((pp) => pp.permissao);
      const admin = p.role === "sindica" || p.role === "admin_agencia";
      return {
        id: p.id,
        nome_completo: p.nome_completo,
        role: p.role as Role,
        titulo_funcao: p.titulo_funcao as string | null,
        recebeAlertaVisitante: admin || perms.includes("aprovar_visitantes"),
        recebeAlertaReserva: admin || perms.includes("aprovar_reservas"),
        receber_alertas_pendencia: p.receber_alertas_pendencia as boolean,
      };
    })
    .filter((p) => p.recebeAlertaVisitante || p.recebeAlertaReserva);
}

export async function definirRecebeAlertas(profileId: string, receber: boolean) {
  const { error } = await supabase
    .from("profiles")
    .update({ receber_alertas_pendencia: receber })
    .eq("id", profileId);
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

export async function registrarVoto(
  condominioId: string,
  pautaId: string,
  moradorId: string,
  voto: "sim" | "nao",
) {
  const { error } = await supabase
    .from("votos")
    .insert({ condominio_id: condominioId, pauta_id: pautaId, morador_id: moradorId, voto });
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

export async function criarHistorico(input: {
  condominio_id: string;
  unidade_id: string;
  ano: number;
  mes: number;
  status: HistoricoRow["status"];
  valor: number;
}) {
  const { error } = await supabase.from("historico_financeiro").insert(input);
  if (error) throw error;
}


export async function fetchMoradoresDoCondominio(condominioId: string) {
  // Lista todo mundo com unidade preenchida (moradores de fato — síndica/
  // admin_agencia promovidos a partir de um morador continuam aparecendo
  // aqui, financeiro/histórico, mesmo depois de promovidos) MAIS quem tem
  // unidade null (funcionário puro, cadastrado via criar-funcionario — sem
  // role especial, só profiles comuns sem unidade), num bloco
  // "Funcionários" à parte. Só "ADMIN" (sentinela legado de um cadastro
  // manual antigo) fica de fora. Filtro em JS, não em SQL, porque
  // `.neq("unidade", "ADMIN")` excluiria as linhas com unidade NULL (NULL
  // <> 'ADMIN' avalia "unknown", não true, no Postgres).
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome_completo, unidade, role, titulo_funcao, profile_permissoes(permissao)")
    .eq("condominio_id", condominioId);
  if (error) throw error;
  return (data ?? [])
    .filter((m) => m.unidade !== "ADMIN")
    .map((m) => ({
      id: m.id,
      nome_completo: m.nome_completo,
      unidade: m.unidade as string | null,
      role: m.role as Role,
      titulo_funcao: m.titulo_funcao as string | null,
      permissoes: ((m.profile_permissoes ?? []) as { permissao: Permissao }[]).map((p) => p.permissao),
    }));
}

export async function atualizarMorador(
  id: string,
  patch: { nome_completo: string; unidade: string | null },
) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) throw error;
}

// Sem filtro de role aqui de propósito — quem decide o que pode ser
// apagado é a RLS (profiles_delete): morador sempre; síndica só se quem
// chamou for admin_agencia; admin_agencia nunca pode ser apagada por
// ninguém. O front já só mostra o botão pra quem tem a permissão certa.
// Chama a edge function excluir-pessoa em vez de apagar `profiles` direto
// pelo client — apagar só o profile deixava o login em auth.users pra
// trás, travando o e-mail pra sempre ("A user with this email address
// has already been registered" ao tentar recadastrar a mesma pessoa).
export async function removerMorador(id: string) {
  await invocarFuncaoEdge("excluir-pessoa", { profile_id: id });
}

export async function promoverPara(id: string, novoRole: "sindica" | "admin_agencia") {
  const { error } = await supabase
    .from("profiles")
    .update({ role: novoRole })
    .eq("id", id);
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

export async function removerObra(id: string) {
  const { error } = await supabase.from("obras").delete().eq("id", id);
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

/**
 * Chama uma edge function e propaga o motivo real do erro. Sem isso,
 * quando a function responde com status != 2xx, o supabase-js troca a
 * mensagem por um genérico "Edge Function returned a non-2xx status
 * code" e o `{ error: "..." }` que a function mandou de propósito
 * (email duplicado, campo faltando, sem permissão) se perde — quem vê o
 * toast não descobre o que aconteceu de verdade.
 */
async function invocarFuncaoEdge<T = { success: true }>(
  nome: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(nome, { body });
  if (error) {
    const context = (error as { context?: Response }).context;
    let mensagemReal: string | null = null;
    if (context && typeof context.json === "function") {
      try {
        const corpo = await context.clone().json();
        if (corpo?.error) mensagemReal = corpo.error;
      } catch {
        // corpo da resposta não era JSON — usa a mensagem genérica mesmo
      }
    }
    throw new Error(mensagemReal ?? error.message);
  }
  if ((data as { error?: string } | null)?.error) {
    throw new Error((data as { error: string }).error);
  }
  return data as T;
}

export async function criarMorador(input: {
  condominio_id: string;
  nome_completo: string;
  email: string;
  bloco: string;
  apartamento: string;
}) {
  return invocarFuncaoEdge("criar-morador", {
    email: input.email,
    nome_completo: input.nome_completo,
    bloco: input.bloco,
    apartamento: input.apartamento,
    condominio_id: input.condominio_id,
  });
}

export async function criarFuncionario(input: {
  condominio_id: string;
  nome_completo: string;
  email: string;
  titulo_funcao?: string;
  permissoes?: Permissao[];
}) {
  return invocarFuncaoEdge("criar-funcionario", {
    email: input.email,
    nome_completo: input.nome_completo,
    condominio_id: input.condominio_id,
    titulo_funcao: input.titulo_funcao,
    permissoes: input.permissoes,
  });
}

// ---------- LOGIN / RATE LIMITING ----------

export type LoginGuardResult = {
  bloqueado: boolean;
  retry_after_segundos?: number;
  tentativas_restantes?: number;
};

export async function verificarBloqueioLogin(email: string): Promise<LoginGuardResult> {
  const { data, error } = await supabase.functions.invoke("controle-login", {
    body: { action: "verificar", email },
  });
  if (error) throw error;
  return data as LoginGuardResult;
}

export async function registrarTentativaLogin(email: string, sucesso: boolean): Promise<LoginGuardResult> {
  const { data, error } = await supabase.functions.invoke("controle-login", {
    body: { action: "registrar", email, sucesso },
  });
  if (error) throw error;
  return data as LoginGuardResult;
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

export async function fetchPautasEncerradas(condominioId: string) {
  const { data, error } = await supabase
    .from("pautas")
    .select("*")
    .eq("condominio_id", condominioId)
    .eq("status", "encerrada")
    .order("data_fim", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PautaRow[];
}

export async function encerrarPauta(pautaId: string) {
  const { error } = await supabase
    .from("pautas")
    .update({ status: "encerrada", data_fim: new Date().toISOString().slice(0, 10) })
    .eq("id", pautaId);
  if (error) throw error;
}

export async function excluirPauta(pautaId: string) {
  const { error: votosError } = await supabase.from("votos").delete().eq("pauta_id", pautaId);
  if (votosError) throw votosError;
  const { error } = await supabase.from("pautas").delete().eq("id", pautaId);
  if (error) throw error;
}


// ---------- DOCUMENTOS ----------

export type DocumentoTipo = string;

export type DocumentoRow = {
  id: string;
  condominio_id: string;
  tipo: DocumentoTipo;
  mes: number;
  ano: number;
  url: string;
  nome_arquivo: string;
  created_at?: string;
};

const DOCUMENTOS_BUCKET = "documentos";
let documentosBucketEnsured = false;

async function ensureDocumentosBucket() {
  if (documentosBucketEnsured) return;
  await supabase.storage.createBucket(DOCUMENTOS_BUCKET, { public: true }).catch(() => {});
  documentosBucketEnsured = true;
}

export async function uploadDocumentoPdf(input: {
  tipo: DocumentoTipo;
  ano: number;
  mes: number;
  file: File;
}) {
  await ensureDocumentosBucket();
  const slug = input.tipo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "documento";
  const path = `${input.ano}/${input.mes}/${slug}-${Date.now()}.pdf`;
  const { error } = await supabase.storage
    .from(DOCUMENTOS_BUCKET)
    .upload(path, input.file, { upsert: false, contentType: "application/pdf" });
  if (error) throw error;
  const { data } = supabase.storage.from(DOCUMENTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchDocumentos(condominioId: string) {
  const { data, error } = await supabase
    .from("documentos")
    .select("id, condominio_id, tipo, mes, ano, url, nome_arquivo, created_at")
    .eq("condominio_id", condominioId)
    .order("ano", { ascending: false })
    .order("mes", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DocumentoRow[];
}

export async function fetchAnosDocumentos(condominioId: string) {
  const { data, error } = await supabase
    .from("documentos")
    .select("ano", { count: "exact", head: false })
    .eq("condominio_id", condominioId)
    .order("ano", { ascending: false });
  if (error) throw error;
  const anos = new Set<number>();
  (data ?? []).forEach((row) => typeof row.ano === "number" && anos.add(row.ano));
  return Array.from(anos);
}

export async function fetchTiposDocumentos(condominioId: string) {
  const { data, error } = await supabase
    .from("documentos")
    .select("tipo")
    .eq("condominio_id", condominioId)
    .order("tipo", { ascending: true });
  if (error) throw error;
  const tipos = new Set<string>();
  (data ?? []).forEach((row) => typeof row.tipo === "string" && row.tipo.trim() && tipos.add(row.tipo.trim()));
  return Array.from(tipos);
}

export async function fetchDocumentosFiltrados(
  condominioId: string,
  filtros: { ano?: number; tipo?: string; mes?: number },
) {
  let q = supabase
    .from("documentos")
    .select("id, condominio_id, tipo, mes, ano, url, nome_arquivo, created_at")
    .eq("condominio_id", condominioId)
    .eq("ano", filtros.ano ?? new Date().getFullYear());
  if (filtros.tipo) q = q.eq("tipo", filtros.tipo);
  if (filtros.mes != null) q = q.eq("mes", filtros.mes);

  const { data, error } = await q.order("mes", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DocumentoRow[];
}


export async function criarDocumento(input: {
  condominio_id: string;
  tipo: DocumentoTipo;
  mes: number;
  ano: number;
  url: string;
  nome_arquivo: string;
}) {
  const { error } = await supabase.from("documentos").insert(input);
  if (error) throw error;
}

export async function removerDocumento(id: string) {
  const { error } = await supabase.from("documentos").delete().eq("id", id);
  if (error) throw error;
}

// ---------- LANDING PAGE (condominio_config, amenidades, avisos_publicos) ----------

export const LANDING_CONDOMINIO_ID = "a3dcd3da-c281-4bbc-8dad-f62d94353281";

export type CondominioConfigRow = {
  condominio_id: string;
  sobre_titulo: string | null;
  sobre_descricao: string | null;
  telefone_portaria: string | null;
  email_sindica: string | null;
  horario_atendimento: string | null;
};

export type AmenidadeRow = {
  id: string;
  condominio_id: string;
  nome: string;
  descricao: string | null;
  icone: string | null;
  ordem: number;
};

export type AvisoPublicoRow = {
  id: string;
  condominio_id: string;
  titulo: string;
  conteudo: string;
  ativo: boolean;
  created_at: string;
};

export async function fetchCondominioConfig(condominioId: string) {
  const { data, error } = await supabase
    .from("condominio_config")
    .select("condominio_id, sobre_titulo, sobre_descricao, telefone_portaria, email_sindica, horario_atendimento")
    .eq("condominio_id", condominioId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as CondominioConfigRow | null;
}

export async function upsertCondominioConfig(input: {
  condominio_id: string;
  sobre_titulo: string;
  sobre_descricao: string;
}) {
  const { error } = await supabase
    .from("condominio_config")
    .upsert(
      { ...input, updated_at: new Date().toISOString() },
      { onConflict: "condominio_id" },
    );
  if (error) throw error;
}

export async function fetchAmenidades(condominioId: string) {
  const { data, error } = await supabase
    .from("amenidades")
    .select("id, condominio_id, nome, descricao, icone, ordem")
    .eq("condominio_id", condominioId)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AmenidadeRow[];
}

export async function criarAmenidade(input: {
  condominio_id: string;
  nome: string;
  descricao: string;
  icone: string;
  ordem: number;
}) {
  const { error } = await supabase.from("amenidades").insert(input);
  if (error) throw error;
}

export async function atualizarAmenidade(
  id: string,
  patch: { nome: string; descricao: string; icone: string; ordem: number },
) {
  const { error } = await supabase.from("amenidades").update(patch).eq("id", id);
  if (error) throw error;
}

export async function removerAmenidade(id: string) {
  const { error } = await supabase.from("amenidades").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchAvisosPublicosAtivos(condominioId: string) {
  const { data, error } = await supabase
    .from("avisos_publicos")
    .select("id, condominio_id, titulo, conteudo, ativo, created_at")
    .eq("condominio_id", condominioId)
    .eq("ativo", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AvisoPublicoRow[];
}

export async function fetchAvisosPublicos(condominioId: string) {
  const { data, error } = await supabase
    .from("avisos_publicos")
    .select("id, condominio_id, titulo, conteudo, ativo, created_at")
    .eq("condominio_id", condominioId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AvisoPublicoRow[];
}

export async function criarAvisoPublico(input: {
  condominio_id: string;
  titulo: string;
  conteudo: string;
}) {
  const { error } = await supabase
    .from("avisos_publicos")
    .insert({ ...input, ativo: true });
  if (error) throw error;
}

export async function toggleAvisoPublico(id: string, ativo: boolean) {
  const { error } = await supabase
    .from("avisos_publicos")
    .update({ ativo })
    .eq("id", id);
  if (error) throw error;
}

export async function removerAvisoPublico(id: string) {
  const { error } = await supabase.from("avisos_publicos").delete().eq("id", id);
  if (error) throw error;
}

// ---------- IMPORTAÇÃO FINANCEIRA (FUNDO DE OBRAS) ----------

export type PagamentoImportadoInput = {
  condominio_id: string;
  unidade_id: string;
  competencia_ano: number;
  competencia_mes: number;
  nosso_numero: string;
  valor_taxa_condominio: number;
  valor_fundo_reserva: number;
  valor_fundo_obras: number;
  valor_outros: number;
  data_credito: string | null;
  importado_por: string;
};

/** Moradores do condomínio com o código de unidade já salvo (se houver), para sugerir o match automático na importação. */
export async function fetchMoradoresParaImportacao(condominioId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome_completo, unidade, codigo_relatorio_externo")
    .eq("condominio_id", condominioId)
    .eq("role", "morador");
  if (error) throw error;
  return (data ?? []) as { id: string; nome_completo: string; unidade: string; codigo_relatorio_externo: string | null }[];
}

/** Salva o código do relatório externo (ex. "101B") no perfil, para próximas importações já virem casadas. */
export async function salvarCodigoRelatorioExterno(profileId: string, codigo: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ codigo_relatorio_externo: codigo })
    .eq("id", profileId);
  if (error) throw error;
}

/** Quais desses nosso_numero já foram importados antes (pra marcar como duplicado na revisão). */
export async function fetchNossosNumerosJaImportados(condominioId: string, nossosNumeros: string[]) {
  if (nossosNumeros.length === 0) return new Set<string>();
  const { data, error } = await supabase
    .from("pagamentos_importados")
    .select("nosso_numero")
    .eq("condominio_id", condominioId)
    .in("nosso_numero", nossosNumeros);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.nosso_numero as string));
}

/**
 * Confirma a importação: grava as cobranças novas (ignora duplicadas por
 * nosso_numero) e marca `historico_financeiro` como "pago" nas
 * competências cobertas. Não mexe em unidades que não aparecem na leva.
 */
export async function confirmarImportacaoPagamentos(
  condominioId: string,
  cobrancas: PagamentoImportadoInput[],
) {
  if (cobrancas.length === 0) return { inseridas: 0 };

  const { error: insertError, count } = await supabase
    .from("pagamentos_importados")
    .upsert(cobrancas, { onConflict: "condominio_id,nosso_numero", ignoreDuplicates: true, count: "exact" });
  if (insertError) throw insertError;

  const competenciasPorUnidade = new Map<string, Set<string>>();
  for (const c of cobrancas) {
    const chave = c.unidade_id;
    const competencia = `${c.competencia_ano}-${c.competencia_mes}`;
    if (!competenciasPorUnidade.has(chave)) competenciasPorUnidade.set(chave, new Set());
    competenciasPorUnidade.get(chave)!.add(competencia);
  }

  const unidadeIds = Array.from(competenciasPorUnidade.keys());
  const { data: existentes, error: fetchError } = await supabase
    .from("historico_financeiro")
    .select("id, unidade_id, ano, mes")
    .eq("condominio_id", condominioId)
    .in("unidade_id", unidadeIds);
  if (fetchError) throw fetchError;

  const existentePorChave = new Map<string, string>();
  for (const row of existentes ?? []) {
    existentePorChave.set(`${row.unidade_id}-${row.ano}-${row.mes}`, row.id);
  }

  const paraAtualizar: string[] = [];
  const paraCriar: { condominio_id: string; unidade_id: string; ano: number; mes: number; status: "pago"; valor: number }[] = [];

  for (const [unidadeId, competencias] of competenciasPorUnidade) {
    for (const competencia of competencias) {
      const [ano, mes] = competencia.split("-").map(Number);
      const chave = `${unidadeId}-${ano}-${mes}`;
      const existenteId = existentePorChave.get(chave);
      const cobranca = cobrancas.find((c) => c.unidade_id === unidadeId && c.competencia_ano === ano && c.competencia_mes === mes);
      const valor = cobranca
        ? cobranca.valor_taxa_condominio + cobranca.valor_fundo_reserva + cobranca.valor_fundo_obras + cobranca.valor_outros
        : 0;
      if (existenteId) {
        paraAtualizar.push(existenteId);
      } else {
        paraCriar.push({ condominio_id: condominioId, unidade_id: unidadeId, ano, mes, status: "pago", valor });
      }
    }
  }

  if (paraAtualizar.length > 0) {
    const { error } = await supabase.from("historico_financeiro").update({ status: "pago" }).in("id", paraAtualizar);
    if (error) throw error;
  }
  if (paraCriar.length > 0) {
    const { error } = await supabase.from("historico_financeiro").insert(paraCriar);
    if (error) throw error;
  }

  return { inseridas: count ?? 0 };
}

/** Total de Fundo de Obras arrecadado (todas as importações), via função SECURITY DEFINER — não expõe a tabela crua. */
export async function fetchFundoObrasTotal(condominioId: string) {
  const { data, error } = await supabase.rpc("fundo_obras_total", { p_condominio_id: condominioId });
  if (error) throw error;
  return (data as number) ?? 0;
}
