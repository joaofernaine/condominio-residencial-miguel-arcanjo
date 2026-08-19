/**
 * Parser do "Relatório dos pagantes" que a administradora envia em PDF
 * todo mês (Listagem de cobranças c/ Data de Crédito). Lê no navegador
 * via pdfjs-dist, sem passar pelo servidor.
 *
 * Formato observado (validado contra um relatório real de 80 cobranças):
 * cada cobrança é uma linha "código-bloco / nome ... competência
 * vencimento data.cred nosso_número valor" seguida de sub-linhas
 * "rótulo valor" (Fundo de Reserva / Taxa de Condominio / Fundo de
 * Obras / outros). O código da unidade (ex. "101B") é a parte antes do
 * primeiro " / " — o resto da linha varia bastante (nome às vezes
 * repete o código, às vezes não) por isso os campos são extraídos da
 * direita pra esquerda (valor, nosso número, data, vencimento,
 * competência) em vez de um único regex rígido.
 */

export type CobrancaImportada = {
  codigoUnidade: string;
  nomeCondomino: string;
  competenciaMes: number;
  competenciaAno: number;
  vencimento: string;
  dataCredito: string;
  nossoNumero: string;
  valorTotal: number;
  valorFundoReserva: number;
  valorTaxaCondominio: number;
  valorFundoObras: number;
  valorOutros: number;
};

export type ParseRelatorioResult = {
  cobrancas: CobrancaImportada[];
  linhasNaoReconhecidas: string[];
};

const LABEL_TO_CATEGORIA: Record<string, "fundoReserva" | "taxaCondominio" | "fundoObras"> = {
  "Fundo de Reserva": "fundoReserva",
  "Taxa de Condominio": "taxaCondominio",
  "Fundo de Obras": "fundoObras",
};

const LABELS_OUTROS = ["Recebimento de Boleto", "Recebimento de Multa/juro", "Manut. teto casa zelador"];

const IGNORAR_PREFIXOS = [
  "CONDOMÍNIO",
  "Listagem",
  "Detalhar",
  "Unidade / Condômino",
  "Escritório Gestão",
  "Página:",
];

const STOP_MARKERS = ["Valor total das cobranças:", "Quantidade total de cobranças:", "Totalizador das contas"];

function parseValorBR(s: string): number {
  return Number(s.replace(/\./g, "").replace(",", "."));
}

type LinhaItem = { x: number; y: number; str: string };

/** Reconstrói as linhas visuais de uma página a partir dos itens de texto posicionados do pdfjs. */
function reconstruirLinhas(items: LinhaItem[]): string[] {
  const ordenados = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const clusters: { y: number; items: LinhaItem[] }[] = [];
  for (const item of ordenados) {
    const ultimo = clusters[clusters.length - 1];
    // Itens da mesma linha visual podem ter baselines com até ~2pt de
    // diferença; linhas distintas ficam ~12-16pt separadas.
    if (ultimo && Math.abs(ultimo.y - item.y) <= 3) {
      ultimo.items.push(item);
    } else {
      clusters.push({ y: item.y, items: [item] });
    }
  }
  return clusters
    .map((c) =>
      c.items
        .sort((a, b) => a.x - b.x)
        .map((i) => i.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

function parseLinhaCobranca(linha: string): Omit<CobrancaImportada, "valorFundoReserva" | "valorTaxaCondominio" | "valorFundoObras" | "valorOutros"> | null {
  const prefixo = linha.match(/^([A-Za-z0-9]+)-([A-Za-z])\s*\/\s*(.*)$/);
  if (!prefixo) return null;
  const codigoUnidade = prefixo[1];
  let resto = prefixo[3].trim();

  const valorMatch = resto.match(/([\d.,]+)\s*$/);
  if (!valorMatch) return null;
  const valorTotal = parseValorBR(valorMatch[1]);
  resto = resto.slice(0, valorMatch.index).trim();

  const nossoNumeroMatch = resto.match(/(\d+|-)\s*$/);
  if (!nossoNumeroMatch) return null;
  const nossoNumero = nossoNumeroMatch[1];
  resto = resto.slice(0, nossoNumeroMatch.index).trim();

  const dataCredMatch = resto.match(/(\d{2}\/\d{2}\/\d{4}|-)\s*$/);
  if (!dataCredMatch) return null;
  const dataCredito = dataCredMatch[1];
  resto = resto.slice(0, dataCredMatch.index).trim();

  const vencimentoMatch = resto.match(/(\d{2}\/\d{2}\/\d{4})\s*$/);
  if (!vencimentoMatch) return null;
  const vencimento = vencimentoMatch[1];
  resto = resto.slice(0, vencimentoMatch.index).trim();

  const competenciaMatch = resto.match(/(\d{2})\/(\d{4})\s*$/);
  if (!competenciaMatch) return null;
  const competenciaMes = parseInt(competenciaMatch[1], 10);
  const competenciaAno = parseInt(competenciaMatch[2], 10);
  resto = resto.slice(0, competenciaMatch.index).trim();

  return {
    codigoUnidade,
    nomeCondomino: resto,
    competenciaMes,
    competenciaAno,
    vencimento,
    dataCredito,
    nossoNumero,
    valorTotal,
  };
}

function parseSubLinha(linha: string): { categoria: "fundoReserva" | "taxaCondominio" | "fundoObras" | "outros"; valor: number } | null {
  const m = linha.match(/^(.+?)\s+([\d.,]+)\s*$/);
  if (!m) return null;
  const label = m[1].trim();
  const categoria = LABEL_TO_CATEGORIA[label];
  if (!categoria && !LABELS_OUTROS.includes(label)) return null;
  return { categoria: categoria ?? "outros", valor: parseValorBR(m[2]) };
}

/** Lê o PDF de um File (upload no navegador) e extrai as cobranças. */
export async function parseRelatorioPagantes(file: File): Promise<ParseRelatorioResult> {
  const pdfjsLib = await import("pdfjs-dist");
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;

  let todasLinhas: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const items: LinhaItem[] = content.items
      .filter((i): i is typeof i & { str: string; transform: number[] } => "str" in i && "transform" in i)
      .map((i) => ({ x: i.transform[4], y: i.transform[5], str: i.str }));
    todasLinhas = todasLinhas.concat(reconstruirLinhas(items));
  }

  const cobrancas: CobrancaImportada[] = [];
  const linhasNaoReconhecidas: string[] = [];
  let atual: CobrancaImportada | null = null;

  for (const linha of todasLinhas) {
    if (STOP_MARKERS.some((m) => linha.startsWith(m))) break;

    const cobranca = parseLinhaCobranca(linha);
    if (cobranca) {
      atual = { ...cobranca, valorFundoReserva: 0, valorTaxaCondominio: 0, valorFundoObras: 0, valorOutros: 0 };
      cobrancas.push(atual);
      continue;
    }

    if (/^\d+\s+de\s+\d+$/i.test(linha)) continue; // marcador de página "2 de 10"
    if (/^Parc\.\s*\d+\/\d+$/i.test(linha)) continue; // marcador de parcelamento
    if (IGNORAR_PREFIXOS.some((p) => linha.startsWith(p))) continue;

    const sub = parseSubLinha(linha);
    if (sub && atual) {
      if (sub.categoria === "fundoReserva") atual.valorFundoReserva += sub.valor;
      else if (sub.categoria === "taxaCondominio") atual.valorTaxaCondominio += sub.valor;
      else if (sub.categoria === "fundoObras") atual.valorFundoObras += sub.valor;
      else atual.valorOutros += sub.valor;
      continue;
    }

    linhasNaoReconhecidas.push(linha);
  }

  return { cobrancas, linhasNaoReconhecidas };
}
