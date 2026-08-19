import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, FileUp, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  confirmarImportacaoPagamentos,
  fetchFundoObrasTotal,
  fetchMoradoresParaImportacao,
  fetchNossosNumerosJaImportados,
  salvarCodigoRelatorioExterno,
  type PagamentoImportadoInput,
} from "@/lib/portal-data";
import { parseRelatorioPagantes, type CobrancaImportada } from "@/lib/relatorio-pagantes-parser";

const MONTH_NAMES_PT_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type Morador = { id: string; nome_completo: string; unidade: string; codigo_relatorio_externo: string | null };

type Grupo = {
  codigoUnidade: string;
  cobrancas: CobrancaImportada[];
  moradorId: string | null;
};

function brDateToIso(dataCredito: string): string | null {
  const m = dataCredito.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function formatMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ImportarRelatorioDialog({
  open,
  onOpenChange,
  condominioId,
  meuProfileId,
  onImportado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condominioId: string;
  meuProfileId: string;
  onImportado: () => void;
}) {
  const [etapa, setEtapa] = useState<"upload" | "revisao" | "sucesso">("upload");
  const [processando, setProcessando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [linhasNaoReconhecidas, setLinhasNaoReconhecidas] = useState<string[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [jaImportados, setJaImportados] = useState<Set<string>>(new Set());
  const [resumo, setResumo] = useState<{ novas: number; fundoObras: number } | null>(null);

  const reset = () => {
    setEtapa("upload");
    setProcessando(false);
    setConfirmando(false);
    setLinhasNaoReconhecidas([]);
    setGrupos([]);
    setMoradores([]);
    setJaImportados(new Set());
    setResumo(null);
  };

  const handleFile = async (file: File) => {
    setProcessando(true);
    try {
      const [{ cobrancas, linhasNaoReconhecidas: naoReconhecidas }, listaMoradores] = await Promise.all([
        parseRelatorioPagantes(file),
        fetchMoradoresParaImportacao(condominioId),
      ]);

      if (cobrancas.length === 0) {
        toast.error("Nenhuma cobrança reconhecida nesse PDF. Confere se é o relatório certo.");
        setProcessando(false);
        return;
      }

      const jaImportadosSet = await fetchNossosNumerosJaImportados(
        condominioId,
        cobrancas.map((c) => c.nossoNumero).filter((n) => n !== "-"),
      );

      const porCodigo = new Map<string, CobrancaImportada[]>();
      for (const c of cobrancas) {
        if (!porCodigo.has(c.codigoUnidade)) porCodigo.set(c.codigoUnidade, []);
        porCodigo.get(c.codigoUnidade)!.push(c);
      }

      const novosGrupos: Grupo[] = Array.from(porCodigo.entries()).map(([codigoUnidade, lista]) => {
        const matchExato = listaMoradores.find((m) => m.codigo_relatorio_externo === codigoUnidade);
        return { codigoUnidade, cobrancas: lista, moradorId: matchExato?.id ?? null };
      });
      novosGrupos.sort((a, b) => a.codigoUnidade.localeCompare(b.codigoUnidade));

      setMoradores(listaMoradores);
      setGrupos(novosGrupos);
      setJaImportados(jaImportadosSet);
      setLinhasNaoReconhecidas(naoReconhecidas);
      setEtapa("revisao");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao ler o PDF. Confere se o arquivo não está corrompido.");
    } finally {
      setProcessando(false);
    }
  };

  const totalFundoObrasNaLeva = useMemo(
    () =>
      grupos
        .flatMap((g) => g.cobrancas)
        .filter((c) => !jaImportados.has(c.nossoNumero))
        .reduce((acc, c) => acc + c.valorFundoObras, 0),
    [grupos, jaImportados],
  );

  const totalCobrancasNovas = useMemo(
    () => grupos.flatMap((g) => g.cobrancas).filter((c) => !jaImportados.has(c.nossoNumero)).length,
    [grupos, jaImportados],
  );

  const gruposSemMatch = grupos.filter((g) => !g.moradorId && g.cobrancas.some((c) => !jaImportados.has(c.nossoNumero))).length;
  const algumMatched = grupos.some((g) => g.moradorId);

  const handleConfirmar = async () => {
    setConfirmando(true);
    try {
      for (const g of grupos) {
        if (!g.moradorId) continue;
        const morador = moradores.find((m) => m.id === g.moradorId);
        if (morador && morador.codigo_relatorio_externo !== g.codigoUnidade) {
          await salvarCodigoRelatorioExterno(g.moradorId, g.codigoUnidade);
        }
      }

      const input: PagamentoImportadoInput[] = grupos
        .filter((g) => g.moradorId)
        .flatMap((g) =>
          g.cobrancas
            .filter((c) => !jaImportados.has(c.nossoNumero))
            .map((c) => ({
              condominio_id: condominioId,
              unidade_id: g.moradorId as string,
              competencia_ano: c.competenciaAno,
              competencia_mes: c.competenciaMes,
              nosso_numero: c.nossoNumero,
              valor_taxa_condominio: c.valorTaxaCondominio,
              valor_fundo_reserva: c.valorFundoReserva,
              valor_fundo_obras: c.valorFundoObras,
              valor_outros: c.valorOutros,
              data_credito: brDateToIso(c.dataCredito),
              importado_por: meuProfileId,
            })),
        );

      await confirmarImportacaoPagamentos(condominioId, input);
      const total = await fetchFundoObrasTotal(condominioId);
      setResumo({ novas: input.length, fundoObras: total });
      setEtapa("sucesso");
      onImportado();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao confirmar a importação.");
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-h-[85vh] w-[95vw] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Importar relatório financeiro</DialogTitle>
          <DialogDescription>
            Sobe o PDF "Relatório dos pagantes" da administradora — o sistema lê quem pagou e atualiza
            sozinho.
          </DialogDescription>
        </DialogHeader>

        {etapa === "upload" && (
          <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
            {processando ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Lendo o PDF…</p>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-3">
                <FileUp className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">Clique para escolher o PDF</span>
                <span className="text-xs text-muted-foreground">Só arquivos com texto selecionável (não escaneados)</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </label>
            )}
          </div>
        )}

        {etapa === "revisao" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
              <span>
                <strong>{totalCobrancasNovas}</strong> cobranças novas
              </span>
              <span className="text-muted-foreground">·</span>
              <span>
                Fundo de Obras nesta leva: <strong>{formatMoeda(totalFundoObrasNaLeva)}</strong>
              </span>
              {jaImportados.size > 0 && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{jaImportados.size} já importadas antes (ignoradas)</span>
                </>
              )}
            </div>

            {linhasNaoReconhecidas.length > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 p-3 text-xs text-[color:var(--gold)]">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div>
                  <p className="font-semibold">{linhasNaoReconhecidas.length} linha(s) do PDF não reconhecidas</p>
                  <p className="mt-1 text-muted-foreground">Não entram na importação. Confere se não é nada importante.</p>
                </div>
              </div>
            )}

            {gruposSemMatch > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div>
                  <p className="font-semibold">{gruposSemMatch} unidade(s) sem morador selecionado</p>
                  <p className="mt-1 text-muted-foreground">Vão ficar de fora dessa importação — dá pra confirmar assim mesmo e resolver essas depois numa próxima importação.</p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border">
              <ul className="divide-y divide-border">
                {grupos.map((g) => {
                  const novas = g.cobrancas.filter((c) => !jaImportados.has(c.nossoNumero));
                  const competencias = novas.map((c) => `${MONTH_NAMES_PT_SHORT[c.competenciaMes - 1]}/${c.competenciaAno}`);
                  const totalGrupo = novas.reduce((acc, c) => acc + c.valorTotal, 0);
                  const nomeNoRelatorio = g.cobrancas[0]?.nomeCondomino ?? "";
                  return (
                    <li key={g.codigoUnidade} className="flex flex-wrap items-center gap-3 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-semibold">{g.codigoUnidade}</p>
                        <p className="truncate text-xs text-muted-foreground">{nomeNoRelatorio}</p>
                        {novas.length > 0 && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {competencias.join(", ")} · {formatMoeda(totalGrupo)}
                          </p>
                        )}
                      </div>
                      <Select value={g.moradorId ?? undefined} onValueChange={(v) => setGrupos((prev) => prev.map((x) => (x.codigoUnidade === g.codigoUnidade ? { ...x, moradorId: v } : x)))}>
                        <SelectTrigger className={`w-[220px] ${!g.moradorId ? "border-destructive/50" : ""}`}>
                          <SelectValue placeholder="Selecionar morador…" />
                        </SelectTrigger>
                        <SelectContent>
                          {moradores.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.nome_completo} ({m.unidade})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {etapa === "sucesso" && resumo && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-[color:var(--sage)]/30 bg-[color:var(--sage)]/10 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-[color:var(--sage)]" />
            <p className="font-semibold">Importação concluída</p>
            <p className="text-sm text-muted-foreground">
              {resumo.novas} {resumo.novas === 1 ? "cobrança nova registrada" : "cobranças novas registradas"}. Fundo de Obras arrecadado no total: <strong>{formatMoeda(resumo.fundoObras)}</strong>.
            </p>
          </div>
        )}

        <DialogFooter>
          {etapa === "revisao" && (
            <Button onClick={handleConfirmar} disabled={!algumMatched || confirmando || totalCobrancasNovas === 0} className="rounded-full">
              {confirmando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Confirmar importação
            </Button>
          )}
          {etapa === "sucesso" && (
            <Button
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
              className="rounded-full"
            >
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
