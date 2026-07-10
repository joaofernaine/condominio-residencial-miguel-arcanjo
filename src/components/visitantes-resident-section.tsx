import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Car, Loader2, Plus, Trash2, User, UserCheck, Users } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
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
import type { Profile } from "@/lib/portal-data";

export type VisitanteStatus = "pendente" | "aprovado" | "recusado";
export type VisitanteTipo = "visita" | "airbnb";

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
};

const STATUS_LABEL: Record<VisitanteStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

const STATUS_CLASS: Record<VisitanteStatus, string> = {
  pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  aprovado: "bg-green-100 text-green-800 border-green-200",
  recusado: "bg-red-100 text-red-800 border-red-200",
};

function maskCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function fmtDate(v: string) {
  if (!v) return "—";
  const [y, m, d] = v.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

export function VisitantesResidentSection({ profile }: { profile: Profile }) {
  const [items, setItems] = useState<VisitanteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("visitantes")
        .select("*")
        .eq("morador_id", profile.id)
        .order("data_entrada", { ascending: false });
      if (error) throw error;
      setItems((data ?? []) as VisitanteRow[]);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar visitantes.");
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este pré-cadastro?")) return;
    try {
      const { error } = await supabase.from("visitantes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Visitante removido.");
      reload();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover.");
    }
  };

  return (
    <section className="border-t border-border bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <UserCheck className="h-3.5 w-3.5" /> Portaria
            </span>
            <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">Meus visitantes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pré-cadastre visitantes para agilizar a entrada na portaria.
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Cadastrar visitante
          </Button>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
              Nenhum visitante cadastrado.
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {items.map((v) => {
                const isAirbnb = v.tipo_visita === "airbnb";
                return (
                  <li key={v.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <User className="h-4 w-4 shrink-0 text-primary" />
                          <p className="truncate font-medium">{v.nome_visitante}</p>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              isAirbnb
                                ? "border-purple-200 bg-purple-100 text-purple-800"
                                : "border-border bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {isAirbnb ? "Airbnb" : "Visita"}
                          </span>
                          {isAirbnb && (v.acompanhantes ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-800">
                              <Users className="h-3 w-3" /> {v.acompanhantes} acompanhantes
                            </span>
                          )}
                        </div>
                        {v.cpf && (
                          <p className="mt-0.5 text-xs text-muted-foreground">CPF: {v.cpf}</p>
                        )}
                        {v.placa_veiculo && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Car className="h-3 w-3" /> {v.placa_veiculo}
                          </p>
                        )}
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {fmtDate(v.data_entrada)} → {fmtDate(v.data_saida)}
                        </p>
                        {v.observacoes && (
                          <p className="mt-2 text-xs text-muted-foreground">{v.observacoes}</p>
                        )}
                        {v.status === "recusado" && v.motivo_recusa && (
                          <p className="mt-2 rounded-md bg-destructive/5 px-2.5 py-1.5 text-[11px] text-destructive">
                            Motivo: {v.motivo_recusa}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_CLASS[v.status]}`}
                        >
                          {STATUS_LABEL[v.status]}
                        </span>
                        {(v.status === "pendente" || v.status === "recusado") && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(v.id)}
                            aria-label="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <NewVisitanteDialog
        open={open}
        onOpenChange={setOpen}
        profile={profile}
        onCreated={reload}
      />
    </section>
  );
}

function NewVisitanteDialog({
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
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [placa, setPlaca] = useState("");
  const [acompanhantes, setAcompanhantes] = useState<number>(0);
  const [dataEntrada, setDataEntrada] = useState("");
  const [dataSaida, setDataSaida] = useState("");
  const [obs, setObs] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setTipo("visita");
    setNome("");
    setCpf("");
    setPlaca("");
    setAcompanhantes(0);
    setDataEntrada("");
    setDataSaida("");
    setObs("");
  };

  useEffect(() => {
    if (!open) {
      resetForm();
      setSuccess(false);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return toast.error("Informe o nome do responsável.");
    if (!dataEntrada || !dataSaida) return toast.error("Informe as datas de entrada e saída.");
    if (dataSaida < dataEntrada) return toast.error("Data de saída não pode ser anterior à entrada.");
    setBusy(true);
    try {
      const { error } = await supabase.from("visitantes").insert({
        condominio_id: profile.condominio_id,
        morador_id: profile.id,
        nome_visitante: nome.trim(),
        cpf: cpf.trim() || null,
        placa_veiculo: placa.trim() || null,
        data_entrada: dataEntrada,
        data_saida: dataSaida,
        observacoes: obs.trim() || null,
        status: "pendente",
        tipo_visita: tipo,
        acompanhantes: tipo === "airbnb" ? Math.max(0, Number(acompanhantes) || 0) : 0,
      });
      if (error) throw error;
      toast.success("Visitante cadastrado. Aguarde aprovação.");
      onCreated();
      setSuccess(true);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao cadastrar visitante.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar visitante</DialogTitle>
          <DialogDescription>
            Cadastre cada visitante individualmente para controle de entrada.
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
          <form onSubmit={submit} className="space-y-3">
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
            <div>
              <Label htmlFor="v-nome">
                {tipo === "airbnb" ? "Nome do responsável *" : "Nome do visitante *"}
              </Label>
              <Input id="v-nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="v-cpf">{tipo === "airbnb" ? "CPF do responsável" : "CPF"}</Label>
                <Input
                  id="v-cpf"
                  value={cpf}
                  onChange={(e) => setCpf(maskCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                />
              </div>
              <div>
                <Label htmlFor="v-placa">Placa do veículo</Label>
                <Input
                  id="v-placa"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  placeholder="ABC1D23"
                  maxLength={10}
                />
              </div>
            </div>
            {tipo === "airbnb" && (
              <div>
                <Label htmlFor="v-acomp">Quantas pessoas acompanham?</Label>
                <Input
                  id="v-acomp"
                  type="number"
                  min={0}
                  value={acompanhantes}
                  onChange={(e) => setAcompanhantes(Math.max(0, Number(e.target.value) || 0))}
                />
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
