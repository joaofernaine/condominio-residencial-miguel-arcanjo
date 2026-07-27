import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Car, Loader2, Plus, Star, Trash2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  MAX_CARROS,
  MAX_PESSOAS,
  MIN_CARROS,
  MIN_PESSOAS,
  criarVisitante,
  cpfDigits,
  deletarPessoaFrequente,
  fetchPessoasFrequentes,
  isCpfValido,
  isPlacaValida,
  maskCpf,
  maskPlaca,
  salvarPessoaFrequente,
  type PessoaFrequente,
  type VisitanteTipo,
} from "@/lib/visitantes-data";
import type { Profile } from "@/lib/portal-data";

type PessoaDraft = { key: string; nome: string; cpf: string; salvar: boolean };
type PlacaDraft = { key: string; placa: string };

const novaKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const novaPessoa = (): PessoaDraft => ({ key: novaKey(), nome: "", cpf: "", salvar: false });
const novaPlaca = (): PlacaDraft => ({ key: novaKey(), placa: "" });

function EscolherPessoaSalvaButton({
  salvas,
  onEscolher,
  onApagar,
}: {
  salvas: PessoaFrequente[];
  onEscolher: (p: PessoaFrequente) => void;
  onApagar: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" size="icon" variant="ghost" aria-label="Escolher pessoa salva">
          <Star className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 max-w-[calc(100vw-2rem)] p-0" align="end">
        <Command>
          <CommandInput placeholder="Buscar pessoa salva..." />
          <CommandList className="max-h-64">
            <CommandEmpty>Nenhuma pessoa salva ainda.</CommandEmpty>
            {salvas.map((s) => (
              <CommandItem
                key={s.id}
                value={s.nome}
                onSelect={() => {
                  onEscolher(s);
                  setOpen(false);
                }}
                className="flex items-center justify-between gap-2"
              >
                <span className="min-w-0 truncate">
                  {s.nome} — {s.cpf}
                </span>
                <button
                  type="button"
                  aria-label={`Apagar ${s.nome} da lista de salvas`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onApagar(s.id);
                  }}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function NovoVisitanteDialog({
  open,
  onOpenChange,
  profile,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: Profile;
  onCreated: () => void;
}) {
  const [tipo, setTipo] = useState<VisitanteTipo>("visita");
  const [pessoas, setPessoas] = useState<PessoaDraft[]>(() => [novaPessoa()]);
  const [placas, setPlacas] = useState<PlacaDraft[]>([]);
  const [dataEntrada, setDataEntrada] = useState("");
  const [dataSaida, setDataSaida] = useState("");
  const [obs, setObs] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [salvas, setSalvas] = useState<PessoaFrequente[]>([]);

  const resetForm = () => {
    setTipo("visita");
    setPessoas([novaPessoa()]);
    setPlacas([]);
    setDataEntrada("");
    setDataSaida("");
    setObs("");
  };

  useEffect(() => {
    // Reseta ao ABRIR (não ao fechar): se o dialog fechar e reabrir muito
    // rápido, o toggle fechar->abrir pode cair no mesmo lote de render do
    // React e o efeito de "!open" não chega a rodar a tempo, reabrindo com a
    // tela de sucesso ou os dados da pessoa anterior ainda visíveis.
    // Resetar no rising edge garante formulário limpo toda vez que o dialog
    // fica visível, sem depender de capturar a transição de fechamento.
    if (open) {
      resetForm();
      setSuccess(false);
      fetchPessoasFrequentes(profile.id)
        .then(setSalvas)
        .catch(() => {});
    }
  }, [open]);

  const setQuantidadePessoas = (n: number) => {
    if (n === pessoas.length) return;
    if (n > pessoas.length) {
      const extras = Array.from({ length: n - pessoas.length }, novaPessoa);
      setPessoas((prev) => [...prev, ...extras]);
      return;
    }
    const removidas = pessoas.slice(n);
    const temDados = removidas.some((p) => p.nome.trim() || p.cpf.trim());
    if (
      temDados &&
      !confirm(
        `As últimas ${removidas.length} pessoa(s) já têm dados preenchidos. Remover mesmo assim?`,
      )
    ) {
      return;
    }
    setPessoas((prev) => prev.slice(0, n));
  };

  const setQuantidadeCarros = (n: number) => {
    if (n === placas.length) return;
    if (n > placas.length) {
      const extras = Array.from({ length: n - placas.length }, novaPlaca);
      setPlacas((prev) => [...prev, ...extras]);
      return;
    }
    const removidas = placas.slice(n);
    const temDados = removidas.some((p) => p.placa.trim());
    if (
      temDados &&
      !confirm(
        `As últimas ${removidas.length} placa(s) já foram preenchidas. Remover mesmo assim?`,
      )
    ) {
      return;
    }
    setPlacas((prev) => prev.slice(0, n));
  };

  const updatePessoa = (key: string, patch: Partial<PessoaDraft>) =>
    setPessoas((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  const removerPessoa = (key: string) =>
    setPessoas((prev) => (prev.length <= MIN_PESSOAS ? prev : prev.filter((p) => p.key !== key)));

  const updatePlaca = (key: string, placa: string) =>
    setPlacas((prev) => prev.map((p) => (p.key === key ? { ...p, placa } : p)));

  const removerPlaca = (key: string) =>
    setPlacas((prev) => prev.filter((p) => p.key !== key));

  const escolherSalva = (key: string, pessoa: PessoaFrequente) =>
    updatePessoa(key, { nome: pessoa.nome, cpf: pessoa.cpf });

  const apagarSalva = async (id: string) => {
    try {
      await deletarPessoaFrequente(id);
      setSalvas((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao apagar pessoa salva.");
    }
  };

  const focarCampo = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ block: "center" });
    (el as HTMLElement | null)?.focus();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (let i = 0; i < pessoas.length; i++) {
      const p = pessoas[i];
      if (!p.nome.trim() || p.nome.trim().length < 3) {
        focarCampo(`v-pessoa-${i}-nome`);
        return toast.error(`Informe o nome completo da pessoa ${i + 1}.`);
      }
      if (!isCpfValido(p.cpf)) {
        focarCampo(`v-pessoa-${i}-cpf`);
        return toast.error(`CPF inválido na pessoa ${i + 1}.`);
      }
    }
    const cpfsVistos = new Set<string>();
    for (let i = 0; i < pessoas.length; i++) {
      const d = cpfDigits(pessoas[i].cpf);
      if (cpfsVistos.has(d)) {
        focarCampo(`v-pessoa-${i}-cpf`);
        return toast.error(`O CPF da pessoa ${i + 1} está repetido.`);
      }
      cpfsVistos.add(d);
    }

    for (let i = 0; i < placas.length; i++) {
      if (!isPlacaValida(placas[i].placa)) {
        focarCampo(`v-placa-${i}`);
        return toast.error(`Placa ${i + 1} inválida. Use ABC1D23 ou ABC1234.`);
      }
    }
    const placasVistas = new Set<string>();
    for (let i = 0; i < placas.length; i++) {
      if (placasVistas.has(placas[i].placa)) {
        focarCampo(`v-placa-${i}`);
        return toast.error(`A placa ${i + 1} está repetida.`);
      }
      placasVistas.add(placas[i].placa);
    }

    if (!dataEntrada || !dataSaida) return toast.error("Informe as datas de entrada e saída.");
    if (dataSaida < dataEntrada) return toast.error("Data de saída não pode ser anterior à entrada.");

    setBusy(true);
    try {
      await criarVisitante({
        condominio_id: profile.condominio_id,
        morador_id: profile.id,
        tipo,
        pessoas: pessoas.map((p) => ({ nome: p.nome.trim(), cpf: p.cpf })),
        placas: placas.map((p) => p.placa),
        data_entrada: dataEntrada,
        data_saida: dataSaida,
        observacoes: obs.trim() || null,
      });
      toast.success("Visitante cadastrado. Aguarde aprovação.");
      onCreated();
      setSuccess(true);

      const paraSalvar = pessoas.filter((p) => p.salvar);
      if (paraSalvar.length > 0) {
        const resultados = await Promise.allSettled(
          paraSalvar.map((p) =>
            salvarPessoaFrequente({
              condominio_id: profile.condominio_id,
              morador_id: profile.id,
              nome: p.nome.trim(),
              cpf: p.cpf,
            }),
          ),
        );
        if (resultados.some((r) => r.status === "rejected")) {
          toast.error("Não consegui salvar uma das pessoas para próxima vez.");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao cadastrar visitante.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cadastrar visitante</DialogTitle>
          <DialogDescription>
            Informe cada pessoa e cada veículo para agilizar a entrada na portaria.
          </DialogDescription>
        </DialogHeader>
        {success ? (
          <div className="space-y-5 py-4">
            <div className="rounded-xl bg-primary/10 p-4 text-sm text-primary">
              Visitante cadastrado com sucesso. Aguarde aprovação.
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => {
                  resetForm();
                  setSuccess(false);
                }}
              >
                Cadastrar outro visitante
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setSuccess(false);
                }}
              >
                Concluir
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-secondary/40 p-1">
                <button
                  type="button"
                  onClick={() => setTipo("visita")}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    tipo === "visita"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Visita
                </button>
                <button
                  type="button"
                  onClick={() => setTipo("airbnb")}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    tipo === "airbnb"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Airbnb/Temporada
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="v-qtd-pessoas">Quantas pessoas vão entrar?</Label>
                  <Select
                    value={String(pessoas.length)}
                    onValueChange={(v) => setQuantidadePessoas(Number(v))}
                  >
                    <SelectTrigger id="v-qtd-pessoas">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: MAX_PESSOAS - MIN_PESSOAS + 1 }, (_, i) => MIN_PESSOAS + i).map(
                        (n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="v-qtd-carros">Quantos carros vão entrar?</Label>
                  <Select
                    value={String(placas.length)}
                    onValueChange={(v) => setQuantidadeCarros(Number(v))}
                  >
                    <SelectTrigger id="v-qtd-carros">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: MAX_CARROS - MIN_CARROS + 1 }, (_, i) => MIN_CARROS + i).map(
                        (n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                {pessoas.map((p, i) => (
                  <fieldset key={p.key} className="rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <legend className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <User className="h-3.5 w-3.5" /> Pessoa {i + 1}
                      </legend>
                      <div className="flex items-center gap-1">
                        <EscolherPessoaSalvaButton
                          salvas={salvas}
                          onEscolher={(pessoa) => escolherSalva(p.key, pessoa)}
                          onApagar={apagarSalva}
                        />
                        {pessoas.length > MIN_PESSOAS && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removerPessoa(p.key)}
                            aria-label={`Remover pessoa ${i + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <Label htmlFor={`v-pessoa-${i}-nome`}>Nome completo *</Label>
                        <Input
                          id={`v-pessoa-${i}-nome`}
                          value={p.nome}
                          onChange={(e) => updatePessoa(p.key, { nome: e.target.value })}
                          maxLength={120}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`v-pessoa-${i}-cpf`}>CPF *</Label>
                        <Input
                          id={`v-pessoa-${i}-cpf`}
                          value={p.cpf}
                          onChange={(e) => updatePessoa(p.key, { cpf: maskCpf(e.target.value) })}
                          placeholder="000.000.000-00"
                          inputMode="numeric"
                          autoComplete="off"
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Checkbox
                        id={`v-pessoa-${i}-salvar`}
                        checked={p.salvar}
                        onCheckedChange={(v) => updatePessoa(p.key, { salvar: v === true })}
                      />
                      <Label
                        htmlFor={`v-pessoa-${i}-salvar`}
                        className="text-xs font-normal text-muted-foreground"
                      >
                        Salvar para próxima vez
                      </Label>
                    </div>
                  </fieldset>
                ))}
              </div>

              {placas.length > 0 && (
                <div className="space-y-3">
                  {placas.map((p, i) => (
                    <div key={p.key} className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label htmlFor={`v-placa-${i}`}>
                          <span className="flex items-center gap-1.5">
                            <Car className="h-3.5 w-3.5" /> Placa do carro {i + 1} *
                          </span>
                        </Label>
                        <Input
                          id={`v-placa-${i}`}
                          value={p.placa}
                          onChange={(e) => updatePlaca(p.key, maskPlaca(e.target.value))}
                          placeholder="ABC1D23"
                          maxLength={7}
                          autoCapitalize="characters"
                          spellCheck={false}
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removerPlaca(p.key)}
                        aria-label={`Remover placa ${i + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="v-de">Data de entrada *</Label>
                  <Input
                    id="v-de"
                    type="date"
                    value={dataEntrada}
                    onChange={(e) => setDataEntrada(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="v-ds">Data de saída *</Label>
                  <Input
                    id="v-ds"
                    type="date"
                    value={dataSaida}
                    onChange={(e) => setDataSaida(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="v-obs">Observações</Label>
                <Textarea
                  id="v-obs"
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="Ex.: Mudança, aluguel temporário..."
                  rows={3}
                />
              </div>
            <DialogFooter className="sticky bottom-0 -mx-4 -mb-4 border-t border-border bg-background px-4 pb-4 pt-3 sm:-mx-6 sm:-mb-6 sm:px-6 sm:pb-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Cadastrar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
