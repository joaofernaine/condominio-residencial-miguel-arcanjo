/**
 * Pré-cadastro de visitantes / locação temporária (Airbnb) — camada de dados.
 * Tabela: visitantes.
 *
 * `pessoas` e `placas` são colunas jsonb novas. Registros anteriores a essa
 * feature têm as duas colunas null ("modo legado") — use os derivadores
 * `pessoasDoVisitante`/`placasDoVisitante` para ler, nunca acesse `v.pessoas`
 * ou `v.placas` diretamente na UI.
 */
import { supabase } from "@/lib/supabase";

export type VisitanteStatus = "pendente" | "aprovado" | "recusado";
export type VisitanteTipo = "visita" | "airbnb";

export type VisitantePessoa = { nome: string; cpf: string | null };

export type VisitanteRow = {
  id: string;
  condominio_id: string;
  morador_id: string;
  nome_visitante: string;
  cpf: string | null;
  placa_veiculo: string | null;
  data_entrada: string;
  data_saida: string;
  observacoes: string | null;
  status: VisitanteStatus;
  motivo_recusa: string | null;
  created_at: string;
  tipo_visita: VisitanteTipo | null;
  acompanhantes: number | null;
  pessoas: VisitantePessoa[] | null;
  placas: string[] | null;
};

export type VisitanteComMorador = VisitanteRow & {
  morador: { nome_completo: string; unidade: string } | null;
};

export const MIN_PESSOAS = 1;
export const MAX_PESSOAS = 8;
export const MIN_CARROS = 0;
export const MAX_CARROS = 2;

export const STATUS_LABEL: Record<VisitanteStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

export const STATUS_CLASS: Record<VisitanteStatus, string> = {
  pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  aprovado: "bg-green-100 text-green-800 border-green-200",
  recusado: "bg-red-100 text-red-800 border-red-200",
};

// ---------- Derivadores de compatibilidade ----------

/** Lista de pessoas, com fallback para o registro legado (nome_visitante/cpf). */
export function pessoasDoVisitante(v: VisitanteRow): VisitantePessoa[] {
  if (Array.isArray(v.pessoas) && v.pessoas.length > 0) return v.pessoas;
  return [{ nome: v.nome_visitante, cpf: v.cpf }];
}

/** Lista de placas, com fallback para o registro legado (placa_veiculo). */
export function placasDoVisitante(v: VisitanteRow): string[] {
  if (Array.isArray(v.placas)) return v.placas;
  return v.placa_veiculo ? [v.placa_veiculo] : [];
}

// ---------- Máscaras e validadores ----------

export function maskCpf(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function cpfDigits(masked: string): string {
  return masked.replace(/\D/g, "");
}

/** Valida CPF por dígito verificador (mod-11). Rejeita sequências repetidas. */
export function isCpfValido(masked: string): boolean {
  const d = cpfDigits(masked);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const dv = (len: number) => {
    let soma = 0;
    for (let i = 0; i < len; i++) soma += Number(d[i]) * (len + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

export function maskPlaca(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
}

// Mercosul (ABC1D23) e formato antigo (ABC1234): a 5ª posição aceita dígito
// ou letra A-J (restrição real do padrão Mercosul).
const RE_PLACA = /^[A-Z]{3}[0-9][0-9A-J][0-9]{2}$/;

export function isPlacaValida(placa: string): boolean {
  return RE_PLACA.test(placa);
}

export function fmtDataBr(v: string): string {
  if (!v) return "—";
  const [y, m, d] = v.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

// ---------- CRUD ----------

export async function fetchVisitantesDoMorador(moradorId: string) {
  const { data, error } = await supabase
    .from("visitantes")
    .select("*")
    .eq("morador_id", moradorId)
    .order("data_entrada", { ascending: false });
  if (error) throw error;
  return (data ?? []) as VisitanteRow[];
}

export async function fetchVisitantesDoCondominio(condominioId: string) {
  const { data, error } = await supabase
    .from("visitantes")
    .select("*, morador:profiles(nome_completo, unidade)")
    .eq("condominio_id", condominioId)
    .order("data_entrada", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as VisitanteComMorador[];
}

export async function criarVisitante(input: {
  condominio_id: string;
  morador_id: string;
  tipo: VisitanteTipo;
  pessoas: VisitantePessoa[];
  placas: string[];
  data_entrada: string;
  data_saida: string;
  observacoes: string | null;
}) {
  const primeira = input.pessoas[0];
  const { error } = await supabase.from("visitantes").insert({
    condominio_id: input.condominio_id,
    morador_id: input.morador_id,
    tipo_visita: input.tipo,
    pessoas: input.pessoas,
    placas: input.placas,
    // Colunas legadas, denormalizadas para compatibilidade.
    nome_visitante: primeira.nome,
    cpf: primeira.cpf,
    placa_veiculo: input.placas[0] ?? null,
    acompanhantes: input.pessoas.length - 1,
    data_entrada: input.data_entrada,
    data_saida: input.data_saida,
    observacoes: input.observacoes,
    status: "pendente" as VisitanteStatus,
  });
  if (error) throw error;
}

export async function deletarVisitante(id: string) {
  const { error } = await supabase.from("visitantes").delete().eq("id", id);
  if (error) throw error;
}

export async function atualizarStatusVisitante(
  id: string,
  status: VisitanteStatus,
  motivo_recusa?: string | null,
) {
  const { error } = await supabase
    .from("visitantes")
    .update({ status, motivo_recusa: motivo_recusa ?? null })
    .eq("id", id);
  if (error) throw error;
}

// ---------- Pessoas frequentes ----------
// Atalho para o morador salvar nome+CPF de quem visita com regularidade
// (mãe, pai, irmão) e reaproveitar no cadastro sem redigitar. Lista privada
// por morador — RLS bloqueia acesso de outros moradores e da síndica.

export type PessoaFrequente = {
  id: string;
  condominio_id: string;
  morador_id: string;
  nome: string;
  cpf: string;
  created_at: string;
};

export async function fetchPessoasFrequentes(moradorId: string) {
  const { data, error } = await supabase
    .from("pessoas_frequentes")
    .select("*")
    .eq("morador_id", moradorId)
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PessoaFrequente[];
}

export async function salvarPessoaFrequente(input: {
  condominio_id: string;
  morador_id: string;
  nome: string;
  cpf: string;
}) {
  const { error } = await supabase
    .from("pessoas_frequentes")
    .upsert(input, { onConflict: "morador_id,cpf" });
  if (error) throw error;
}

export async function deletarPessoaFrequente(id: string) {
  const { error } = await supabase.from("pessoas_frequentes").delete().eq("id", id);
  if (error) throw error;
}
