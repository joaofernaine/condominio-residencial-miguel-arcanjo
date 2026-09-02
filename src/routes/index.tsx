import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Bell,
  Building2,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  FileUp,
  Flame,
  Folder,
  FolderOpen,
  Hammer,
  History,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Maximize2,
  Phone,
  Pencil,
  Plus,

  Search,
  Send,
  Sparkles,
  Store,
  Tag,
  Trash2,
  Upload,
  User,
  Vote,
  ThumbsUp,
  ThumbsDown,
  Wallet,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import heroImage from "@/assets/condo-hero.jpg";
import sobreImage from "@/assets/condo-sobre.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Toaster } from "@/components/ui/sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import {
  type FinancialStatus,
  type ReservationStatus,
  MONTH_NAMES_PT,
  MONTH_NAMES_PT_SHORT,
  RESERVATION_STATUS_STYLES,

} from "@/lib/mocks";
import { Reveal } from "@/components/reveal";
import { useScrollSpy } from "@/hooks/use-scroll-spy";
import { ClassificadosResidentSection } from "@/components/classificados-resident-section";
import { ClassificadosAdminSection } from "@/components/classificados-admin-section";
import { VisitantesResidentSection } from "@/components/visitantes-resident-section";
import { VisitantesAdminSection } from "@/components/visitantes-admin-section";
import { ChamadosResidentSection } from "@/components/chamados-resident-section";
import { ChamadosAdminSection } from "@/components/chamados-admin-section";
import { MensagensExternasAdminSection } from "@/components/mensagens-externas-admin-section";
import { AdminPendenciasBadge } from "@/components/admin-pendencias-badge";
import { ImportarRelatorioDialog } from "@/components/importar-relatorio-dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Shield,
  Waves,
  Gamepad2,
  Trees,
  Dumbbell,
  Car,
  Utensils,
  Flower2,
  Sun,
  Home,
  Users,
  Wifi,
  ParkingCircle,
  PartyPopper,
  Baby,
  Coffee,
} from "lucide-react";
import {
  FlowerLotus,
  Bicycle,
  IdentificationBadge,
  SoccerBall,
  PawPrint,
  Laptop,
  WashingMachine,
  Elevator,
} from "@phosphor-icons/react";
import {
  type Profile,
  type Role,
  type PautaRow,
  type Permissao,
  PERMISSOES_DISPONIVEIS,
  definirPermissoes,
  fetchPermissoesDoProfile,
  type DestinatarioAlerta,
  fetchDestinatariosAlertas,
  definirRecebeAlertas,
  fetchRecebeAlertas,
  type ReservaRow,
  type ReservaComMorador,
  type HistoricoRow,
  type ObraRow,
  type ObraAtualizacaoRow,
  type AmenidadeRow,
  type AvisoPublicoRow,
  type CondominioConfigRow,
  type LoginGuardResult,
  RESERVATION_SPACES,
  RESERVA_DB_TO_UI,
  HISTORICO_DB_TO_UI,
  HISTORICO_UI_TO_DB,
  LANDING_CONDOMINIO_ID,
  fetchProfileByAuthUser,
  markFirstAccessComplete,
  fetchPautasAtivas,
  fetchMeusVotos,
  registrarVoto,
  fetchVotosDePauta,
  fetchReservasDoCondominio,
  fetchMinhasReservas,
  criarReserva,
  aprovarReserva,
  recusarReserva,
  fetchHistoricoCondominio,
  fetchMeuHistorico,
  atualizarHistorico,
  fetchMoradoresDoCondominio,
  fetchFundoObrasTotal,
  fetchObras,
  fetchAtualizacoesObra,
  inserirAtualizacaoObra,
  removerAtualizacaoObra,
  atualizarObra,
  removerObra,
  uploadObraFoto,
  criarObra,
  criarMorador,
  criarFuncionario,
  verificarBloqueioLogin,
  registrarTentativaLogin,
  criarPauta,
  fetchPautasEncerradas,
  encerrarPauta,
  excluirPauta,
  criarBloqueio,
  removerReserva,
  atualizarMorador,
  promoverPara,
  removerMorador,
  fetchOcupacoesCondominio,
  criarHistorico,
  fetchDocumentos,
  fetchAnosDocumentos,
  fetchTiposDocumentos,
  fetchDocumentosFiltrados,
  criarDocumento,
  removerDocumento,
  uploadDocumentoPdf,
  type DocumentoRow,
  type DocumentoTipo,
  type OcupacaoRow,
  fetchCondominioConfig,
  upsertCondominioConfig,
  fetchAmenidades,
  criarAmenidade,
  atualizarAmenidade,
  removerAmenidade,
  fetchAvisosPublicos,
  fetchAvisosPublicosAtivos,
  criarAvisoPublico,
  toggleAvisoPublico,
  removerAvisoPublico,
} from "@/lib/portal-data";

// Mapa de ícones (nome lucide → componente) para amenidades. Chave é o que
// fica salvo em `amenidades.icone`; ver também AMENIDADE_ICON_PICKER (grade
// do seletor no admin) e AmenidadeIconTile (render com fallback pra emoji cru).
const AMENIDADE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  shieldcheck: ShieldCheck,
  waves: Waves,
  gamepad2: Gamepad2,
  gamepad: Gamepad2,
  trees: Trees,
  tree: Trees,
  dumbbell: Dumbbell,
  car: Car,
  utensils: Utensils,
  flame: Flame,
  flower: Flower2,
  flower2: Flower2,
  sun: Sun,
  home: Home,
  users: Users,
  wifi: Wifi,
  parking: ParkingCircle,
  parkingcircle: ParkingCircle,
  party: PartyPopper,
  partypopper: PartyPopper,
  baby: Baby,
  coffee: Coffee,
  sparkles: Sparkles,
  building: Building2,
  building2: Building2,
  // Phosphor — ampliação da grade além do que o lucide cobre (rodada 2, ver
  // docs/prd/amenidades-icones-phosphor/requirements.md).
  flowerlotus: FlowerLotus,
  bicycle: Bicycle,
  identificationbadge: IdentificationBadge,
  soccerball: SoccerBall,
  pawprint: PawPrint,
  laptop: Laptop,
  washingmachine: WashingMachine,
  elevator: Elevator,
};

// Grade curada do seletor no admin (rótulo em português por amenidade comum).
// Ícones fora dessa lista continuam funcionando se já salvos (compat.), mas
// não aparecem na grade — pra isso o admin usa o campo de emoji livre.
const AMENIDADE_ICON_PICKER: { key: string; label: string }[] = [
  { key: "shield", label: "Segurança" },
  { key: "waves", label: "Piscina" },
  { key: "dumbbell", label: "Academia" },
  { key: "flame", label: "Churrasqueira" },
  { key: "trees", label: "Área verde" },
  { key: "flower2", label: "Jardim" },
  { key: "car", label: "Estacionamento" },
  { key: "party", label: "Salão de festas" },
  { key: "home", label: "Salão" },
  { key: "users", label: "Convivência" },
  { key: "baby", label: "Playground" },
  { key: "gamepad2", label: "Jogos" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "coffee", label: "Copa" },
  { key: "sun", label: "Área externa" },
  { key: "building2", label: "Prédio" },
  { key: "flowerlotus", label: "Spa/Sauna" },
  { key: "bicycle", label: "Bicicletário" },
  { key: "identificationbadge", label: "Portaria" },
  { key: "soccerball", label: "Quadra poliesportiva" },
  { key: "pawprint", label: "Pet place" },
  { key: "laptop", label: "Coworking" },
  { key: "washingmachine", label: "Lavanderia" },
  { key: "elevator", label: "Elevador" },
];

// Emoji não é ASCII — se a string salva não bater com nenhuma chave do mapa
// lucide, mas tiver caractere fora do intervalo ASCII, ela é um emoji colado
// pelo admin (ex. 🥩) e deve ser exibida como está, não cair no fallback.
const isProvavelEmoji = (value: string) => /[^\x00-\x7F]/.test(value);

// Ícone lucide e emoji são linguagens visuais diferentes (traço monocromático
// vs. glifo colorido) — por isso o tile NÃO força a mesma caixa colorida nos
// dois casos: lucide ganha o quadrado com bg da marca, emoji fica "solto",
// maior, sem fundo, como um sticker (padrão Notion/Slack), senão o emoji
// parece "encaixado à força" numa caixa que não foi feita pra ele.
function AmenidadeIconTile({
  icone,
  size = "md",
  hoverInvert = false,
}: {
  icone: string | null;
  size?: "xs" | "sm" | "md";
  hoverInvert?: boolean;
}) {
  const raw = (icone ?? "").trim();
  const key = raw.toLowerCase();
  const Icon = AMENIDADE_ICONS[key];
  const box =
    size === "xs" ? "h-6 w-6 rounded-md" : size === "sm" ? "h-10 w-10 rounded-md" : "h-12 w-12 rounded-xl";
  const iconClass = size === "xs" ? "h-3.5 w-3.5" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const emojiClass = size === "xs" ? "text-sm" : size === "sm" ? "text-xl" : "text-2xl";
  const tileBase = cn("amenidade-icon-tile grid place-items-center", box);

  if (Icon) {
    return (
      <div
        className={cn(
          tileBase,
          "bg-secondary text-primary",
          hoverInvert && "group-hover:bg-primary group-hover:text-primary-foreground",
        )}
      >
        <Icon className={iconClass} />
      </div>
    );
  }
  if (raw && isProvavelEmoji(raw)) {
    return (
      <div className={tileBase}>
        <span className={cn("leading-none", emojiClass)} aria-hidden>
          {raw}
        </span>
      </div>
    );
  }
  return (
    <div
      className={cn(
        tileBase,
        "bg-secondary text-primary",
        hoverInvert && "group-hover:bg-primary group-hover:text-primary-foreground",
      )}
    >
      <Sparkles className={iconClass} />
    </div>
  );
}

function AmenidadeCard({ amenidade, delay }: { amenidade: AmenidadeRow; delay: number }) {
  return (
    <Reveal
      delay={delay}
      className="amenidade-elegante group rounded-2xl border border-border border-t-[3px] border-t-[color:var(--wood)] bg-card p-6 hover:border-[color:var(--sage)]"
    >
      <AmenidadeIconTile icone={amenidade.icone} size="md" hoverInvert />
      <h3 className="mt-5 text-lg font-semibold">{amenidade.nome}</h3>
      {amenidade.descricao && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{amenidade.descricao}</p>
      )}
    </Reveal>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portal Condomínio Residencial Miguel Arcanjo — Bem-vindo" },
      {
        name: "description",
        content:
          "Portal oficial do Portal Condomínio Residencial Miguel Arcanjo. Avisos públicos, infraestrutura e acesso ao portal do morador.",
      },
      { property: "og:title", content: "Portal Condomínio Residencial Miguel Arcanjo" },
      {
        property: "og:description",
        content: "Um condomínio moderno, seguro e transparente.",
      },
    ],
  }),
  component: Index,
});

// ================== ROOT ==================

// Blindagem defensiva: data_inicio é NOT NULL no banco hoje, mas o tipo
// ReservaRow/OcupacaoRow não garante isso em runtime (já houve drift de
// schema nessa área antes). Evita que um valor nulo/malformado derrube a
// página inteira num .split() direto.
function fmtDataReserva(v: string | null | undefined): string {
  if (!v) return "—";
  const [y, m, d] = v.split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y}`;
}

function mensagemBloqueioLogin(retryAfterSegundos?: number) {
  if (!retryAfterSegundos || retryAfterSegundos < 60) {
    return "Muitas tentativas de login. Tente novamente em instantes.";
  }
  const minutos = Math.ceil(retryAfterSegundos / 60);
  return `Muitas tentativas de login. Tente novamente em ${minutos} minuto${minutos > 1 ? "s" : ""}.`;
}

function Index() {
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bootLoading, setBootLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [firstAccessOpen, setFirstAccessOpen] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const p = await fetchProfileByAuthUser(userId);
      if (!p) {
        toast.error("Perfil não encontrado. Contate a administração.");
        await supabase.auth.signOut();
        setProfile(null);
        return;
      }
      setProfile(p);
      if (p.primeiro_acesso) setFirstAccessOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar perfil.");
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const uid = data.session?.user?.id ?? null;
      setAuthUserId(uid);
      setBootLoading(false);
      if (uid) loadProfile(uid);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setAuthUserId(uid);
      if (uid) loadProfile(uid);
      else setProfile(null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    if (!email || !password) return;

    let check: LoginGuardResult = { bloqueado: false };
    try {
      check = await verificarBloqueioLogin(email);
    } catch (e) {
      console.error(e); // se o rate-limit falhar, não bloqueia o login (fail-open)
    }
    if (check.bloqueado) {
      toast.error(mensagemBloqueioLogin(check.retry_after_segundos));
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    let resultado: LoginGuardResult = { bloqueado: false };
    try {
      resultado = await registrarTentativaLogin(email, !error);
    } catch (e) {
      console.error(e);
    }

    if (error) {
      toast.error(
        resultado.bloqueado
          ? mensagemBloqueioLogin(resultado.retry_after_segundos)
          : error.message || "Credenciais inválidas.",
      );
      return;
    }
    setLoginOpen(false);
    toast.success("Login realizado com sucesso!");
  };

  const handleFirstAccessComplete = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message || "Falha ao atualizar senha.");
      return false;
    }
    if (authUserId) {
      try {
        await markFirstAccessComplete(authUserId);
        setProfile((p) => (p ? { ...p, primeiro_acesso: false } : p));
      } catch (err) {
        console.error(err);
      }
    }
    setFirstAccessOpen(false);
    toast.success("Senha atualizada com sucesso!");
    return true;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setAuthUserId(null);
    toast.info("Você saiu do portal.");
  };

  const isAuthenticated = !!authUserId;
  const showFirstAccess = firstAccessOpen && !!profile?.primeiro_acesso;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-center" richColors />

      {bootLoading ? (
        <div className="grid min-h-screen place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isAuthenticated && profileLoading && !profile ? (
        <div className="grid min-h-screen place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : profile && !showFirstAccess ? (
        profile.role === "sindica" ? (
          <SindicaAdminView profile={profile} onLogout={handleLogout} />
        ) : profile.role === "admin_agencia" ? (
          <AgencyAdminView profile={profile} onLogout={handleLogout} />
        ) : profile.permissoes.length > 0 ? (
          <PermissionedMoradorView profile={profile} onLogout={handleLogout} />
        ) : (
          <ResidentDashboard profile={profile} onLogout={handleLogout} />
        )
      ) : (
        <PublicLanding onOpenLogin={() => setLoginOpen(true)} />
      )}

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} onSubmit={handleLogin} />
      <FirstAccessDialog open={showFirstAccess} onComplete={handleFirstAccessComplete} />
    </div>
  );
}

// ================== LOGIN DIALOG ==================

function LoginDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"login" | "recover" | "recover-sent">("login");
  const [recoverEmail, setRecoverEmail] = useState("");

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setMode("login");
      setRecoverEmail("");
    }
  };

  const submitRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await supabase.auth.resetPasswordForEmail(recoverEmail.trim(), {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
    } catch (err) {
      console.error(err);
      // Não revela ao usuário se o envio falhou por e-mail inexistente ou
      // por erro real — mensagem genérica em ambos os casos (evita
      // enumeração de usuários cadastrados).
    } finally {
      setSubmitting(false);
      setMode("recover-sent");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {mode === "login" ? (
          <Fragment key="login">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Portal do Morador</DialogTitle>
              <DialogDescription>
                Acesse com seu e-mail cadastrado para ver informações exclusivas.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                setSubmitting(true);
                try {
                  await onSubmit(e);
                } finally {
                  setSubmitting(false);
                }
              }}
              className="mt-2 space-y-4"
            >
              <div>
                <Label htmlFor="login-email">E-mail</Label>
                <Input id="login-email" name="email" type="email" required className="mt-2 h-11" placeholder="voce@email.com" />
              </div>
              <div>
                <Label htmlFor="login-password">Senha</Label>
                <PasswordInput id="login-password" name="password" required className="mt-2 h-11" placeholder="••••••••" />
              </div>
              <button
                type="button"
                onClick={() => setMode("recover")}
                className="cursor-pointer text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Esqueci minha senha
              </button>
              <Button type="submit" size="lg" className="w-full rounded-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Entrar
              </Button>
            </form>
          </Fragment>
        ) : mode === "recover" ? (
          <Fragment key="recover">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Recuperar senha</DialogTitle>
              <DialogDescription>
                Informe seu e-mail cadastrado. Se ele existir na nossa base, você recebe um
                link pra criar uma nova senha.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submitRecover} className="mt-2 space-y-4">
              <div>
                <Label htmlFor="recover-email">E-mail</Label>
                <Input
                  id="recover-email"
                  type="email"
                  required
                  autoFocus
                  value={recoverEmail}
                  onChange={(e) => setRecoverEmail(e.target.value)}
                  className="mt-2 h-11"
                  placeholder="voce@email.com"
                />
              </div>
              <Button type="submit" size="lg" className="w-full rounded-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Enviar link de recuperação
              </Button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full cursor-pointer text-center text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Voltar ao login
              </button>
            </form>
          </Fragment>
        ) : (
          <Fragment key="recover-sent">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Verifique seu e-mail</DialogTitle>
              <DialogDescription>
                Se <strong>{recoverEmail}</strong> estiver cadastrado, você vai receber um
                link pra criar uma nova senha em instantes. Confira também a caixa de spam.
              </DialogDescription>
            </DialogHeader>
            <Button
              type="button"
              variant="outline"
              className="mt-2 w-full rounded-full"
              onClick={() => setMode("login")}
            >
              Voltar ao login
            </Button>
          </Fragment>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ================== FIRST-ACCESS ==================

function FirstAccessDialog({
  open,
  onComplete,
}: {
  open: boolean;
  onComplete: (newPassword: string) => Promise<boolean>;
}) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[a-z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  }, [pw]);

  const strengthLabel = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte", "Excelente"][strength];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("A nova senha deve ter ao menos 8 caracteres.");
    if (strength < 3) return toast.error("Escolha uma senha mais forte.");
    if (pw !== pw2) return toast.error("As senhas não coincidem.");
    setSubmitting(true);
    const ok = await onComplete(pw);
    setSubmitting(false);
    if (ok) {
      setPw("");
      setPw2("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => { /* non-dismissible */ }}>
      <DialogContent
        className="max-w-lg overflow-hidden border-[color:var(--gold)]/30 p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="bg-primary px-7 py-7 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--gold)]/20 text-[color:var(--gold)]">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[color:var(--gold)]">
                Conformidade LGPD
              </p>
              <DialogTitle className="font-display text-2xl text-primary-foreground">
                Primeiro acesso detectado
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="mt-4 text-sm leading-relaxed text-primary-foreground/85">
            Conforme as diretrizes da LGPD, você deve alterar sua senha provisória agora.
          </DialogDescription>
        </div>

        <form onSubmit={submit} className="space-y-5 px-7 py-7">
          <div>
            <Label htmlFor="fa-pw" className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Nova senha
            </Label>
            <PasswordInput id="fa-pw" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} required className="mt-2 h-11" placeholder="Mínimo 8 caracteres" maxLength={60} />
            {pw.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i <= strength
                          ? strength <= 2
                            ? "bg-destructive"
                            : strength <= 3
                            ? "bg-[color:var(--gold)]"
                            : "bg-[color:var(--sage)]"
                          : "bg-secondary"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Força: <span className="font-semibold text-foreground">{strengthLabel}</span>
                </p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="fa-pw2" className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Confirmar nova senha
            </Label>
            <PasswordInput id="fa-pw2" value={pw2} onChange={(e) => setPw2(e.target.value)} required className="mt-2 h-11" placeholder="Repita a nova senha" maxLength={60} />
            {pw2.length > 0 && pw !== pw2 && (
              <p className="mt-1 text-xs font-medium text-destructive">As senhas não coincidem.</p>
            )}
          </div>

          <Button type="submit" size="lg" disabled={submitting} className="w-full rounded-full bg-[color:var(--gold)] text-primary hover:bg-[color:var(--gold)]/90">
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</>
            ) : (
              <><ShieldCheck className="h-4 w-4" /> Salvar e Acessar</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ================== AGENCY ADMIN (toggle Síndica ⇄ Morador) ==================

function PermissionedMoradorView({ profile, onLogout }: { profile: Profile; onLogout: () => void }) {
  const [view, setView] = useState<"morador" | "funcao">("funcao");

  const toggle = (
    <div className="inline-flex items-center overflow-hidden rounded-full border border-input bg-background shadow-sm">
      <button
        type="button"
        onClick={() => setView("funcao")}
        className={`px-3 py-1.5 text-xs font-medium transition ${
          view === "funcao" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
        }`}
      >
        {profile.titulo_funcao || "Função"}
      </button>
      <button
        type="button"
        onClick={() => setView("morador")}
        className={`px-3 py-1.5 text-xs font-medium transition ${
          view === "morador" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
        }`}
      >
        Visão Morador
      </button>
    </div>
  );

  return view === "morador" ? (
    <ResidentDashboard profile={profile} onLogout={onLogout} adminAgenciaToggle={toggle} />
  ) : (
    <PermissionedAdminView profile={profile} onLogout={onLogout} toggle={toggle} />
  );
}

// Renderiza as seções administrativas de acordo com as permissões
// granulares do profile (profile.permissoes) — usado pelo PermissionedAdminView,
// que atende tanto morador-com-cargo (ex.: Diego) quanto funcionário puro
// (profile role "morador" com unidade null, cadastrado via
// criar-funcionario). Sem role especial: o que a pessoa pode fazer é
// 100% definido pelo que foi marcado em "Gerenciar função".
function PermissoesGatedSections({
  profile,
}: {
  profile: Profile;
}) {
  const perms = useMemo(() => new Set(profile.permissoes), [profile.permissoes]);
  const [reservas, setReservas] = useState<ReservaComMorador[]>([]);
  const [reservasLoading, setReservasLoading] = useState(true);

  const loadReservas = useCallback(async () => {
    setReservasLoading(true);
    try { setReservas(await fetchReservasDoCondominio(profile.condominio_id)); }
    catch (e) { console.error(e); toast.error("Erro ao carregar reservas."); }
    finally { setReservasLoading(false); }
  }, [profile.condominio_id]);

  useEffect(() => { if (perms.has("aprovar_reservas")) loadReservas(); }, [loadReservas]);

  const handleApprove = async (id: string) => {
    try { await aprovarReserva(id); toast.success("Reserva aprovada."); loadReservas(); }
    catch (e) { console.error(e); toast.error("Erro ao aprovar reserva."); }
  };
  const handleReject = async (id: string, motivo: string) => {
    try { await recusarReserva(id, motivo); toast.success("Reserva recusada."); loadReservas(); }
    catch (e) { console.error(e); toast.error("Erro ao recusar reserva."); }
  };

  return (
    <>
      {!perms.size && (
        <div className="mx-auto max-w-7xl px-6 py-16">
          <EmptyState>Nenhuma permissão administrativa concedida ainda.</EmptyState>
        </div>
      )}

      {perms.has("aprovar_visitantes") && (
        <VisitantesAdminSection condominioId={profile.condominio_id} />
      )}

      {perms.has("aprovar_reservas") && (
        <ReservationsManagement
          reservas={reservas}
          loading={reservasLoading}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {perms.has("responder_chamados") && (
        <ChamadosAdminSection condominioId={profile.condominio_id} />
      )}

      {perms.has("moderar_classificados") && (
        <div id="admin-classificados">
          <ClassificadosAdminSection condominioId={profile.condominio_id} />
        </div>
      )}

      {perms.has("publicar_avisos") && (
        <LandingConfigSection condominioId={profile.condominio_id} />
      )}

      <UnidadesCobrancasSection
        profile={profile}
        canView={perms.has("ver_financeiro")}
        canEditFinanceiro={perms.has("editar_financeiro")}
        canManageMoradores={perms.has("gerenciar_moradores")}
        canDeleteMorador={perms.has("excluir_morador")}
        canCadastrarFuncionario={perms.has("cadastrar_funcionario")}
        canManagePermissoes={false}
      />

      <ObrasAdminSection condominioId={profile.condominio_id} canManage={perms.has("gerenciar_obras")} />

      <VotacoesAdminSection condominioId={profile.condominio_id} canManage={perms.has("gerenciar_votacoes")} />
    </>
  );
}

function PermissionedAdminView({ profile, onLogout, toggle }: { profile: Profile; onLogout: () => void; toggle: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Building2 className="h-6 w-6 shrink-0 text-primary" />
            <span className="font-display truncate text-base font-semibold tracking-tight sm:text-lg">
              <span className="sm:hidden">Cond. M. Arcanjo</span>
              <span className="hidden sm:inline">Condomínio Residencial Miguel Arcanjo</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--gold)]/20 px-2.5 py-0.5 text-xs font-semibold text-[color:var(--gold)]">
              <ShieldCheck className="h-3 w-3" /> {profile.titulo_funcao || "Função"}
            </span>
          </div>
          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <span className="hidden text-sm font-medium capitalize sm:inline">{profile.nome_completo}</span>
            {toggle}
            <Button onClick={onLogout} variant="outline" size="sm" className="shrink-0 rounded-full">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </nav>
      </header>

      <PermissoesGatedSections profile={profile} />
    </>
  );
}

// Síndica também é moradora da própria unidade (ex.: 202) — sem esse toggle
// ela não tinha nenhuma tela para cadastrar visitante/reserva pra si mesma
// (só o painel de moderação, que é do condomínio inteiro). admin_agencia e
// morador-com-cargo já tinham esse mesmo padrão de alternância.
function SindicaAdminView({ profile, onLogout }: { profile: Profile; onLogout: () => void }) {
  const [adminView, setAdminView] = useState<"sindica" | "morador">("sindica");
  const moradorProfile = useMemo<Profile>(() => ({ ...profile, role: "morador" }), [profile]);

  const toggle = (
    <div className="inline-flex items-center overflow-hidden rounded-full border border-input bg-background shadow-sm">
      <button
        type="button"
        onClick={() => setAdminView("sindica")}
        className={`px-3 py-1.5 text-xs font-medium transition ${
          adminView === "sindica"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
      >
        Visão Síndica
      </button>
      <button
        type="button"
        onClick={() => setAdminView("morador")}
        className={`px-3 py-1.5 text-xs font-medium transition ${
          adminView === "morador"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
      >
        Visão Morador
      </button>
    </div>
  );

  return adminView === "sindica" ? (
    <AdminDashboard profile={profile} onLogout={onLogout} adminAgenciaToggle={toggle} />
  ) : (
    <ResidentDashboard profile={moradorProfile} onLogout={onLogout} adminAgenciaToggle={toggle} />
  );
}

function AgencyAdminView({ profile, onLogout }: { profile: Profile; onLogout: () => void }) {
  const [adminView, setAdminView] = useState<"sindica" | "morador">("sindica");
  const sindicaProfile = useMemo<Profile>(() => ({ ...profile, role: "sindica" }), [profile]);
  const moradorProfile = useMemo<Profile>(() => ({ ...profile, role: "morador" }), [profile]);

  const toggle = (
    <div className="inline-flex items-center overflow-hidden rounded-full border border-input bg-background shadow-sm">
      <button
        type="button"
        onClick={() => setAdminView("sindica")}
        className={`px-3 py-1.5 text-xs font-medium transition ${
          adminView === "sindica"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
      >
        Visão Síndica
      </button>
      <button
        type="button"
        onClick={() => setAdminView("morador")}
        className={`px-3 py-1.5 text-xs font-medium transition ${
          adminView === "morador"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
      >
        Visão Morador
      </button>
    </div>
  );

  return adminView === "sindica" ? (
    <AdminDashboard profile={sindicaProfile} onLogout={onLogout} adminAgenciaToggle={toggle} isAdminAgencia />
  ) : (
    <ResidentDashboard profile={moradorProfile} onLogout={onLogout} adminAgenciaToggle={toggle} />
  );
}

// ================== HELPERS ==================

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function LoadingBlock({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <p className="text-center text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ================== PUBLIC LANDING ==================

function PublicLanding({ onOpenLogin }: { onOpenLogin: () => void }) {
  const [config, setConfig] = useState<CondominioConfigRow | null>(null);
  const [amenidades, setAmenidades] = useState<AmenidadeRow[]>([]);
  const [avisos, setAvisos] = useState<AvisoPublicoRow[]>([]);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchCondominioConfig(LANDING_CONDOMINIO_ID).catch(() => null),
      fetchAmenidades(LANDING_CONDOMINIO_ID).catch(() => []),
      fetchAvisosPublicosAtivos(LANDING_CONDOMINIO_ID).catch(() => []),
    ]).then(([c, a, av]) => {
      if (!alive) return;
      setConfig(c);
      setAmenidades(a);
      setAvisos(av);
    });
    return () => { alive = false; };
  }, []);

  const sobreTitulo = config?.sobre_titulo?.trim() || "Um ambiente pensado para o seu bem-estar";
  const sobreDescricao = config?.sobre_descricao?.trim() || "";

  const activeSection = useScrollSpy(["sobre", "estrutura", "avisos"]);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.classList.remove("section-flash");
    void target.offsetWidth; // reinicia a animação mesmo se já tiver rodado
    target.classList.add("section-flash");
    window.setTimeout(() => target.classList.remove("section-flash"), 1200);
    window.history.replaceState(null, "", `#${id}`);
  }, []);

  return (
    <>
      <header className="absolute top-0 z-30 w-full">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6">
          <a href="#top" className="flex min-w-0 items-center gap-2 text-primary-foreground">
            <Building2 className="h-6 w-6 shrink-0" />
            <span className="font-display truncate text-sm font-semibold tracking-tight sm:text-lg">
              <span className="sm:hidden">Cond. M. Arcanjo</span>
              <span className="hidden sm:inline">Condomínio Residencial Miguel Arcanjo</span>
            </span>
          </a>
          <div className="hidden items-center gap-8 text-sm text-primary-foreground/85 md:flex">
            <a href="#sobre" onClick={(e) => handleNavClick(e, "sobre")} data-active={activeSection === "sobre"} className="nav-underline hover:text-primary-foreground">Sobre</a>
            <a href="#estrutura" onClick={(e) => handleNavClick(e, "estrutura")} data-active={activeSection === "estrutura"} className="nav-underline hover:text-primary-foreground">Infraestrutura</a>
            <a href="#avisos" onClick={(e) => handleNavClick(e, "avisos")} data-active={activeSection === "avisos"} className="nav-underline hover:text-primary-foreground">Avisos</a>
          </div>
          <Button onClick={onOpenLogin} variant="secondary" size="sm" className="shrink-0 rounded-full">
            <LogIn className="h-4 w-4" /> <span className="hidden sm:inline">Portal do Morador</span><span className="sm:hidden">Entrar</span>
          </Button>
        </nav>
      </header>


      <section id="top" className="relative isolate min-h-[92vh] overflow-hidden">
        <img src={heroImage} alt="Fachada do condomínio ao entardecer" width={1920} height={1280} className="hero-img-live absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-end px-6 pb-20 pt-40 text-primary-foreground">
          <div className="hero-cascade max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Um lugar para chamar de lar
            </span>
            <h1 className="mt-6 font-display text-5xl font-medium leading-[1.05] sm:text-6xl md:text-7xl">
              Bem-vindo ao<br />
              <span
                className="script-shimmer text-6xl sm:text-7xl md:text-8xl leading-[1.1]"
                style={{ fontFamily: "var(--font-script)" }}
              >
                Miguel Arcanjo
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/85">
              Conforto, segurança e convivência em harmonia com a natureza.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={onOpenLogin} size="lg" className="rounded-full bg-[color:var(--gold)] text-primary hover:bg-[color:var(--gold)]/90">
                <LogIn className="h-4 w-4" /> Entrar no Portal do Morador
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-white/30 bg-white/5 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
                <a href="#estrutura" onClick={(e) => handleNavClick(e, "estrutura")}>Conhecer o condomínio</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="sobre" className="border-b border-border bg-background py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
                <Sparkles className="h-3.5 w-3.5" /> Sobre o condomínio
              </span>
              <h2 className="mt-3 text-4xl font-medium md:text-5xl">{sobreTitulo}</h2>
              {sobreDescricao && (
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground whitespace-pre-line">{sobreDescricao}</p>
              )}
            </div>
            <div className="overflow-hidden rounded-2xl border-[3px] border-[color:var(--wood)] shadow-[var(--shadow-soft)]">
              <img
                src={sobreImage}
                alt="Área comum do Condomínio Residencial Miguel Arcanjo"
                width={1400}
                height={1050}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div id="estrutura" className="mt-14">
            {amenidades.length === 0 ? (
              <EmptyState>Nenhuma comodidade cadastrada ainda.</EmptyState>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {amenidades.map((a, i) => (
                  <AmenidadeCard key={a.id} amenidade={a} delay={(i % 4) * 80} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="avisos" className="bg-secondary/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
                <Bell className="h-3.5 w-3.5" /> Mural público
              </span>
              <h2 className="mt-3 text-4xl font-medium md:text-5xl">Avisos à comunidade</h2>
            </div>
            <button onClick={onOpenLogin} className="text-sm font-medium text-primary hover:underline">
              Acesso completo no portal →
            </button>
          </div>
          <div className="mt-12">
            {avisos.length === 0 ? (
              <EmptyState>Nenhum aviso publicado ainda.</EmptyState>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {avisos.map((n) => (
                  <article key={n.id} className="group flex flex-col rounded-2xl border border-border border-l-4 border-l-[color:var(--wood)] bg-card p-7 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Aviso</span>
                      <time className="text-xs font-medium uppercase tracking-wider text-[color:var(--sage)]">
                        {new Date(n.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </time>
                    </div>
                    <h3 className="mt-6 text-xl font-semibold leading-snug">{n.titulo}</h3>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{n.conteudo}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <PublicContactSection condominioId={LANDING_CONDOMINIO_ID} config={config} />

      <section id="localizacao" className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
                <MapPin className="h-3.5 w-3.5" /> Como chegar
              </span>
              <h2 className="mt-3 font-display text-4xl font-medium md:text-5xl">Onde estamos</h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                Condomínio Residencial Miguel Arcanjo — Ubatuba/SP.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <a href="https://maps.app.goo.gl/ERAMfp31RTdp1Yh17" target="_blank" rel="noopener noreferrer">
                <MapPin className="h-4 w-4" /> Abrir no Google Maps
              </a>
            </Button>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border-[3px] border-[color:var(--wood)] shadow-[var(--shadow-soft)]">
            <iframe
              title="Localização do Condomínio Residencial Miguel Arcanjo"
              src="https://www.google.com/maps?q=Condom%C3%ADnio+Miguel+Arcanjo&ftid=0x94cd53db0689b531:0xf4f4ebec6ad260ae&z=17&hl=pt-BR&output=embed"
              className="h-[420px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <footer className="border-t-[3px] border-t-[color:var(--wood)] bg-background py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>© {new Date().getFullYear()} Portal Condomínio Residencial Miguel Arcanjo</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/privacidade" className="underline-offset-2 hover:text-foreground hover:underline">
              Política de Privacidade
            </Link>
            <p>Portal oficial de moradores</p>
          </div>
        </div>
      </footer>
    </>
  );
}

function PublicContactSection({
  condominioId,
  config,
}: {
  condominioId: string;
  config: CondominioConfigRow | null;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return toast.error("Informe seu nome.");
    if (!mensagem.trim()) return toast.error("Informe a mensagem.");
    setBusy(true);
    try {
      const { error } = await supabase.from("contatos_publicos").insert({
        condominio_id: condominioId,
        nome: nome.trim(),
        email: email.trim() || null,
        telefone: telefone.trim() || null,
        mensagem: mensagem.trim(),
      });
      if (error) throw error;
      setSent(true);
      setNome(""); setEmail(""); setTelefone(""); setMensagem("");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar mensagem.");
    } finally {
      setBusy(false);
    }
  };

  const emailSindica = config?.email_sindica?.trim() || "—";
  const horario = config?.horario_atendimento?.trim() || "—";

  return (
    <section id="contato" className="bg-[#0f172a] py-24 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--gold)]">
            <Mail className="h-3.5 w-3.5" /> Entre em contato
          </span>
          <h2 className="mt-3 font-display text-4xl font-medium md:text-5xl">Fale com a administração</h2>
          <p className="mt-4 text-white/70">
            Solicitações, sugestões e reclamações chegam direto à síndica e são respondidas em até 48 horas úteis.
          </p>

          <div className="mt-10 space-y-5">
            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Síndica</p>
                <p className="break-words text-sm text-white/70">{emailSindica}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Horário de resposta</p>
                <p className="whitespace-pre-line text-sm text-white/70">{horario}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-8 text-foreground shadow-2xl">
          {sent && (
            <div className="rounded-xl bg-primary/10 p-3 text-sm text-primary">
              Mensagem enviada! Entraremos em contato em breve.
            </div>
          )}
          <div>
            <Label htmlFor="pc-nome">Nome *</Label>
            <Input id="pc-nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="pc-email">E-mail</Label>
              <Input id="pc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} />
            </div>
            <div>
              <Label htmlFor="pc-tel">Telefone</Label>
              <Input id="pc-tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} maxLength={40} />
            </div>
          </div>
          <div>
            <Label htmlFor="pc-msg">Mensagem *</Label>
            <Textarea
              id="pc-msg"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value.slice(0, 1000))}
              rows={5}
              required
              maxLength={1000}
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">{mensagem.length}/1000</p>
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Enviar mensagem</>}
          </Button>
        </form>
      </div>
    </section>
  );
}

// ================== RESIDENT DASHBOARD ==================

function ResidentDashboard({ profile, onLogout, adminAgenciaToggle }: { profile: Profile; onLogout: () => void; adminAgenciaToggle?: ReactNode }) {
  const [pautas, setPautas] = useState<PautaRow[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [pautasLoading, setPautasLoading] = useState(true);

  const [reservas, setReservas] = useState<ReservaRow[]>([]);
  const [reservasLoading, setReservasLoading] = useState(true);
  const [ocupacoes, setOcupacoes] = useState<OcupacaoRow[]>([]);

  const [obras, setObras] = useState<ObraRow[]>([]);
  const [obrasLoading, setObrasLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const [historico, setHistorico] = useState<HistoricoRow[]>([]);
  const [historicoLoading, setHistoricoLoading] = useState(true);
  const [fundoObrasTotal, setFundoObrasTotal] = useState<number | null>(null);

  const loadPautas = useCallback(async () => {
    setPautasLoading(true);
    try {
      const [ps, meus] = await Promise.all([
        fetchPautasAtivas(profile.condominio_id),
        fetchMeusVotos(profile.condominio_id, profile.id),
      ]);
      setPautas(ps);
      setVotedIds(new Set(meus.map((v) => v.pauta_id)));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar votações.");
    } finally {
      setPautasLoading(false);
    }
  }, [profile.condominio_id, profile.id]);

  const loadReservas = useCallback(async () => {
    setReservasLoading(true);
    try {
      const [minhas, ocs] = await Promise.all([
        fetchMinhasReservas(profile.id),
        fetchOcupacoesCondominio(profile.condominio_id),
      ]);
      setReservas(minhas);
      setOcupacoes(ocs);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar reservas.");
    } finally {
      setReservasLoading(false);
    }
  }, [profile.id, profile.condominio_id]);

  const loadObras = useCallback(async () => {
    setObrasLoading(true);
    try {
      setObras(await fetchObras(profile.condominio_id));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar obras.");
    } finally {
      setObrasLoading(false);
    }
  }, [profile.condominio_id]);

  const loadHistorico = useCallback(async () => {
    setHistoricoLoading(true);
    try {
      setHistorico(await fetchMeuHistorico(profile.id, currentYear));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar histórico financeiro.");
    } finally {
      setHistoricoLoading(false);
    }
    // Fundo de Obras é um extra opcional — não pode derrubar o histórico
    // se a função ainda não existir nesse ambiente (ex. antes da migration).
    try {
      setFundoObrasTotal(await fetchFundoObrasTotal(profile.condominio_id));
    } catch (e) {
      console.error(e);
    }
  }, [profile.id, profile.condominio_id, currentYear]);

  useEffect(() => {
    loadPautas();
    loadReservas();
    loadObras();
    loadHistorico();
  }, [loadPautas, loadReservas, loadObras, loadHistorico]);

  const handleVote = async (pautaId: string, choice: "sim" | "nao") => {
    if (votedIds.has(pautaId)) {
      toast.error("Você já votou nesta enquete.");
      return;
    }
    try {
      await registrarVoto(profile.condominio_id, pautaId, profile.id, choice);
      setVotedIds((prev) => new Set(prev).add(pautaId));
      toast.success(`Voto computado: ${choice === "sim" ? "Sim" : "Não"}.`);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao registrar voto.");
    }
  };

  const handleRequestReservation = async (spaceId: string, spaceName: string, dateIso: string, observacoes: string) => {
    try {
      await criarReserva({
        condominio_id: profile.condominio_id,
        morador_id: profile.id,
        espaco: spaceId,
        data_inicio: dateIso,
        data_fim: dateIso,
        observacoes: observacoes.trim() || null,
      });
      toast.success(`Solicitação enviada: ${spaceName} em ${dateIso.split("-").reverse().join("/")}.`);
      loadReservas();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao solicitar reserva.");
    }
  };

  const handleCancelReserva = async (id: string) => {
    if (!confirm("Cancelar esta reserva? Esta ação não pode ser desfeita.")) return;
    try {
      await removerReserva(id);
      toast.success("Reserva cancelada.");
      loadReservas();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao cancelar reserva.");
    }
  };

  const residentName = profile.nome_completo;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2">
            <Building2 className="h-6 w-6 shrink-0 text-primary" />
            <span className="font-display truncate text-base font-semibold tracking-tight sm:text-lg">
              <span className="sm:hidden">Cond. M. Arcanjo</span>
              <span className="hidden sm:inline">Condomínio Residencial Miguel Arcanjo</span>
            </span>
            <span className="ml-3 hidden rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground sm:inline">
              Portal do Morador
            </span>
          </div>
          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 text-sm sm:flex">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-primary">
                <User className="h-4 w-4" />
              </div>
              <span className="font-medium capitalize">{residentName}</span>
              {profile.unidade && (
                <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[11px] text-secondary-foreground">
                  {profile.unidade}
                </span>
              )}
            </div>
            {adminAgenciaToggle}
            <Button onClick={onLogout} variant="outline" size="sm" className="shrink-0 rounded-full">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </nav>
      </header>


      <section className="border-b border-border bg-secondary/30">
        <Reveal className="mx-auto max-w-7xl px-6 py-14">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
            <Sparkles className="h-3.5 w-3.5" /> Área restrita
          </span>
          <h1 className="mt-3 font-display text-4xl font-medium md:text-5xl">
            Olá, <span className="capitalize italic text-primary">{residentName}</span>
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Aqui você acompanha a saúde financeira do condomínio, participa de votações,
            acompanha obras e abre chamados diretamente com a administração.
          </p>
        </Reveal>
      </section>

      {/* Votações */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
              <Vote className="h-3.5 w-3.5" /> Enquetes ativas
            </span>
            <h2 className="mt-3 text-3xl font-medium md:text-4xl">Votações em andamento</h2>
            <p className="mt-4 text-muted-foreground">
              Sua opinião conta. Cada morador pode votar apenas uma vez por enquete.
            </p>
          </Reveal>

          <div className="mt-10">
            {pautasLoading ? (
              <LoadingBlock label="Carregando votações…" />
            ) : pautas.length === 0 ? (
              <EmptyState>Nenhuma enquete aberta no momento.</EmptyState>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {pautas.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 2) * 100} className="min-w-0">
                    <PollCard pauta={p} hasVoted={votedIds.has(p.id)} onVote={handleVote} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Financeiro pessoal */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
            <Reveal className="min-w-0">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
                <FileText className="h-3.5 w-3.5" /> Transparência financeira
              </span>
              <h2 className="mt-3 text-3xl font-medium md:text-4xl">Meu histórico ({currentYear})</h2>
              <p className="mt-4 text-muted-foreground">
                Situação de pagamento da sua unidade ({profile.unidade || "—"}) mês a mês.
              </p>
              {fundoObrasTotal !== null && fundoObrasTotal > 0 && (
                <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 px-4 py-2.5 text-sm">
                  <Hammer className="h-4 w-4 shrink-0 text-[color:var(--gold)]" />
                  <span>
                    Fundo de Obras arrecadado: <strong>{fundoObrasTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
                  </span>
                </div>
              )}
            </Reveal>

            <Reveal delay={100} className="min-w-0">
              {historicoLoading ? (
                <LoadingBlock label="Carregando histórico…" />
              ) : (
                <MyPaymentGrid rows={historico} year={currentYear} />
              )}
              <div className="mt-8">
                <DocumentsArchive condominioId={profile.condominio_id} />
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* Obras */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
              <Hammer className="h-3.5 w-3.5" /> Obras & Reformas
            </span>
            <h2 className="mt-3 text-3xl font-medium md:text-4xl">Linha do tempo dos projetos</h2>
            <p className="mt-4 text-muted-foreground">
              O que já entregamos, o que está em execução e o que vem a seguir.
            </p>
          </Reveal>

          {obrasLoading ? (
            <div className="mt-10"><LoadingBlock label="Carregando obras…" /></div>
          ) : (
            <Reveal delay={100}>
              <ObrasTabs obras={obras} />
            </Reveal>
          )}
        </div>
      </section>

      {/* Reservas */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
                <CalendarIcon className="h-3.5 w-3.5" /> Sistema de reservas
              </span>
              <h2 className="mt-3 text-3xl font-medium md:text-4xl">Reserve um espaço</h2>
              <p className="mt-4 text-muted-foreground">
                Escolha um espaço e uma data. A confirmação chega em até 24h.
              </p>
            </div>
          </Reveal>

          <ReservationModule onRequest={handleRequestReservation} ocupacoes={ocupacoes} />

          <div className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-medium">Minhas reservas</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Acompanhe o status dos seus pedidos.
                </p>
              </div>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                {reservas.length} {reservas.length === 1 ? "pedido" : "pedidos"}
              </span>
            </div>

            {reservasLoading ? (
              <div className="mt-6"><LoadingBlock label="Carregando reservas…" /></div>
            ) : reservas.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Você ainda não solicitou nenhuma reserva.
              </div>
            ) : (
              <ul className="mt-6 grid gap-3 md:grid-cols-2">
                {reservas.filter((r) => r.status !== "bloqueado").map((r, i) => {
                  const uiStatus = RESERVA_DB_TO_UI[r.status as Exclude<typeof r.status, "bloqueado">];
                  const spaceName = RESERVATION_SPACES.find((s) => s.id === r.espaco)?.name ?? r.espaco;
                  return (
                    <Reveal key={r.id} as="li" delay={(i % 4) * 70} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                        <CalendarIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug">{spaceName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Data: <span className="font-mono">{fmtDataReserva(r.data_inicio)}</span>
                        </p>
                        {r.observacoes && (
                          <p className="mt-1 text-xs text-muted-foreground italic">
                            Observações: {r.observacoes}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${RESERVATION_STATUS_STYLES[uiStatus]}`}>
                            {uiStatus === "Pendente" && "PENDENTE — Aguardando aprovação"}
                            {uiStatus === "Confirmada" && "CONFIRMADA"}
                            {uiStatus === "Recusada" && "RECUSADA"}
                          </span>
                        </div>
                        {uiStatus === "Recusada" && r.motivo_recusa && (
                          <p className="mt-2 rounded-md bg-destructive/5 px-2.5 py-1.5 text-[11px] text-destructive">
                            Motivo: {r.motivo_recusa}
                          </p>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="mt-2 h-7 gap-1.5 rounded-full px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleCancelReserva(r.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Cancelar reserva
                        </Button>
                      </div>
                    </Reveal>
                  );
                })}
              </ul>

            )}
          </div>
        </div>
      </section>

      <ClassificadosResidentSection profile={profile} />

      <VisitantesResidentSection profile={profile} />

      <ChamadosResidentSection profile={profile} />

      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-6 text-center text-sm text-muted-foreground">
          <span>
            © {new Date().getFullYear()} Portal Condomínio Residencial Miguel Arcanjo · Portal restrito a moradores
          </span>
          <Link to="/privacidade" className="underline-offset-2 hover:text-foreground hover:underline">
            Política de Privacidade
          </Link>
        </div>
      </footer>
    </>
  );
}

// ================== POLL CARD (morador) ==================

function PollCard({
  pauta,
  hasVoted,
  onVote,
}: {
  pauta: PautaRow;
  hasVoted: boolean;
  onVote: (id: string, choice: "sim" | "nao") => void;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          <Vote className="h-3.5 w-3.5" /> Enquete aberta
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Voto sigiloso</span>
      </div>

      <h3 className="mt-5 text-xl font-semibold leading-snug">{pauta.titulo}</h3>
      {pauta.descricao && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pauta.descricao}</p>
      )}

      {hasVoted ? (
        <div className="mt-6 rounded-xl border border-[color:var(--sage)]/30 bg-[color:var(--sage)]/10 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--sage)]" />
            <div>
              <p className="text-sm font-semibold text-foreground">Obrigado! Seu voto foi registrado.</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Os resultados serão divulgados pela síndica após o encerramento.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => onVote(pauta.id, "sim")} className="flex-1 rounded-full bg-[color:var(--sage)] text-primary-foreground hover:opacity-90">
            <ThumbsUp className="h-4 w-4" /> Votar Sim
          </Button>
          <Button onClick={() => onVote(pauta.id, "nao")} variant="outline" className="flex-1 rounded-full">
            <ThumbsDown className="h-4 w-4" /> Votar Não
          </Button>
        </div>
      )}
    </article>
  );
}

// ================== MY PAYMENT GRID (morador) ==================

const HEATMAP_CELL_STYLES: Record<FinancialStatus, string> = {
  "Em dia": "bg-[color:var(--sage)] text-[#06231f]",
  Pendente: "bg-[color:var(--gold)] text-primary-foreground",
  Atrasado: "bg-destructive text-destructive-foreground",
};

function MyPaymentGrid({ rows, year }: { rows: HistoricoRow[]; year: number }) {
  const byMonth = new Map<number, HistoricoRow>();
  rows.forEach((r) => byMonth.set(r.mes, r));
  const currentMonth = new Date().getMonth() + 1;

  const counts = { "Em dia": 0, Pendente: 0, Atrasado: 0, semRegistro: 0 };
  for (let m = 1; m <= currentMonth; m++) {
    const row = byMonth.get(m);
    if (!row) { counts.semRegistro++; continue; }
    counts[HISTORICO_DB_TO_UI[row.status]]++;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Pagamentos {year}</h3>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="mb-4 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm">
        <strong className="font-semibold">
          {counts["Em dia"]} de {currentMonth} {counts["Em dia"] === 1 ? "mês em dia" : "meses em dia"}
        </strong>
        {(counts.Atrasado > 0 || counts.Pendente > 0) && (
          <span className="text-xs text-muted-foreground">
            {counts.Atrasado > 0 && `· ${counts.Atrasado} ${counts.Atrasado === 1 ? "atrasado" : "atrasados"} `}
            {counts.Pendente > 0 && `· ${counts.Pendente} ${counts.Pendente === 1 ? "pendente" : "pendentes"}`}
          </span>
        )}
      </div>

      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 12 }).map((_, i) => {
          const monthNum = i + 1;
          const row = byMonth.get(monthNum);
          const uiStatus = row ? HISTORICO_DB_TO_UI[row.status] : null;
          const isFuture = monthNum > currentMonth;
          const isCurrent = monthNum === currentMonth;
          const cellClass = isFuture
            ? "bg-secondary/50 text-muted-foreground"
            : uiStatus
              ? HEATMAP_CELL_STYLES[uiStatus]
              : "bg-secondary/50 text-muted-foreground";
          return (
            <div
              key={monthNum}
              title={`${MONTH_NAMES_PT[i]}: ${isFuture ? "A faturar" : (uiStatus ?? "Sem registro")}`}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg text-[10px] font-bold uppercase tracking-wide ${cellClass} ${isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}
            >
              {MONTH_NAMES_PT_SHORT[i]}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3">
        {(["Em dia", "Atrasado", "Pendente"] as FinancialStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={`h-2.5 w-2.5 rounded-sm ${HEATMAP_CELL_STYLES[status].split(" ")[0]}`} />
            {status}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-sm bg-secondary/50" />
          A faturar
        </div>
      </div>
    </div>
  );
}

// ================== ADMIN DASHBOARD ==================

const STATUS_STYLES: Record<FinancialStatus, string> = {
  "Em dia": "bg-[color:var(--sage)]/15 text-[color:var(--sage)] border-[color:var(--sage)]/30",
  Pendente: "bg-[color:var(--gold)]/15 text-[color:var(--gold)] border-[color:var(--gold)]/30",
  Atrasado: "bg-destructive/10 text-destructive border-destructive/30",
};

type MoradorInfo = { id: string; nome_completo: string; unidade: string | null; role?: Role; titulo_funcao?: string | null; permissoes?: Permissao[] };

const BLOCO_FUNCIONARIOS = "Funcionários";

const ROLE_LABEL: Record<Role, string> = {
  morador: "",
  sindica: "Síndica",
  admin_agencia: "Administradora",
  zelador: "Funcionário",
};

function parseUnidade(unidade: string): { bloco: string; numero: number } {
  const [bloco, numero] = unidade.split("-");
  return { bloco: bloco ?? unidade, numero: Number(numero) || 0 };
}

// Zelador (funcionário) não tem unidade — cai sempre no bloco "Funcionários",
// ordenado por último (nunca alfabeticamente misturado com os blocos reais).
function blocoDoMorador(unidade: string | null): string {
  return unidade ? parseUnidade(unidade).bloco : BLOCO_FUNCIONARIOS;
}

function compareUnidade(a: string | null, b: string | null) {
  if (a == null || b == null) return a == null && b == null ? 0 : a == null ? 1 : -1;
  const pa = parseUnidade(a);
  const pb = parseUnidade(b);
  return pa.bloco !== pb.bloco ? pa.bloco.localeCompare(pb.bloco) : pa.numero - pb.numero;
}

// Lista de unidades/moradores/funcionários com cobrança — usada tanto pelo
// painel completo da síndica/admin_agencia (todas as flags true) quanto
// pela visão de quem tem permissões granulares específicas (Diego, um
// funcionário etc.) — cada botão/ação só aparece se a permissão
// correspondente foi concedida. "Gerenciar função" fica de fora do controle
// por `canManagePermissoes` bem restrito de propósito: só sindica/admin_agencia
// concedem/revogam permissão de terceiros (profile_permissoes_write no
// banco já bloqueia qualquer outra pessoa, então nem exibimos o botão).
function UnidadesCobrancasSection({
  profile,
  canView,
  canEditFinanceiro,
  canManageMoradores,
  canDeleteMorador,
  canCadastrarFuncionario,
  canManagePermissoes,
  isAdminAgencia = false,
  onDataLoaded,
}: {
  profile: Profile;
  canView: boolean;
  canEditFinanceiro: boolean;
  canManageMoradores: boolean;
  canDeleteMorador: boolean;
  canCadastrarFuncionario: boolean;
  canManagePermissoes: boolean;
  isAdminAgencia?: boolean;
  onDataLoaded?: (historico: HistoricoRow[], moradores: MoradorInfo[]) => void;
}) {
  const onDataLoadedRef = useRef(onDataLoaded);
  onDataLoadedRef.current = onDataLoaded;

  const [historico, setHistorico] = useState<HistoricoRow[]>([]);
  const [moradores, setMoradores] = useState<MoradorInfo[]>([]);
  const [finLoading, setFinLoading] = useState(true);
  const [historyUnitId, setHistoryUnitId] = useState<string | null>(null);
  const [fundoObrasTotal, setFundoObrasTotal] = useState<number | null>(null);
  const [importarOpen, setImportarOpen] = useState(false);
  const [newMoradorOpen, setNewMoradorOpen] = useState(false);
  const [newFuncionarioOpen, setNewFuncionarioOpen] = useState(false);
  const [editMorador, setEditMorador] = useState<MoradorInfo | null>(null);
  const [deleteAlvo, setDeleteAlvo] = useState<MoradorInfo | null>(null);
  const [promoteMoradorId, setPromoteMoradorId] = useState<string | null>(null);
  const [funcaoMorador, setFuncaoMorador] = useState<MoradorInfo | null>(null);
  const [openBlocos, setOpenBlocos] = useState<Set<string>>(new Set());

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const moradoresPorBloco = useMemo(() => {
    const grupos = new Map<string, MoradorInfo[]>();
    for (const m of moradores) {
      const bloco = blocoDoMorador(m.unidade);
      if (!grupos.has(bloco)) grupos.set(bloco, []);
      grupos.get(bloco)!.push(m);
    }
    return Array.from(grupos.entries());
  }, [moradores]);

  const toggleBloco = (bloco: string) => {
    setOpenBlocos((prev) => {
      const next = new Set(prev);
      if (next.has(bloco)) next.delete(bloco);
      else next.add(bloco);
      return next;
    });
  };

  const loadFinanceiro = useCallback(async () => {
    setFinLoading(true);
    try {
      const [h, m] = await Promise.all([
        fetchHistoricoCondominio(profile.condominio_id),
        fetchMoradoresDoCondominio(profile.condominio_id),
      ]);
      const sorted = [...m].sort((a, b) => compareUnidade(a.unidade, b.unidade));
      setHistorico(h);
      setMoradores(sorted);
      onDataLoadedRef.current?.(h, sorted);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar dados financeiros.");
    } finally {
      setFinLoading(false);
    }
    try {
      setFundoObrasTotal(await fetchFundoObrasTotal(profile.condominio_id));
    } catch (e) {
      console.error(e);
    }
  }, [profile.condominio_id]);

  const podeAlgumaCoisa = canView || canEditFinanceiro || canManageMoradores || canDeleteMorador || canCadastrarFuncionario;
  useEffect(() => {
    if (podeAlgumaCoisa) loadFinanceiro();
  }, [podeAlgumaCoisa, loadFinanceiro]);

  const handleHistoricoChange = async (monthNum: number, uiStatus: FinancialStatus) => {
    if (!historyUnitId) return;
    const dbStatus = HISTORICO_UI_TO_DB[uiStatus];
    const existing = historico.find(
      (h) => h.unidade_id === historyUnitId && h.ano === currentYear && h.mes === monthNum,
    );
    try {
      if (existing) {
        await atualizarHistorico(existing.id, dbStatus);
      } else {
        await criarHistorico({
          condominio_id: profile.condominio_id,
          unidade_id: historyUnitId,
          ano: currentYear,
          mes: monthNum,
          status: dbStatus,
          valor: 0,
        });
      }
      toast.success(`Status atualizado para "${uiStatus}".`);
      loadFinanceiro();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleDeleteMorador = async () => {
    if (!deleteAlvo) return;
    try {
      await removerMorador(deleteAlvo.id);
      toast.success("Removido.");
      setDeleteAlvo(null);
      loadFinanceiro();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover.");
    }
  };

  const handlePromoteMorador = async (novoRole: "sindica" | "admin_agencia") => {
    if (!promoteMoradorId) return;
    try {
      await promoverPara(promoteMoradorId, novoRole);
      toast.success(novoRole === "sindica" ? "Morador promovido a síndica." : "Morador promovido a administradora.");
      setPromoteMoradorId(null);
      loadFinanceiro();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao promover morador.");
    }
  };

  if (!podeAlgumaCoisa) return null;

  const podeVerFinanceiro = canView || canEditFinanceiro;

  return (
    <>
      <section className="bg-secondary/40 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
                <Wallet className="h-3.5 w-3.5" /> Situação financeira
              </span>
              <h2 className="mt-3 text-3xl font-medium md:text-4xl">Unidades & cobranças</h2>
              {podeVerFinanceiro && (
                <p className="mt-4 text-muted-foreground">
                  Clique em uma linha para editar o histórico mensal ({currentYear}).
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canEditFinanceiro && (
                <Button onClick={() => setImportarOpen(true)} variant="outline" className="rounded-full">
                  <FileUp className="h-4 w-4" /> Importar relatório financeiro
                </Button>
              )}
              {canManageMoradores && (
                <Button onClick={() => setNewMoradorOpen(true)} className="rounded-full">
                  <Plus className="h-4 w-4" /> Cadastrar morador
                </Button>
              )}
              {canCadastrarFuncionario && (
                <Button onClick={() => setNewFuncionarioOpen(true)} variant="outline" className="rounded-full">
                  <Plus className="h-4 w-4" /> Cadastrar funcionário
                </Button>
              )}
            </div>
          </div>

          {podeVerFinanceiro && fundoObrasTotal !== null && fundoObrasTotal > 0 && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 px-4 py-2.5 text-sm">
              <Hammer className="h-4 w-4 text-[color:var(--gold)]" />
              <span>
                Fundo de Obras arrecadado: <strong>{fundoObrasTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
              </span>
            </div>
          )}

          {canEditFinanceiro && (
            <ImportarRelatorioDialog
              open={importarOpen}
              onOpenChange={setImportarOpen}
              condominioId={profile.condominio_id}
              meuProfileId={profile.id}
              onImportado={loadFinanceiro}
            />
          )}

          {finLoading ? (
            <div className="mt-8 rounded-2xl border border-border bg-card py-8 text-center text-sm text-muted-foreground shadow-[var(--shadow-soft)]">
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            </div>
          ) : moradores.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-border bg-card py-8 text-center text-sm text-muted-foreground shadow-[var(--shadow-soft)]">
              Nenhuma unidade cadastrada.
            </div>
          ) : (
            <>
              {/* Mobile: cards empilhados agrupados por bloco (a tabela não cabe em telas estreitas) */}
              <div className="mt-8 grid gap-3 md:hidden">
                {moradoresPorBloco.map(([bloco, lista]) => {
                  const open = openBlocos.has(bloco);
                  return (
                    <div key={bloco}>
                      <button
                        type="button"
                        onClick={() => toggleBloco(bloco)}
                        aria-expanded={open}
                        className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-[var(--shadow-soft)]"
                      >
                        <span className="font-medium">
                          {bloco === BLOCO_FUNCIONARIOS ? bloco : `Bloco ${bloco}`}{" "}
                          <span className="font-normal text-muted-foreground">
                            · {lista.length}{" "}
                            {bloco === BLOCO_FUNCIONARIOS
                              ? lista.length === 1 ? "funcionário" : "funcionários"
                              : lista.length === 1 ? "unidade" : "unidades"}
                          </span>
                        </span>
                        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                      </button>
                      {open && (
                        <ul className="mt-3 grid gap-3">
                          {lista.map((m) => {
                            const isFuncionario = m.unidade == null;
                            const row = historico.find((h) => h.unidade_id === m.id && h.ano === currentYear && h.mes === currentMonth);
                            const uiStatus: FinancialStatus = row ? HISTORICO_DB_TO_UI[row.status] : "Pendente";
                            const podeHistorico = podeVerFinanceiro && !isFuncionario;
                            const podeExcluir =
                              (canDeleteMorador && (!m.role || m.role === "morador")) ||
                              (isAdminAgencia && m.role === "sindica");
                            return (
                              <li
                                key={m.id}
                                onClick={podeHistorico ? () => setHistoryUnitId(m.id) : undefined}
                                className={`min-w-0 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] ${podeHistorico ? "cursor-pointer" : ""}`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    {m.unidade && <p className="font-mono text-sm font-semibold">{m.unidade}</p>}
                                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                      {m.nome_completo}
                                      {m.role && m.role !== "morador" && (
                                        <span className="ml-1.5 inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                          {ROLE_LABEL[m.role]}
                                        </span>
                                      )}
                                      {m.titulo_funcao && (
                                        <span className="ml-1.5 inline-flex items-center rounded-full bg-[color:var(--gold)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--gold)]">
                                          {m.titulo_funcao}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  {podeVerFinanceiro && !isFuncionario && (
                                    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[uiStatus]}`}>
                                      {uiStatus}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                                  {podeHistorico && (
                                    <Button variant="outline" size="sm" className="h-9 rounded-full" onClick={() => setHistoryUnitId(m.id)}>
                                      <History className="h-3.5 w-3.5" /> Histórico
                                    </Button>
                                  )}
                                  {canManageMoradores && (
                                    <Button variant="outline" size="sm" className="h-9 rounded-full" onClick={() => setEditMorador(m)}>
                                      <Pencil className="h-3.5 w-3.5" /> Editar
                                    </Button>
                                  )}
                                  {canManagePermissoes && (
                                    <Button variant="outline" size="sm" className="h-9 rounded-full" onClick={() => setFuncaoMorador(m)}>
                                      <ShieldCheck className="h-3.5 w-3.5" /> Gerenciar função
                                    </Button>
                                  )}
                                  {isAdminAgencia && (
                                    <Button variant="outline" size="sm" className="h-9 rounded-full" onClick={() => setPromoteMoradorId(m.id)}>
                                      <ShieldCheck className="h-3.5 w-3.5" /> Promover
                                    </Button>
                                  )}
                                  {podeExcluir && (
                                    <Button variant="outline" size="sm" className="h-9 rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteAlvo(m)}>
                                      <Trash2 className="h-3.5 w-3.5" /> Excluir
                                    </Button>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop: tabela agrupada por bloco */}
              <div className="mt-8 hidden overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Unidade</TableHead>
                      <TableHead>Morador responsável</TableHead>
                      {podeVerFinanceiro && (
                        <TableHead>Status ({MONTH_NAMES_PT_SHORT[currentMonth - 1]}/{currentYear})</TableHead>
                      )}
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {moradoresPorBloco.map(([bloco, lista]) => {
                      const open = openBlocos.has(bloco);
                      return (
                        <Fragment key={bloco}>
                          <TableRow
                            onClick={() => toggleBloco(bloco)}
                            className="cursor-pointer bg-secondary/40 hover:bg-secondary/60"
                            aria-expanded={open}
                          >
                            <TableCell colSpan={podeVerFinanceiro ? 4 : 3} className="font-medium">
                              <div className="flex items-center gap-2">
                                <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                                {bloco === BLOCO_FUNCIONARIOS ? bloco : `Bloco ${bloco}`}{" "}
                                <span className="font-normal text-muted-foreground">
                                  · {lista.length}{" "}
                                  {bloco === BLOCO_FUNCIONARIOS
                                    ? lista.length === 1 ? "funcionário" : "funcionários"
                                    : lista.length === 1 ? "unidade" : "unidades"}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                          {open &&
                            lista.map((m) => {
                              const isFuncionario = m.unidade == null;
                              const row = historico.find((h) => h.unidade_id === m.id && h.ano === currentYear && h.mes === currentMonth);
                              const uiStatus: FinancialStatus = row ? HISTORICO_DB_TO_UI[row.status] : "Pendente";
                              const podeHistorico = podeVerFinanceiro && !isFuncionario;
                              const podeExcluir =
                                (canDeleteMorador && (!m.role || m.role === "morador")) ||
                                (isAdminAgencia && m.role === "sindica");
                              return (
                                <TableRow
                                  key={m.id}
                                  onClick={podeHistorico ? () => setHistoryUnitId(m.id) : undefined}
                                  className={podeHistorico ? "cursor-pointer" : ""}
                                >
                                  <TableCell className="font-mono font-semibold">{m.unidade ?? "—"}</TableCell>
                                  <TableCell>
                                    {m.nome_completo}
                                    {m.role && m.role !== "morador" && (
                                      <span className="ml-1.5 inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                        {ROLE_LABEL[m.role]}
                                      </span>
                                    )}
                                    {m.titulo_funcao && (
                                      <span className="ml-1.5 inline-flex items-center rounded-full bg-[color:var(--gold)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--gold)]">
                                        {m.titulo_funcao}
                                      </span>
                                    )}
                                  </TableCell>
                                  {podeVerFinanceiro && (
                                    <TableCell>
                                      {!isFuncionario && (
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[uiStatus]}`}>
                                          {uiStatus}
                                        </span>
                                      )}
                                    </TableCell>
                                  )}
                                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-end gap-2">
                                      {podeHistorico && (
                                        <Button variant="outline" size="sm" className="h-9 rounded-full" onClick={() => setHistoryUnitId(m.id)}>
                                          <History className="h-3.5 w-3.5" /> Histórico
                                        </Button>
                                      )}
                                      {canManageMoradores && (
                                        <Button variant="outline" size="sm" className="h-9 rounded-full" onClick={() => setEditMorador(m)}>
                                          <Pencil className="h-3.5 w-3.5" /> Editar
                                        </Button>
                                      )}
                                      {canManagePermissoes && (
                                        <Button variant="outline" size="sm" className="h-9 rounded-full" onClick={() => setFuncaoMorador(m)}>
                                          <ShieldCheck className="h-3.5 w-3.5" /> Gerenciar função
                                        </Button>
                                      )}
                                      {isAdminAgencia && (
                                        <Button variant="outline" size="sm" className="h-9 rounded-full" onClick={() => setPromoteMoradorId(m.id)}>
                                          <ShieldCheck className="h-3.5 w-3.5" /> Promover
                                        </Button>
                                      )}
                                      {podeExcluir && (
                                        <Button variant="outline" size="sm" className="h-9 rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteAlvo(m)}>
                                          <Trash2 className="h-3.5 w-3.5" /> Excluir
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </section>

      {podeVerFinanceiro && (
        <PaymentHistoryDialog
          moradorId={historyUnitId}
          moradores={moradores}
          historico={historico}
          year={currentYear}
          onClose={() => setHistoryUnitId(null)}
          onChange={handleHistoricoChange}
        />
      )}

      {canManageMoradores && (
        <>
          <NewMoradorDialog
            open={newMoradorOpen}
            onOpenChange={setNewMoradorOpen}
            condominioId={profile.condominio_id}
            onCreated={loadFinanceiro}
          />
          <EditMoradorDialog
            morador={editMorador}
            onOpenChange={(v) => { if (!v) setEditMorador(null); }}
            onSaved={loadFinanceiro}
          />
        </>
      )}

      {canCadastrarFuncionario && (
        <NewFuncionarioDialog
          open={newFuncionarioOpen}
          onOpenChange={setNewFuncionarioOpen}
          condominioId={profile.condominio_id}
          onCreated={loadFinanceiro}
        />
      )}

      {canDeleteMorador && (
        <ConfirmDeleteMoradorDialog
          morador={deleteAlvo}
          onOpenChange={(v) => { if (!v) setDeleteAlvo(null); }}
          onConfirm={handleDeleteMorador}
        />
      )}

      {isAdminAgencia && (
        <ConfirmPromoteMoradorDialog
          open={promoteMoradorId !== null}
          onOpenChange={(v) => { if (!v) setPromoteMoradorId(null); }}
          onConfirm={handlePromoteMorador}
        />
      )}

      {canManagePermissoes && (
        <FuncaoPermissoesDialog
          morador={funcaoMorador}
          onOpenChange={(v) => { if (!v) setFuncaoMorador(null); }}
          onSaved={loadFinanceiro}
        />
      )}
    </>
  );
}

// Gestão de votações — usada pela síndica/admin_agencia (sempre) e por quem
// tem a permissão granular "gerenciar_votacoes". Sem essa permissão, a
// seção inteira não existe pra essa pessoa (não tem visão parcial: ou
// gerencia, ou nem aparece — não existe "gerenciar_votacoes" parcial na
// lista de permissões).
function VotacoesAdminSection({ condominioId, canManage }: { condominioId: string; canManage: boolean }) {
  const [pautas, setPautas] = useState<PautaRow[]>([]);
  const [pautasLoading, setPautasLoading] = useState(true);
  const [pautasEncerradas, setPautasEncerradas] = useState<PautaRow[]>([]);
  const [pautasEncerradasLoading, setPautasEncerradasLoading] = useState(true);
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);
  const [encerrarPautaId, setEncerrarPautaId] = useState<string | null>(null);
  const [deletePautaId, setDeletePautaId] = useState<string | null>(null);
  const [newPautaOpen, setNewPautaOpen] = useState(false);

  const loadPautas = useCallback(async () => {
    setPautasLoading(true);
    try { setPautas(await fetchPautasAtivas(condominioId)); }
    catch (e) { console.error(e); toast.error("Erro ao carregar pautas."); }
    finally { setPautasLoading(false); }
  }, [condominioId]);

  const loadPautasEncerradas = useCallback(async () => {
    setPautasEncerradasLoading(true);
    try { setPautasEncerradas(await fetchPautasEncerradas(condominioId)); }
    catch (e) { console.error(e); toast.error("Erro ao carregar histórico de votações."); }
    finally { setPautasEncerradasLoading(false); }
  }, [condominioId]);

  useEffect(() => {
    if (!canManage) return;
    loadPautas();
    loadPautasEncerradas();
  }, [canManage, loadPautas, loadPautasEncerradas]);

  const handleEncerrarPauta = async () => {
    if (!encerrarPautaId) return;
    try {
      await encerrarPauta(encerrarPautaId);
      toast.success("Votação finalizada.");
      setEncerrarPautaId(null);
      loadPautas();
      loadPautasEncerradas();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao finalizar votação.");
    }
  };

  const handleDeletePauta = async () => {
    if (!deletePautaId) return;
    try {
      await excluirPauta(deletePautaId);
      toast.success("Votação excluída.");
      setDeletePautaId(null);
      loadPautas();
      loadPautasEncerradas();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir votação.");
    }
  };

  if (!canManage) return null;

  return (
    <>
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
                <Vote className="h-3.5 w-3.5" /> Votações
              </span>
              <h2 className="mt-3 text-3xl font-medium md:text-4xl">Resultados em tempo real</h2>
              <p className="mt-4 text-muted-foreground">
                Visível apenas para quem gerencia votações. Os moradores não enxergam os parciais.
              </p>
            </div>
            <Button onClick={() => setNewPautaOpen(true)} className="rounded-full">
              <Plus className="h-4 w-4" /> Nova pauta
            </Button>
          </div>

          <Tabs defaultValue="ativas" className="mt-8">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-full bg-card p-1.5 shadow-[var(--shadow-soft)] sm:w-auto sm:flex-nowrap">
              <TabsTrigger value="ativas" className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:px-5 sm:py-2 sm:text-sm">Ativas</TabsTrigger>
              <TabsTrigger value="encerradas" className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:px-5 sm:py-2 sm:text-sm">
                <History className="h-3.5 w-3.5" /> Encerradas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ativas" className="mt-6 space-y-4">
              {pautasLoading ? (
                <LoadingBlock label="Carregando pautas…" />
              ) : pautas.length === 0 ? (
                <EmptyState>Nenhuma pauta ativa no momento.</EmptyState>
              ) : (
                pautas.map((p) => (
                  <PollAdminCard
                    key={p.id}
                    pauta={p}
                    expanded={expandedAudit === p.id}
                    onToggleAudit={() => setExpandedAudit((cur) => (cur === p.id ? null : p.id))}
                    onFinalize={() => setEncerrarPautaId(p.id)}
                    onDelete={() => setDeletePautaId(p.id)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="encerradas" className="mt-6 space-y-4">
              {pautasEncerradasLoading ? (
                <LoadingBlock label="Carregando histórico…" />
              ) : pautasEncerradas.length === 0 ? (
                <EmptyState>Nenhuma votação encerrada ainda.</EmptyState>
              ) : (
                pautasEncerradas.map((p) => (
                  <PollAdminCard
                    key={p.id}
                    pauta={p}
                    expanded={expandedAudit === p.id}
                    onToggleAudit={() => setExpandedAudit((cur) => (cur === p.id ? null : p.id))}
                    onDelete={() => setDeletePautaId(p.id)}
                    encerrada
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <NewPautaDialog
        open={newPautaOpen}
        onOpenChange={setNewPautaOpen}
        condominioId={condominioId}
        onCreated={loadPautas}
      />
      <ConfirmEncerrarPautaDialog
        open={encerrarPautaId !== null}
        onOpenChange={(v) => { if (!v) setEncerrarPautaId(null); }}
        onConfirm={handleEncerrarPauta}
      />
      <ConfirmDeletePautaDialog
        open={deletePautaId !== null}
        onOpenChange={(v) => { if (!v) setDeletePautaId(null); }}
        onConfirm={handleDeletePauta}
      />
    </>
  );
}

// Gestão de obras — síndica/admin_agencia sempre, ou quem tem a permissão
// granular "gerenciar_obras". Assim como votações, não existe um nível
// parcial: ou a pessoa gerencia obras, ou a seção não aparece pra ela (a
// visualização somente-leitura das obras já existe pros moradores em
// ResidentDashboard, fora deste componente).
function ObrasAdminSection({ condominioId, canManage }: { condominioId: string; canManage: boolean }) {
  const [obras, setObras] = useState<ObraRow[]>([]);
  const [obrasLoading, setObrasLoading] = useState(true);
  const [newObraOpen, setNewObraOpen] = useState(false);
  const [editObra, setEditObra] = useState<ObraRow | null>(null);
  const [deleteObraId, setDeleteObraId] = useState<string | null>(null);

  const loadObras = useCallback(async () => {
    setObrasLoading(true);
    try { setObras(await fetchObras(condominioId)); }
    catch (e) { console.error(e); toast.error("Erro ao carregar obras."); }
    finally { setObrasLoading(false); }
  }, [condominioId]);

  useEffect(() => {
    if (!canManage) return;
    loadObras();
  }, [canManage, loadObras]);

  const handleDeleteObra = async () => {
    if (!deleteObraId) return;
    try {
      await removerObra(deleteObraId);
      toast.success("Obra excluída.");
      setDeleteObraId(null);
      loadObras();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir obra.");
    }
  };

  if (!canManage) return null;

  return (
    <>
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
                <Hammer className="h-3.5 w-3.5" /> Obras
              </span>
              <h2 className="mt-3 text-3xl font-medium md:text-4xl">Andamento das obras</h2>
              <p className="mt-4 text-muted-foreground">
                Publique atualizações e ajuste o progresso das obras em andamento.
              </p>
            </div>
            <Button onClick={() => setNewObraOpen(true)} className="rounded-full">
              <Plus className="h-4 w-4" /> Nova obra
            </Button>
          </div>

          {obrasLoading ? (
            <div className="mt-10"><LoadingBlock label="Carregando obras…" /></div>
          ) : (
            <>
              <div className="mt-10">
                <ObrasTabs obras={obras} admin onEdit={setEditObra} onDelete={(o) => setDeleteObraId(o.id)} onChanged={loadObras} />
              </div>
              <div className="mt-10 space-y-4">
                <h3 className="font-display text-lg font-semibold">Publicar atualização</h3>
                {obras.filter((o) => o.status === "em_andamento").length === 0 ? (
                  <EmptyState>Nenhuma obra em andamento para atualizar.</EmptyState>
                ) : (
                  obras
                    .filter((o) => o.status === "em_andamento")
                    .map((o) => (
                      <ObraUpdateForm key={o.id} obra={o} onSaved={loadObras} />
                    ))
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <NewObraDialog
        open={newObraOpen}
        onOpenChange={setNewObraOpen}
        condominioId={condominioId}
        onCreated={loadObras}
      />
      <EditObraDialog
        obra={editObra}
        onOpenChange={(v) => { if (!v) setEditObra(null); }}
        onSaved={loadObras}
      />
      <ConfirmDeleteObraDialog
        open={deleteObraId !== null}
        onOpenChange={(v) => { if (!v) setDeleteObraId(null); }}
        onConfirm={handleDeleteObra}
      />
    </>
  );
}

// Quem já pode aprovar visitante/reserva (sindica, admin_agencia, ou
// permissão granular) recebe um e-mail toda vez que entra um pedido
// pendente — a síndica escolhe aqui quem quer continuar recebendo. Só
// controla o e-mail, não a permissão em si (isso é "Gerenciar função").
function AlertasPendenciaSection({ condominioId }: { condominioId: string }) {
  const [destinatarios, setDestinatarios] = useState<DestinatarioAlerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setDestinatarios(await fetchDestinatariosAlertas(condominioId));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar destinatários de alerta.");
    } finally {
      setLoading(false);
    }
  }, [condominioId]);

  useEffect(() => { reload(); }, [reload]);

  const toggle = async (d: DestinatarioAlerta, checked: boolean) => {
    setSavingId(d.id);
    setDestinatarios((prev) => prev.map((x) => (x.id === d.id ? { ...x, receber_alertas_pendencia: checked } : x)));
    try {
      await definirRecebeAlertas(d.id, checked);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar preferência de alerta.");
      setDestinatarios((prev) => prev.map((x) => (x.id === d.id ? { ...x, receber_alertas_pendencia: !checked } : x)));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="border-t border-border bg-secondary/30 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
          <Bell className="h-3.5 w-3.5" /> Alertas por e-mail
        </span>
        <h2 className="mt-3 text-3xl font-medium md:text-4xl">Quem recebe aviso de pendência</h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Toda vez que chega um visitante ou reserva pendente, quem estiver marcado aqui recebe um
          e-mail. Desmarque quem não quiser mais receber.
        </p>

        {loading ? (
          <div className="mt-8"><LoadingBlock /></div>
        ) : destinatarios.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            Ninguém tem permissão de aprovar visitante/reserva ainda.
          </div>
        ) : (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {destinatarios.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {d.nome_completo}
                    {d.role !== "morador" && (
                      <span className="ml-1.5 inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        {ROLE_LABEL[d.role]}
                      </span>
                    )}
                    {d.titulo_funcao && (
                      <span className="ml-1.5 inline-flex items-center rounded-full bg-[color:var(--gold)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--gold)]">
                        {d.titulo_funcao}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[d.recebeAlertaVisitante && "visitantes", d.recebeAlertaReserva && "reservas"].filter(Boolean).join(" e ")}
                  </p>
                </div>
                <label className="flex shrink-0 items-center gap-2">
                  <Switch
                    checked={d.receber_alertas_pendencia}
                    onCheckedChange={(v) => toggle(d, v)}
                    disabled={savingId === d.id}
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function AdminDashboard({ profile, onLogout, adminAgenciaToggle, isAdminAgencia = false }: { profile: Profile; onLogout: () => void; adminAgenciaToggle?: ReactNode; isAdminAgencia?: boolean }) {
  const [reservas, setReservas] = useState<ReservaComMorador[]>([]);
  const [reservasLoading, setReservasLoading] = useState(true);

  // historico/moradores só existem aqui pros StatCards do topo — quem
  // busca e mantém esses dados de verdade é UnidadesCobrancasSection
  // (via onDataLoaded), pra não duplicar a query. Pautas/obras viraram
  // VotacoesAdminSection/ObrasAdminSection, cada uma com seu próprio fetch.
  const [historico, setHistorico] = useState<HistoricoRow[]>([]);
  const [moradores, setMoradores] = useState<MoradorInfo[]>([]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [blockOpen, setBlockOpen] = useState(false);

  const loadReservas = useCallback(async () => {
    setReservasLoading(true);
    try { setReservas(await fetchReservasDoCondominio(profile.condominio_id)); }
    catch (e) { console.error(e); toast.error("Erro ao carregar reservas."); }
    finally { setReservasLoading(false); }
  }, [profile.condominio_id]);

  useEffect(() => {
    loadReservas();
  }, [loadReservas]);

  const stats = useMemo(() => {
    const counts: Record<FinancialStatus, number> = { "Em dia": 0, Pendente: 0, Atrasado: 0 };
    // Funcionário puro (unidade null) não paga condomínio — não entra na
    // contagem de inadimplência. Morador com cargo continua contando
    // normalmente, porque ele tem unidade e paga como qualquer morador.
    moradores.filter((m) => m.unidade != null).forEach((m) => {
      const row = historico.find(
        (h) => h.unidade_id === m.id && h.ano === currentYear && h.mes === currentMonth,
      );
      const s = row ? HISTORICO_DB_TO_UI[row.status] : "Pendente";
      counts[s] += 1;
    });
    return counts;
  }, [historico, moradores, currentYear, currentMonth]);

  const handleApprove = async (id: string) => {
    try {
      await aprovarReserva(id);
      toast.success("Reserva aprovada!");
      loadReservas();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao aprovar.");
    }
  };

  const handleReject = async (id: string, motivo: string) => {
    try {
      await recusarReserva(id, motivo);
      toast.error("Reserva recusada.");
      loadReservas();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao recusar.");
    }
  };

  const handleDeleteBloqueio = async (id: string) => {
    try {
      await removerReserva(id);
      toast.success("Bloqueio removido.");
      loadReservas();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover bloqueio.");
    }
  };

  const handleDeleteReserva = async (id: string) => {
    if (!confirm("Excluir esta reserva? Esta ação não pode ser desfeita.")) return;
    try {
      await removerReserva(id);
      toast.success("Reserva excluída.");
      loadReservas();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir reserva.");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Building2 className="h-6 w-6 shrink-0 text-primary" />
            <span className="font-display truncate text-base font-semibold tracking-tight sm:text-lg">
              <span className="sm:hidden">Cond. M. Arcanjo</span>
              <span className="hidden sm:inline">Condomínio Residencial Miguel Arcanjo</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--gold)]/20 px-2.5 py-0.5 text-xs font-semibold text-[color:var(--gold)]">
              <ShieldCheck className="h-3 w-3" /> <span className="hidden sm:inline">Painel da </span>Síndica
            </span>
          </div>
          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 text-sm sm:flex">
              <AdminPendenciasBadge condominioId={profile.condominio_id} />
              <span className="font-medium capitalize">{profile.nome_completo}</span>
            </div>
            <div className="flex sm:hidden">
              <AdminPendenciasBadge condominioId={profile.condominio_id} />
            </div>
            {adminAgenciaToggle}
            <Button onClick={onLogout} variant="outline" size="sm" className="shrink-0 rounded-full">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </nav>
      </header>


      <section className="border-b border-border bg-secondary/30">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--gold)]">
            <ShieldCheck className="h-3.5 w-3.5" /> Acesso administrativo
          </span>
          <h1 className="mt-3 font-display text-4xl font-medium md:text-5xl">
            Painel da <span className="italic text-primary">Síndica</span>
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Gerencie unidades, reservas, votações e obras do condomínio.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard label="Em dia" value={stats["Em dia"]} accent="var(--sage)" />
            <StatCard label="Pendentes" value={stats["Pendente"]} accent="var(--gold)" />
            <StatCard label="Atrasados" value={stats["Atrasado"]} accent="hsl(var(--destructive))" />
          </div>
        </div>
      </section>

      <UnidadesCobrancasSection
        profile={profile}
        canView
        canEditFinanceiro
        canManageMoradores
        canDeleteMorador
        canCadastrarFuncionario
        canManagePermissoes
        isAdminAgencia={isAdminAgencia}
        onDataLoaded={(h, m) => { setHistorico(h); setMoradores(m); }}
      />
      <AlertasPendenciaSection condominioId={profile.condominio_id} />
      <VotacoesAdminSection condominioId={profile.condominio_id} canManage />

      {/* Reservas */}
      <div id="admin-reservas">
        <ReservationsManagement
          reservas={reservas}
          loading={reservasLoading}
          onApprove={handleApprove}
          onReject={handleReject}
          onBlock={() => setBlockOpen(true)}
          onDeleteBloqueio={handleDeleteBloqueio}
          onDeleteReserva={handleDeleteReserva}
        />
      </div>

      <ObrasAdminSection condominioId={profile.condominio_id} canManage />

      {/* Documentos admin */}
      <div id="admin-classificados">
        <ClassificadosAdminSection condominioId={profile.condominio_id} />
      </div>

      <div id="admin-visitantes">
        <VisitantesAdminSection condominioId={profile.condominio_id} />
      </div>

      <div id="admin-chamados">
        <ChamadosAdminSection condominioId={profile.condominio_id} />
      </div>

      <div id="admin-mensagens">
        <MensagensExternasAdminSection condominioId={profile.condominio_id} />
      </div>

      <DocumentsAdminSection condominioId={profile.condominio_id} />

      <LandingConfigSection condominioId={profile.condominio_id} />

      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-6 text-center text-sm text-muted-foreground">
          <span>
            © {new Date().getFullYear()} Portal Condomínio Residencial Miguel Arcanjo · Painel administrativo
          </span>
          <Link to="/privacidade" className="underline-offset-2 hover:text-foreground hover:underline">
            Política de Privacidade
          </Link>
        </div>
      </footer>


      <BlockDateDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        profile={profile}
        onCreated={loadReservas}
      />
    </>
  );
}

// ================== NEW MORADOR / OBRA / PAUTA DIALOGS ==================

function NewMoradorDialog({
  open,
  onOpenChange,
  condominioId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  condominioId: string;
  onCreated: () => void;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [bloco, setBloco] = useState<"A" | "B">("A");
  const [apartamento, setApartamento] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setNome(""); setEmail(""); setBloco("A"); setApartamento(""); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !apartamento.trim()) {
      toast.error("Preencha nome, email e apartamento.");
      return;
    }
    setSaving(true);
    try {
      await criarMorador({
        condominio_id: condominioId,
        nome_completo: nome.trim(),
        email: email.trim(),
        bloco,
        apartamento: apartamento.trim(),
      });
      toast.success("Morador cadastrado! Senha provisória: Mudar@123");
      reset();
      onOpenChange(false);
      onCreated();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? `Erro ao cadastrar: ${err.message}` : "Erro ao cadastrar morador.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Cadastrar morador</DialogTitle>
          <DialogDescription>
            Uma conta será criada com senha provisória <strong>Mudar@123</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nm-nome">Nome completo</Label>
            <Input id="nm-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nm-email">Email</Label>
            <Input id="nm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="nm-bloco">Bloco</Label>
              <Select value={bloco} onValueChange={(v) => setBloco(v as "A" | "B")}>
                <SelectTrigger id="nm-bloco"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nm-apto">Apartamento</Label>
              <Input id="nm-apto" value={apartamento} onChange={(e) => setApartamento(e.target.value)} placeholder="Ex.: 301" required />
            </div>
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Cadastrar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewFuncionarioDialog({
  open,
  onOpenChange,
  condominioId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  condominioId: string;
  onCreated: () => void;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [tituloFuncao, setTituloFuncao] = useState("");
  const [selecionadas, setSelecionadas] = useState<Set<Permissao>>(new Set());
  const [saving, setSaving] = useState(false);

  const reset = () => { setNome(""); setEmail(""); setTituloFuncao(""); setSelecionadas(new Set()); };

  const toggle = (perm: Permissao, checked: boolean) => {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (checked) next.add(perm);
      else next.delete(perm);
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      toast.error("Preencha nome e email.");
      return;
    }
    setSaving(true);
    try {
      await criarFuncionario({
        condominio_id: condominioId,
        nome_completo: nome.trim(),
        email: email.trim(),
        titulo_funcao: tituloFuncao.trim() || undefined,
        permissoes: Array.from(selecionadas),
      });
      toast.success("Funcionário cadastrado! Senha provisória: Mudar@123");
      reset();
      onOpenChange(false);
      onCreated();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? `Erro ao cadastrar: ${err.message}` : "Erro ao cadastrar funcionário.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Cadastrar funcionário</DialogTitle>
          <DialogDescription>
            Acesso restrito só ao que for marcado abaixo (ex.: zelador, porteiro). Uma conta será
            criada com senha provisória <strong>Mudar@123</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nf-nome">Nome completo</Label>
            <Input id="nf-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nf-email">Email</Label>
            <Input id="nf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nf-funcao">Função (aparece como badge, ex.: Zelador)</Label>
            <Input id="nf-funcao" value={tituloFuncao} onChange={(e) => setTituloFuncao(e.target.value)} placeholder="Ex.: Zelador" />
          </div>
          <div className="space-y-2">
            <Label>Permissões</Label>
            <div className="grid gap-2.5 rounded-xl border border-border p-3">
              {PERMISSOES_DISPONIVEIS.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <Checkbox checked={selecionadas.has(p.id)} onCheckedChange={(v) => toggle(p.id, v === true)} />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Cadastrar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewObraDialog({
  open,
  onOpenChange,
  condominioId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  condominioId: string;
  onCreated: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState<ObraRow["status"]>("planejado");
  const [progresso, setProgresso] = useState(0);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return toast.error("Informe o título da obra.");
    setSaving(true);
    try {
      await criarObra({
        condominio_id: condominioId,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        status,
        progresso_atual: Math.max(0, Math.min(100, progresso)),
      });
      toast.success("Obra cadastrada.");
      setTitulo(""); setDescricao(""); setStatus("planejado"); setProgresso(0);
      onOpenChange(false);
      onCreated();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao cadastrar obra.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Nova obra</DialogTitle>
          <DialogDescription>Cadastre uma obra do condomínio.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="no-titulo">Título</Label>
            <Input id="no-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="no-desc">Descrição</Label>
            <Textarea id="no-desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ObraRow["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planejado">Planejado</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="no-prog">Progresso atual (%)</Label>
            <Input
              id="no-prog"
              type="number"
              min={0}
              max={100}
              value={progresso}
              onChange={(e) => setProgresso(Number(e.target.value))}
            />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Cadastrar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewPautaDialog({
  open,
  onOpenChange,
  condominioId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  condominioId: string;
  onCreated: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !dataInicio || !dataFim) {
      toast.error("Preencha título e datas.");
      return;
    }
    setSaving(true);
    try {
      await criarPauta({
        condominio_id: condominioId,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        data_inicio: dataInicio,
        data_fim: dataFim,
      });
      toast.success("Pauta cadastrada.");
      setTitulo(""); setDescricao(""); setDataInicio(""); setDataFim("");
      onOpenChange(false);
      onCreated();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao cadastrar pauta.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Nova pauta de votação</DialogTitle>
          <DialogDescription>A pauta será criada com status "ativa".</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="np-titulo">Título</Label>
            <Input id="np-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="np-desc">Descrição</Label>
            <Textarea id="np-desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="np-ini">Início</Label>
              <Input id="np-ini" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="np-fim">Fim</Label>
              <Input id="np-fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} required />
            </div>
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Cadastrar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}


// ================== POLL ADMIN CARD ==================

type VotoDetail = {
  id: string;
  voto: "sim" | "nao";
  created_at: string;
  morador: { nome_completo: string; unidade: string } | null;
};

function PollAdminCard({
  pauta,
  expanded,
  onToggleAudit,
  onFinalize,
  onDelete,
  encerrada = false,
}: {
  pauta: PautaRow;
  expanded: boolean;
  onToggleAudit: () => void;
  onFinalize?: () => void;
  onDelete: () => void;
  encerrada?: boolean;
}) {
  const [votos, setVotos] = useState<VotoDetail[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setVotos(await fetchVotosDePauta(pauta.id));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar votos.");
    } finally {
      setLoading(false);
    }
  }, [pauta.id]);

  useEffect(() => { load(); }, [load]);

  const yes = votos?.filter((v) => v.voto === "sim").length ?? 0;
  const no = votos?.filter((v) => v.voto === "nao").length ?? 0;
  const total = yes + no;
  const yesPct = total === 0 ? 0 : Math.round((yes / total) * 100);
  const noPct = total === 0 ? 0 : 100 - yesPct;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium leading-snug">{pauta.titulo}</p>
            {encerrada && (
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Encerrada
              </span>
            )}
          </div>
          {pauta.descricao && <p className="mt-1 text-xs text-muted-foreground">{pauta.descricao}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          {loading ? "…" : `${total} ${total === 1 ? "voto" : "votos"}`}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-[color:var(--sage)]">Sim — {yes}</span>
            <span className="font-mono text-muted-foreground">{yesPct}%</span>
          </div>
          <Progress value={yesPct} className="h-2.5 bg-secondary [&>div]:bg-[color:var(--sage)]" />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-destructive">Não — {no}</span>
            <span className="font-mono text-muted-foreground">{noPct}%</span>
          </div>
          <Progress value={noPct} className="h-2.5 bg-secondary [&>div]:bg-destructive" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Participação: <strong className="text-foreground">{total}</strong>{" "}
          {total === 1 ? "morador" : "moradores"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {onFinalize && (
            <Button type="button" size="sm" variant="outline" className="h-8 rounded-full text-xs" onClick={onFinalize}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Finalizar
            </Button>
          )}
          <Button type="button" size="sm" variant="outline" className="h-8 rounded-full text-xs text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-8 rounded-full text-xs" onClick={onToggleAudit} aria-expanded={expanded}>
            <Search className="h-3.5 w-3.5" />
            {expanded ? "Ocultar auditoria" : "Auditar votação"}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </div>

      {expanded && (
        <PollAuditTable loading={loading} votos={votos ?? []} yes={yes} no={no} />
      )}
    </div>
  );
}

// ================== AUDIT TABLE ==================

function PollAuditTable({
  loading,
  votos,
  yes,
  no,
}: {
  loading: boolean;
  votos: VotoDetail[];
  yes: number;
  no: number;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-top-2 mt-5 overflow-hidden rounded-xl border border-primary/15 bg-primary/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 bg-primary px-5 py-3 text-primary-foreground">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--gold)]" /> Registro de auditoria
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="rounded-full bg-white/10 px-2.5 py-0.5">
            Participantes: <strong className="font-mono">{votos.length}</strong>
          </span>
          <span className="rounded-full bg-[color:var(--sage)]/25 px-2.5 py-0.5">SIM: {yes}</span>
          <span className="rounded-full bg-destructive/30 px-2.5 py-0.5">NÃO: {no}</span>
        </div>
      </div>

      {loading ? (
        <p className="px-5 py-6 text-center text-sm text-muted-foreground">
          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
        </p>
      ) : votos.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-muted-foreground">
          Nenhum voto registrado até o momento.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Unidade</TableHead>
              <TableHead>Morador</TableHead>
              <TableHead className="w-[110px]">Voto</TableHead>
              <TableHead className="w-[180px] text-right">Data &amp; hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {votos.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs font-semibold">{r.morador?.unidade ?? "—"}</TableCell>
                <TableCell>{r.morador?.nome_completo ?? "—"}</TableCell>
                <TableCell>
                  {r.voto === "sim" ? (
                    <span className="inline-flex items-center rounded-full border border-[color:var(--sage)]/30 bg-[color:var(--sage)]/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[color:var(--sage)]">SIM</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-destructive">NÃO</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("pt-BR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ================== RESERVATIONS MANAGEMENT ==================

function ReservationsManagement({
  reservas,
  loading,
  onApprove,
  onReject,
  onBlock,
  onDeleteBloqueio,
  onDeleteReserva,
}: {
  reservas: ReservaComMorador[];
  loading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string, motivo: string) => void;
  onBlock?: () => void;
  onDeleteBloqueio?: (id: string) => void;
  onDeleteReserva?: (id: string) => void;
}) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const pending = reservas.filter((r) => r.status === "pendente");
  const processed = reservas.filter((r) => r.status === "aprovada" || r.status === "recusada");
  const bloqueios = reservas.filter((r) => r.status === "bloqueado");

  const confirmReject = (id: string) => {
    if (!reason.trim()) return;
    onReject(id, reason.trim());
    setRejectingId(null);
    setReason("");
  };

  return (
    <section className="bg-secondary/40 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--gold)]">
              <CalendarIcon className="h-3.5 w-3.5" /> Aprovações de espaços
            </span>
            <h2 className="mt-3 text-3xl font-medium md:text-4xl">Gerenciamento de Reservas</h2>
            <p className="mt-4 text-muted-foreground">
              Aprove ou recuse os pedidos enviados pelos moradores.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {onBlock && (
              <Button onClick={onBlock} variant="outline" className="rounded-full">
                <Lock className="h-4 w-4" /> Bloquear data
              </Button>
            )}
            <div className="shrink-0 whitespace-nowrap rounded-full bg-[color:var(--gold)]/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--gold)]">
              {pending.length} {pending.length === 1 ? "pedido pendente" : "pedidos pendentes"}
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Unidade</TableHead>
                <TableHead>Morador</TableHead>
                <TableHead>Espaço</TableHead>
                <TableHead className="w-[120px]">Data</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead className="w-[320px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : reservas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum pedido de reserva no momento.
                  </TableCell>
                </TableRow>
              ) : (
                [...pending, ...processed].map((r) => {
                  const rStatus = r.status as Exclude<typeof r.status, "bloqueado">;
                  const uiStatus = RESERVA_DB_TO_UI[rStatus];
                  const spaceName = RESERVATION_SPACES.find((s) => s.id === r.espaco)?.name ?? r.espaco;
                  return (
                    <Fragment key={r.id}>
                      <TableRow>
                        <TableCell className="font-mono text-xs font-semibold">{r.morador?.unidade ?? "—"}</TableCell>
                        <TableCell>{r.morador?.nome_completo ?? "—"}</TableCell>
                        <TableCell>
                          {spaceName}
                          {r.observacoes && (
                            <p className="mt-0.5 text-[11px] italic text-muted-foreground">
                              Obs.: {r.observacoes}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {fmtDataReserva(r.data_inicio)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${RESERVATION_STATUS_STYLES[uiStatus]}`}>
                            {uiStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {r.status === "pendente" ? (
                              rejectingId === r.id ? null : (
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" className="h-8 rounded-full bg-[color:var(--sage)] text-primary-foreground hover:opacity-90" onClick={() => onApprove(r.id)}>
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8 rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => { setRejectingId(r.id); setReason(""); }}>
                                    <XCircle className="h-3.5 w-3.5" /> Recusar
                                  </Button>
                                </div>
                              )
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {uiStatus === "Confirmada" ? "Aprovada" : "Recusada"}
                                {r.status === "recusada" && r.motivo_recusa ? ` · ${r.motivo_recusa}` : ""}
                              </span>
                            )}
                            {onDeleteReserva && rejectingId !== r.id && (
                              <Button size="sm" variant="ghost" className="h-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onDeleteReserva(r.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {rejectingId === r.id && (
                        <TableRow key={`${r.id}-reject`}>
                          <TableCell colSpan={6} className="bg-destructive/5">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <Label htmlFor={`reason-${r.id}`} className="shrink-0 text-xs font-semibold uppercase tracking-wider text-destructive">
                                Motivo (obrigatório)
                              </Label>
                              <Input id={`reason-${r.id}`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: Manutenção, débito pendente…" className="h-9 flex-1" maxLength={200} autoFocus />
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="h-9 rounded-full" onClick={() => { setRejectingId(null); setReason(""); }}>
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-9 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => confirmReject(r.id)}
                                  disabled={!reason.trim()}
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Confirmar recusa
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Bloqueios ativos */}
        {onDeleteBloqueio && (
        <div className="mt-8">
          <h3 className="font-display text-xl font-medium">Datas bloqueadas</h3>
          <p className="mt-1 text-sm text-muted-foreground">Bloqueios impedem novas reservas nesses dias.</p>
          {bloqueios.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Nenhuma data bloqueada.
            </div>
          ) : (
            <ul className="mt-4 grid gap-2 md:grid-cols-2">
              {bloqueios.map((b) => {
                const spaceName = RESERVATION_SPACES.find((s) => s.id === b.espaco)?.name ?? b.espaco;
                return (
                  <li key={b.id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-3">
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-semibold">{spaceName} · <span className="font-mono">{fmtDataReserva(b.data_inicio)}</span></p>
                      {b.observacoes && <p className="text-xs text-destructive">{b.observacoes}</p>}
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onDeleteBloqueio(b.id)}>
                      <Trash2 className="h-3.5 w-3.5" /> Remover
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        )}
      </div>
    </section>
  );
}


// ================== RESERVATION MODULE (morador) ==================

function ReservationModule({
  onRequest,
  ocupacoes,
}: {
  onRequest: (spaceId: string, spaceName: string, dateIso: string, observacoes: string) => void;
  ocupacoes: OcupacaoRow[];
}) {
  const [selectedSpace, setSelectedSpace] = useState<string>(RESERVATION_SPACES[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });

  // Map iso -> ocupacao no espaço selecionado
  const ocupacaoByIso = useMemo(() => {
    const m = new Map<string, OcupacaoRow>();
    ocupacoes
      .filter((o) => o.espaco === selectedSpace)
      .forEach((o) => m.set(o.data_inicio, o));
    return m;
  }, [ocupacoes, selectedSpace]);

  const monthGrid = useMemo(() => {
    const { year, month } = viewMonth;
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: ({ iso: string; day: number; past: boolean } | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dateObj = new Date(year, month, d);
      cells.push({ iso, day: d, past: dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate()) });
    }
    return cells;
  }, [viewMonth, today]);

  const goMonth = (delta: number) => {
    setSelectedDate(null);
    setViewMonth((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const space = RESERVATION_SPACES.find((s) => s.id === selectedSpace);

  const submit = () => {
    if (!space) return toast.error("Nenhum espaço configurado.");
    if (!selectedDate) return toast.error("Escolha uma data disponível.");
    onRequest(space.id, space.name, selectedDate, observacoes);
    setSelectedDate(null);
    setObservacoes("");
  };

  const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap gap-2">
          {RESERVATION_SPACES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => { setSelectedSpace(s.id); setSelectedDate(null); }}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selectedSpace === s.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3 py-2">
          <Button type="button" size="icon" variant="ghost" className="h-9 w-9 rounded-full" onClick={() => goMonth(-1)} aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="font-display text-base font-semibold capitalize sm:text-lg">
            {MONTH_NAMES_PT[viewMonth.month]} {viewMonth.year}
          </p>
          <Button type="button" size="icon" variant="ghost" className="h-9 w-9 rounded-full" onClick={() => goMonth(1)} aria-label="Próximo mês">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {weekdayLabels.map((w) => (<span key={w}>{w}</span>))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">
          {monthGrid.map((cell, idx) => {
            if (!cell) return <span key={`e-${idx}`} className="aspect-square" />;
            const isSelected = selectedDate === cell.iso;
            const oc = ocupacaoByIso.get(cell.iso);
            const isBlocked = oc?.status === "bloqueado";
            const isReserved = oc?.status === "aprovada";
            const blockedLabel = isBlocked ? (oc?.observacoes?.trim() || "Bloqueado") : "";
            const disabled = cell.past || isBlocked || isReserved;
            const baseClass = cell.past
              ? "cursor-not-allowed border-border bg-secondary/40 opacity-40"
              : isBlocked
                ? "cursor-not-allowed border-destructive/50 bg-destructive/10 text-destructive"
                : isReserved
                  ? "cursor-not-allowed border-[color:var(--gold)]/50 bg-[color:var(--gold)]/15 text-[color:var(--gold)]"
                  : isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                    : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/50";
            const button = (
              <button
                key={cell.iso}
                type="button"
                disabled={disabled}
                onClick={() => setSelectedDate(cell.iso)}
                className={`group relative flex aspect-square flex-col items-center justify-center rounded-lg border text-center transition-all ${baseClass}`}
              >
                <span className="font-display text-base font-semibold sm:text-lg">{cell.day}</span>
                {!cell.past && !isSelected && !isBlocked && !isReserved && (
                  <span className="mt-0.5 text-[9px] font-medium text-[color:var(--sage)]">Livre</span>
                )}
                {isBlocked && (
                  <span className="mt-0.5 line-clamp-2 block w-full px-0.5 text-[9px] font-semibold uppercase leading-tight tracking-tight break-words">
                    {blockedLabel}
                  </span>
                )}
                {isReserved && (
                  <span className="mt-0.5 text-[8px] font-semibold uppercase">Reservado</span>
                )}
              </button>
            );
            if (isBlocked) {
              return (
                <TooltipProvider key={cell.iso} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      {blockedLabel}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }
            return button;
          })}
        </div>

        {/* Legenda */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded border border-border bg-card" /> Disponível</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded border border-[color:var(--gold)]/50 bg-[color:var(--gold)]/15" /> Reservado</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded border border-destructive/50 bg-destructive/10" /> <span className="text-destructive">Manutenção</span></span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded border border-primary bg-primary" /> Selecionado</span>
        </div>
      </div>

      <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resumo da reserva</p>
        <h3 className="mt-3 font-display text-2xl font-medium">{space?.name ?? "—"}</h3>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Data:</strong>{" "}
            {selectedDate ? selectedDate.split("-").reverse().join("/") : "Selecione um dia"}
          </p>
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="rm-obs" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações (opcional)</Label>
          <Textarea id="rm-obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Ex.: Aniversário, ~30 pessoas" rows={3} maxLength={280} />
        </div>
        <Button onClick={submit} size="lg" className="mt-6 w-full rounded-full" disabled={!selectedDate || !space}>
          <Send className="h-4 w-4" /> Solicitar reserva
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          A administração confirma em até 24h úteis.
        </p>
      </div>
    </div>
  );
}


// ================== STAT CARD ==================

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `color-mix(in oklab, ${accent} 100%, transparent)` }} />
      </div>
      <p className="mt-3 font-display text-3xl font-medium">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">unidades</p>
    </div>
  );
}

// ================== OBRAS ==================

function ObrasTabs({
  obras,
  admin = false,
  onEdit,
  onDelete,
  onChanged,
}: {
  obras: ObraRow[];
  admin?: boolean;
  onEdit?: (o: ObraRow) => void;
  onDelete?: (o: ObraRow) => void;
  onChanged?: () => void;
}) {
  const completed = obras.filter((o) => o.status === "concluido" || o.progresso_atual >= 100);
  const inProgress = obras.filter((o) => o.status === "em_andamento");
  const planned = obras.filter((o) => o.status === "planejado");

  return (
    <Tabs defaultValue="inProgress" className="mt-10">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-full bg-card p-1.5 shadow-[var(--shadow-soft)] sm:w-auto sm:flex-nowrap">
        <TabsTrigger value="completed" className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:px-5 sm:py-2 sm:text-sm">Concluídas</TabsTrigger>
        <TabsTrigger value="inProgress" className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:px-5 sm:py-2 sm:text-sm">Em andamento</TabsTrigger>
        <TabsTrigger value="planned" className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:px-5 sm:py-2 sm:text-sm">Planejadas</TabsTrigger>
      </TabsList>

      <TabsContent value="completed" className="mt-10">
        {completed.length === 0 ? <EmptyState>Nenhuma obra concluída.</EmptyState> : <ObraTimeline items={completed} icon={CheckCircle2} accent="var(--sage)" admin={admin} onEdit={onEdit} onDelete={onDelete} onChanged={onChanged} />}
      </TabsContent>
      <TabsContent value="inProgress" className="mt-10">
        {inProgress.length === 0 ? <EmptyState>Nenhuma obra em andamento.</EmptyState> : <ObraTimeline items={inProgress} icon={Hammer} accent="var(--gold)" withUpdates admin={admin} onEdit={onEdit} onDelete={onDelete} onChanged={onChanged} />}
      </TabsContent>
      <TabsContent value="planned" className="mt-10">
        {planned.length === 0 ? <EmptyState>Nenhuma obra planejada.</EmptyState> : <ObraTimeline items={planned} icon={Clock} accent="var(--primary)" admin={admin} onEdit={onEdit} onDelete={onDelete} onChanged={onChanged} />}
      </TabsContent>
    </Tabs>
  );
}

function ObraTimeline({
  items,
  icon: Icon,
  accent,
  withUpdates = false,
  admin = false,
  onEdit,
  onDelete,
  onChanged,
}: {
  items: ObraRow[];
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  withUpdates?: boolean;
  admin?: boolean;
  onEdit?: (o: ObraRow) => void;
  onDelete?: (o: ObraRow) => void;
  onChanged?: () => void;
}) {
  return (
    <ol className="relative space-y-6 border-l-2 border-dashed border-border pl-8 md:grid md:grid-cols-3 md:items-start md:gap-6 md:space-y-0 md:border-0 md:pl-0">
      {items.map((item, i) => (
        <li key={item.id} className="relative rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <span className="absolute -left-[42px] top-7 grid h-8 w-8 place-items-center rounded-full text-primary-foreground md:hidden" style={{ backgroundColor: `color-mix(in oklab, ${accent} 100%, transparent)` }}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="hidden h-10 w-10 place-items-center rounded-full text-primary-foreground md:grid" style={{ backgroundColor: `color-mix(in oklab, ${accent} 100%, transparent)` }}>
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="mt-4 text-lg font-semibold leading-snug">{item.titulo}</h3>
          {item.descricao && <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground">{item.descricao}</p>}

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">Conclusão</span>
              <span className="font-mono font-semibold" style={{ color: accent }}>{item.progresso_atual}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full transition-all" style={{ width: `${item.progresso_atual}%`, backgroundColor: accent }} />
            </div>
          </div>

          {withUpdates && <ObraUpdatesGallery obraId={item.id} accent={accent} admin={admin} onChanged={onChanged} />}

          {admin && (onEdit || onDelete) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {onEdit && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 rounded-full text-xs"
                  onClick={() => onEdit(item)}
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
              )}
              {onDelete && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 rounded-full border-destructive/40 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDelete(item)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </Button>
              )}
            </div>
          )}

          <span className="absolute right-5 top-5 text-xs font-mono text-muted-foreground/60">0{i + 1}</span>
        </li>
      ))}
    </ol>
  );
}

function ObraUpdatesGallery({ obraId, accent, admin = false, onChanged }: { obraId: string; accent: string; admin?: boolean; onChanged?: () => void }) {
  const [items, setItems] = useState<ObraAtualizacaoRow[] | null>(null);
  const [active, setActive] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);

  const reload = useCallback(() => {
    fetchAtualizacoesObra(obraId).then((r) => {
      setItems(r);
      setActive(Math.max(0, r.length - 1));
    }).catch(() => setItems([]));
  }, [obraId]);

  useEffect(() => { reload(); }, [reload]);

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta atualização?")) return;
    setDeletingId(id);
    try {
      await removerAtualizacaoObra(id);
      toast.success("Atualização removida.");
      reload();
      onChanged?.();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao remover atualização.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!items) return <div className="mt-6"><Skeleton className="h-32 w-full rounded-xl" /></div>;
  if (items.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-border bg-secondary/30 p-4 text-center text-xs text-muted-foreground">
        Sem atualizações publicadas ainda.
      </div>
    );
  }

  const current = items[active];

  return (
    <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <ImageIcon className="h-3.5 w-3.5" style={{ color: accent }} />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Galeria de evolução</p>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-secondary">
        {current.foto_url ? (
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="group absolute inset-0 h-full w-full cursor-zoom-in"
            aria-label="Ver foto em tela cheia"
          >
            <img src={current.foto_url} alt={current.descricao ?? ""} className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
              <Maximize2 className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100" />
            </span>
          </button>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 opacity-70" />
            <p className="mt-2 text-[11px] font-medium uppercase tracking-widest opacity-80">Sem foto</p>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground shadow" style={{ backgroundColor: accent }}>
          {current.progresso}%
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-0.5 font-mono text-[11px] text-white backdrop-blur">
          {new Date(current.created_at).toLocaleDateString("pt-BR")}
        </span>
        {admin && (
          <button
            type="button"
            onClick={() => handleDelete(current.id)}
            disabled={deletingId === current.id}
            className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-destructive/90 text-destructive-foreground shadow transition hover:bg-destructive disabled:opacity-60"
            aria-label="Remover esta atualização"
          >
            {deletingId === current.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {current.descricao && (
        <p className="mt-3 text-xs leading-relaxed text-foreground">
          <strong>{current.progresso}% — </strong>{current.descricao}
        </p>
      )}

      {items.length > 1 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {items.map((m, i) => (
            <div
              key={m.id}
              className={`group relative aspect-video overflow-hidden rounded-md border-2 bg-secondary transition-all ${i === active ? "border-primary shadow-[var(--shadow-soft)]" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              <button
                type="button"
                onClick={() => setActive(i)}
                className="absolute inset-0 h-full w-full"
                aria-label={`Ver foto da fase ${m.progresso}%`}
              >
                {m.foto_url ? (
                  <img src={m.foto_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </span>
                )}
              </button>
              <span className="pointer-events-none absolute bottom-1 left-1 rounded px-1.5 py-0 text-[10px] font-bold text-white" style={{ backgroundColor: `color-mix(in oklab, #000 50%, transparent)` }}>
                {m.progresso}%
              </span>
              {admin && (
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  disabled={deletingId === m.id}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-destructive/90 text-destructive-foreground shadow transition hover:bg-destructive disabled:opacity-60"
                  aria-label="Remover atualização"
                >
                  {deletingId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="flex h-screen w-screen max-w-none items-center justify-center border-0 bg-black/95 p-0">
          <DialogTitle className="sr-only">Foto da obra em tela cheia</DialogTitle>
          {current.foto_url && (
            <img
              src={current.foto_url}
              alt={current.descricao ?? ""}
              className="max-h-full max-w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ObraUpdateForm({ obra, onSaved }: { obra: ObraRow; onSaved: () => void }) {
  const [descricao, setDescricao] = useState("");
  const [progresso, setProgresso] = useState<number>(obra.progresso_atual);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onPickFile = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return toast.error("Descreva a atualização.");
    if (progresso < 0 || progresso > 100) return toast.error("Progresso deve estar entre 0 e 100.");
    setSubmitting(true);
    try {
      let fotoUrl: string | null = null;
      if (file) {
        try {
          fotoUrl = await uploadObraFoto(obra.id, file);
        } catch (upErr) {
          console.error(upErr);
          toast.error("Erro ao enviar a foto.");
          setSubmitting(false);
          return;
        }
      }
      await inserirAtualizacaoObra({
        obra_id: obra.id,
        descricao: descricao.trim(),
        progresso,
        foto_url: fotoUrl,
      });
      toast.success("Atualização publicada.");
      setDescricao("");
      setFile(null);
      setPreview(null);
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao publicar atualização.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-semibold">{obra.titulo}</h4>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
          atual: {obra.progresso_atual}%
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_120px_1fr]">
        <div>
          <Label>Descrição</Label>
          <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: fundação concluída" className="mt-1 h-10" maxLength={200} />
        </div>
        <div>
          <Label>Progresso (%)</Label>
          <Input type="number" min={0} max={100} value={progresso} onChange={(e) => setProgresso(Number(e.target.value))} className="mt-1 h-10" />
        </div>
        <div>
          <Label htmlFor={`foto-${obra.id}`}>Foto (opcional)</Label>
          <div className="mt-1 flex items-center gap-2">
            <label
              htmlFor={`foto-${obra.id}`}
              className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-secondary/40 px-3 text-xs font-medium text-muted-foreground transition hover:bg-secondary"
            >
              <Upload className="h-3.5 w-3.5" />
              {file ? file.name.slice(0, 22) : "Selecionar imagem"}
            </label>
            <input
              id={`foto-${obra.id}`}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
            {preview && (
              <img src={preview} alt="Prévia" className="h-10 w-10 rounded-md object-cover" />
            )}
          </div>
        </div>
      </div>
      <Button type="submit" size="sm" className="mt-4 rounded-full" disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publicar atualização
      </Button>
    </form>
  );
}

function EditObraDialog({
  obra,
  onOpenChange,
  onSaved,
}: {
  obra: ObraRow | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState<ObraRow["status"]>("planejado");
  const [progresso, setProgresso] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (obra) {
      setTitulo(obra.titulo);
      setDescricao(obra.descricao ?? "");
      setStatus(obra.status);
      setProgresso(obra.progresso_atual);
    }
  }, [obra]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obra) return;
    if (!titulo.trim()) return toast.error("Informe o título da obra.");
    setSaving(true);
    try {
      await atualizarObra(obra.id, {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        status,
        progresso_atual: Math.max(0, Math.min(100, progresso)),
      });
      toast.success("Obra atualizada.");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar obra.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!obra} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Editar obra</DialogTitle>
          <DialogDescription>Atualize os dados da obra do condomínio.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eo-titulo">Título</Label>
            <Input id="eo-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eo-desc">Descrição</Label>
            <Textarea id="eo-desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ObraRow["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planejado">Planejado</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="eo-prog">Progresso atual (%)</Label>
            <Input
              id="eo-prog"
              type="number"
              min={0}
              max={100}
              value={progresso}
              onChange={(e) => setProgresso(Number(e.target.value))}
            />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
            Salvar alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ================== DOCUMENTS ARCHIVE ==================

function DocumentsArchive({ condominioId }: { condominioId: string }) {
  const anoAtual = new Date().getFullYear();
  const [docs, setDocs] = useState<DocumentoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [anos, setAnos] = useState<number[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);
  const [ano, setAno] = useState<number>(anoAtual);
  const [tipo, setTipo] = useState<string>("todos");
  const [mes, setMes] = useState<string>("todos");

  const carregarFiltros = useCallback(async () => {
    try {
      const [a, t] = await Promise.all([fetchAnosDocumentos(condominioId), fetchTiposDocumentos(condominioId)]);
      setAnos(a);
      setTipos(t);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar filtros de documentos.");
    }
  }, [condominioId]);

  const carregarDocs = useCallback(async () => {
    setLoading(true);
    try {
      const filtros: { ano: number; tipo?: string; mes?: number } = { ano };
      if (tipo !== "todos") filtros.tipo = tipo;
      if (mes !== "todos") filtros.mes = parseInt(mes, 10);
      setDocs(await fetchDocumentosFiltrados(condominioId, filtros));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar documentos.");
    } finally {
      setLoading(false);
    }
  }, [condominioId, ano, tipo, mes]);

  useEffect(() => {
    carregarFiltros();
  }, [carregarFiltros]);

  useEffect(() => {
    carregarDocs();
  }, [carregarDocs]);

  useEffect(() => {
    if (anos.length > 0 && !anos.includes(ano)) setAno(anos[0]);
  }, [anos, ano]);

  if (loading) return <LoadingBlock label="Carregando documentos…" />;

  if (anos.length === 0 && docs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
        Nenhum documento publicado ainda.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filtro-ano" className="text-xs font-medium text-muted-foreground">Ano</Label>
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger id="filtro-ano" className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {anos.map((a) => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filtro-tipo" className="text-xs font-medium text-muted-foreground">Tipo</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger id="filtro-tipo" className="w-[200px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {tipos.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filtro-mes" className="text-xs font-medium text-muted-foreground">Mês</Label>
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger id="filtro-mes" className="w-[180px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os meses</SelectItem>
              {MONTH_NAMES_PT.map((nome, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {docs.length} {docs.length === 1 ? "documento encontrado" : "documentos encontrados"}
      </p>

      {docs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          Nenhum documento encontrado para os filtros selecionados.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <h3 className="font-display text-lg font-semibold">{ano}</h3>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {docs.length} {docs.length === 1 ? "arquivo" : "arquivos"}
            </span>
          </div>
          <ul className="space-y-2 p-4">
            {docs.map((doc) => (
              <li key={doc.id} className="group flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-all hover:border-[color:var(--sage)]">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {doc.tipo} — {MONTH_NAMES_PT_SHORT[doc.mes - 1]}/{doc.ano}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">PDF · {doc.nome_arquivo}</p>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Baixar ${doc.nome_arquivo}`}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                >
                  <Download className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ================== DOCUMENTS ADMIN ==================

function DocumentsAdminSection({ condominioId }: { condominioId: string }) {
  const [docs, setDocs] = useState<DocumentoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState<string>("");
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDocs(await fetchDocumentos(condominioId));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar documentos.");
    } finally {
      setLoading(false);
    }
  }, [condominioId]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo.trim()) { toast.error("Informe o tipo do documento."); return; }
    if (!file) { toast.error("Selecione um arquivo PDF."); return; }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Envie apenas arquivos PDF.");
      return;
    }
    setUploading(true);
    try {
      const tipoLimpo = tipo.trim();
      const url = await uploadDocumentoPdf({ tipo: tipoLimpo, ano, mes, file });
      await criarDocumento({
        condominio_id: condominioId,
        tipo: tipoLimpo, mes, ano, url,
        nome_arquivo: file.name,
      });
      toast.success("Documento enviado.");
      setFile(null);
      setTipo("");
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar documento.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removerDocumento(id);
      toast.success("Documento removido.");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover documento.");
    }
  };

  const byYear = useMemo(() => {
    const groups = new Map<number, DocumentoRow[]>();
    docs.forEach((d) => {
      if (!groups.has(d.ano)) groups.set(d.ano, []);
      groups.get(d.ano)!.push(d);
    });
    return Array.from(groups.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, items]) => ({ year, items }));
  }, [docs]);

  return (
    <section className="bg-secondary/40 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
            <FileText className="h-3.5 w-3.5" /> Documentos
          </span>
          <h2 className="mt-3 text-3xl font-medium md:text-4xl">Atas, balancetes e mais</h2>
          <p className="mt-4 text-muted-foreground">
            Envie PDFs oficiais para que os moradores tenham acesso pelo portal.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_2fr]">
          <form onSubmit={submit} className="min-w-0 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <div className="space-y-2">
              <Label htmlFor="doc-tipo">Tipo</Label>
              <Input
                id="doc-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                placeholder="Ex: Ata de Assembleia, Balancete Março…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Mês</Label>
                <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {MONTH_NAMES_PT[i]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-ano">Ano</Label>
                <Input id="doc-ano" type="number" min={2000} max={2100} value={ano} onChange={(e) => setAno(Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-file">Arquivo (PDF)</Label>
              <Input
                id="doc-file"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && <p className="text-[11px] text-muted-foreground truncate">{file.name}</p>}
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Enviar documento
            </Button>
          </form>

          <div className="min-w-0">
            {loading ? (
              <LoadingBlock label="Carregando documentos…" />
            ) : byYear.length === 0 ? (
              <EmptyState>Nenhum documento publicado ainda.</EmptyState>
            ) : (
              <div className="space-y-6">
                {byYear.map((yearGroup) => (
                  <div key={yearGroup.year} className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
                    <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-3">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        <h3 className="font-display text-lg font-semibold">{yearGroup.year}</h3>
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {yearGroup.items.length} {yearGroup.items.length === 1 ? "arquivo" : "arquivos"}
                      </span>
                    </div>
                    <ul className="divide-y divide-border">
                      {yearGroup.items.map((doc) => (
                        <li key={doc.id} className="group flex items-center gap-3 p-4">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {doc.tipo} — {MONTH_NAMES_PT_SHORT[doc.mes - 1]}/{doc.ano}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{doc.nome_arquivo}</p>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                            aria-label="Baixar"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleRemove(doc.id)}
                            aria-label="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


// ================== PAYMENT HISTORY DIALOG (admin) ==================

function PaymentHistoryDialog({
  moradorId,
  moradores,
  historico,
  year,
  onClose,
  onChange,
}: {
  moradorId: string | null;
  moradores: MoradorInfo[];
  historico: HistoricoRow[];
  year: number;
  onClose: () => void;
  onChange: (monthNum: number, status: FinancialStatus) => void;
}) {

  const morador = moradorId ? moradores.find((m) => m.id === moradorId) ?? null : null;
  const rowsByMonth = new Map<number, HistoricoRow>();
  if (moradorId) {
    historico
      .filter((h) => h.unidade_id === moradorId && h.ano === year)
      .forEach((h) => rowsByMonth.set(h.mes, h));
  }
  const currentMonthIdx = new Date().getMonth();

  return (
    <Dialog open={!!moradorId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Histórico de pagamentos — {morador?.unidade}
          </DialogTitle>
          <DialogDescription>
            {morador?.nome_completo} · Ano {year}. Altere o status retroativamente.
          </DialogDescription>
        </DialogHeader>

        {morador && (
          <>
            {(() => {
              let emDia = 0, atrasado = 0, pendente = 0, semRegistro = 0;
              for (let i = 0; i <= currentMonthIdx; i++) {
                const row = rowsByMonth.get(i + 1);
                if (!row) { semRegistro++; continue; }
                const s = HISTORICO_DB_TO_UI[row.status];
                if (s === "Em dia") emDia++;
                else if (s === "Atrasado") atrasado++;
                else pendente++;
              }
              return (
                <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm">
                  <strong className="font-semibold">
                    {emDia} de {currentMonthIdx + 1} {emDia === 1 ? "mês em dia" : "meses em dia"}
                  </strong>
                  {(atrasado > 0 || pendente > 0 || semRegistro > 0) && (
                    <span className="text-xs text-muted-foreground">
                      {atrasado > 0 && `· ${atrasado} ${atrasado === 1 ? "atrasado" : "atrasados"} `}
                      {pendente > 0 && `· ${pendente} ${pendente === 1 ? "pendente" : "pendentes"} `}
                      {semRegistro > 0 && `· ${semRegistro} sem registro`}
                    </span>
                  )}
                </div>
              );
            })()}

            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => {
                const monthNum = i + 1;
                const row = rowsByMonth.get(monthNum);
                const uiStatus = row ? HISTORICO_DB_TO_UI[row.status] : null;
                const isFuture = i > currentMonthIdx;
                const isCurrent = i === currentMonthIdx;
                const cardClass =
                  !isFuture && uiStatus
                    ? HEATMAP_CELL_STYLES[uiStatus]
                    : "border border-dashed border-border bg-secondary/30 text-muted-foreground";
                return (
                  <div
                    key={i}
                    className={`rounded-xl p-3 transition-all ${cardClass} ${isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                        {MONTH_NAMES_PT_SHORT[i]}
                      </p>
                      {isCurrent && (
                        <span className="rounded-full bg-primary px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                          Atual
                        </span>
                      )}
                    </div>
                    {isFuture ? (
                      <p className="mt-3 text-[11px] italic">A faturar</p>
                    ) : uiStatus ? (
                      <Select value={uiStatus} onValueChange={(v) => onChange(monthNum, v as FinancialStatus)}>
                        <SelectTrigger className="mt-2 h-8 w-full border-0 bg-transparent px-0 text-[11px] font-bold uppercase tracking-wide text-current shadow-none focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Em dia">Em dia (Pago)</SelectItem>
                          <SelectItem value="Pendente">Pendente</SelectItem>
                          <SelectItem value="Atrasado">Atrasado</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select value="" onValueChange={(v) => onChange(monthNum, v as FinancialStatus)}>
                        <SelectTrigger className="mt-2 h-8 w-full border-0 bg-transparent px-0 text-[11px] italic text-muted-foreground shadow-none focus:ring-0">
                          <SelectValue placeholder="Sem registro" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Em dia">Em dia (Pago)</SelectItem>
                          <SelectItem value="Pendente">Pendente</SelectItem>
                          <SelectItem value="Atrasado">Atrasado</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3">
              {(["Em dia", "Atrasado", "Pendente"] as FinancialStatus[]).map((status) => (
                <div key={status} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className={`h-2.5 w-2.5 rounded-sm ${HEATMAP_CELL_STYLES[status].split(" ")[0]}`} />
                  {status}
                </div>
              ))}
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-sm bg-secondary/50" />
                A faturar
              </div>
            </div>
          </>
        )}

        <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3 text-[11px] text-muted-foreground">
          <p className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--sage)]" /> Edição registrada
          </p>
          <p className="mt-1">
            Alterações são gravadas no banco imediatamente e ficam disponíveis para auditoria.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ================== BLOCK DATE / EDIT / DELETE MORADOR DIALOGS ==================

function BlockDateDialog({
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
  const [espaco, setEspaco] = useState<string>(RESERVATION_SPACES[0]?.id ?? "");
  const [data, setData] = useState("");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setEspaco(RESERVATION_SPACES[0]?.id ?? ""); setData(""); setMotivo(""); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!espaco || !data || !motivo.trim()) {
      toast.error("Preencha espaço, data e motivo.");
      return;
    }
    setSaving(true);
    try {
      await criarBloqueio({
        condominio_id: profile.condominio_id,
        morador_id: profile.id,
        espaco,
        data,
        motivo: motivo.trim(),
      });
      toast.success("Data bloqueada.");
      reset();
      onOpenChange(false);
      onCreated();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao bloquear data.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Bloquear data</DialogTitle>
          <DialogDescription>
            Impede novas reservas do espaço no dia informado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bl-espaco">Espaço</Label>
            <Select value={espaco} onValueChange={setEspaco}>
              <SelectTrigger id="bl-espaco"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RESERVATION_SPACES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bl-data">Data</Label>
            <Input id="bl-data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bl-motivo">Motivo</Label>
            <Input id="bl-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: Manutenção, evento do condomínio" required maxLength={120} />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Bloquear
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditMoradorDialog({
  morador,
  onOpenChange,
  onSaved,
}: {
  morador: MoradorInfo | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState("");
  const [bloco, setBloco] = useState<"A" | "B">("A");
  const [apartamento, setApartamento] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (morador) {
      setNome(morador.nome_completo);
      const [b, apto] = (morador.unidade ?? "").split("-");
      setBloco(b === "B" ? "B" : "A");
      setApartamento(apto ?? "");
    }
  }, [morador]);

  const isFuncionario = morador?.unidade == null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!morador) return;
    if (!nome.trim() || (!isFuncionario && !apartamento.trim())) {
      toast.error(isFuncionario ? "Preencha o nome." : "Preencha nome e apartamento.");
      return;
    }
    setSaving(true);
    try {
      await atualizarMorador(morador.id, {
        nome_completo: nome.trim(),
        unidade: isFuncionario ? null : `${bloco}-${apartamento.trim()}`,
      });
      toast.success(isFuncionario ? "Funcionário atualizado." : "Morador atualizado.");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={morador !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {isFuncionario ? "Editar funcionário" : "Editar morador"}
          </DialogTitle>
          <DialogDescription>
            {isFuncionario ? "Atualize o nome." : "Atualize nome e unidade."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="em-nome">Nome completo</Label>
            <Input id="em-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          {!isFuncionario && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="em-bloco">Bloco</Label>
                <Select value={bloco} onValueChange={(v) => setBloco(v as "A" | "B")}>
                  <SelectTrigger id="em-bloco"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="em-apto">Apartamento</Label>
                <Input id="em-apto" value={apartamento} onChange={(e) => setApartamento(e.target.value)} placeholder="Ex.: 301" required />
              </div>
            </div>
          )}
          <Button type="submit" className="w-full rounded-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDeleteObraDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Excluir obra</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir esta obra? As atualizações e fotos publicadas nela
            também serão perdidas. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>
            <Trash2 className="h-4 w-4" /> Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDeleteMoradorDialog({
  morador,
  onOpenChange,
  onConfirm,
}: {
  morador: MoradorInfo | null;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}) {
  const isSindica = morador?.role === "sindica";
  return (
    <Dialog open={morador !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {isSindica ? "Excluir síndica" : "Excluir morador"}
          </DialogTitle>
          <DialogDescription>
            {isSindica
              ? `Tem certeza que deseja remover ${morador?.nome_completo} do cargo de síndica? Ela perde o acesso ao painel administrativo imediatamente. Esta ação não pode ser desfeita.`
              : "Tem certeza que deseja remover este morador? Esta ação não pode ser desfeita."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>
            <Trash2 className="h-4 w-4" /> Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmPromoteMoradorDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (novoRole: "sindica" | "admin_agencia") => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Promover morador</DialogTitle>
          <DialogDescription>
            Escolha o novo papel. Síndica tem acesso total ao painel, exceto promover outras
            pessoas a síndica/administradora — isso continua exclusivo seu. Administradora tem o
            mesmo poder que você, incluindo promover outras pessoas.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="outline" className="rounded-full" onClick={() => onConfirm("sindica")}>
            <ShieldCheck className="h-4 w-4" /> Promover a síndica
          </Button>
          <Button className="rounded-full" onClick={() => onConfirm("admin_agencia")}>
            <ShieldCheck className="h-4 w-4" /> Promover a administradora
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FuncaoPermissoesDialog({
  morador,
  onOpenChange,
  onSaved,
}: {
  morador: MoradorInfo | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [tituloFuncao, setTituloFuncao] = useState("");
  const [selecionadas, setSelecionadas] = useState<Set<Permissao>>(new Set());
  const [recebeAlertas, setRecebeAlertas] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!morador) return;
    setTituloFuncao(morador.titulo_funcao ?? "");
    setLoading(true);
    Promise.all([fetchPermissoesDoProfile(morador.id), fetchRecebeAlertas(morador.id)])
      .then(([perms, alertas]) => {
        setSelecionadas(new Set(perms));
        setRecebeAlertas(alertas);
      })
      .catch((e) => { console.error(e); toast.error("Erro ao carregar permissões."); })
      .finally(() => setLoading(false));
  }, [morador]);

  const toggle = (perm: Permissao, checked: boolean) => {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (checked) next.add(perm);
      else next.delete(perm);
      return next;
    });
  };

  const submit = async () => {
    if (!morador) return;
    setSaving(true);
    try {
      await Promise.all([
        definirPermissoes(morador.id, Array.from(selecionadas), tituloFuncao.trim() || null),
        definirRecebeAlertas(morador.id, recebeAlertas),
      ]);
      toast.success("Função e permissões atualizadas.");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar permissões.");
    } finally {
      setSaving(false);
    }
  };

  const excluirFuncao = async () => {
    if (!morador) return;
    if (!confirm(`Remover a função de ${morador.nome_completo}? Ela(e) perde o título e todas as permissões, mas continua cadastrada(o).`)) return;
    setSaving(true);
    try {
      await definirPermissoes(morador.id, [], null);
      toast.success("Função removida.");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover função.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={morador !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Gerenciar função</DialogTitle>
          <DialogDescription>
            {morador?.nome_completo} continua {morador?.unidade == null ? "funcionário" : "morador"} —
            as permissões abaixo dão acesso extra, sem virar síndica/admin de verdade.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <LoadingBlock />
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fp-titulo">Título da função (aparece como badge, ex.: Subsíndica)</Label>
              <Input
                id="fp-titulo"
                value={tituloFuncao}
                onChange={(e) => setTituloFuncao(e.target.value)}
                placeholder="Ex.: Subsíndica"
              />
            </div>
            <div className="space-y-2">
              <Label>Permissões</Label>
              <div className="grid gap-2.5 rounded-xl border border-border p-3">
                {PERMISSOES_DISPONIVEIS.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
                    <Checkbox
                      checked={selecionadas.has(p.id)}
                      onCheckedChange={(v) => toggle(p.id, v === true)}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0">
                <Label htmlFor="fp-alertas">Receber aviso por e-mail</Label>
                <p className="text-xs text-muted-foreground">
                  Manda e-mail quando entra visitante/reserva pendente pra aprovar (só vale se
                  tiver permissão de aprovar visitantes/reservas, ou for síndica/admin_agencia).
                </p>
              </div>
              <Switch id="fp-alertas" checked={recebeAlertas} onCheckedChange={setRecebeAlertas} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={submit} disabled={saving} className="w-full rounded-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Salvar
              </Button>
              {(tituloFuncao.trim() || selecionadas.size > 0) && (
                <Button
                  variant="outline"
                  onClick={excluirFuncao}
                  disabled={saving}
                  className="w-full rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
                >
                  <Trash2 className="h-4 w-4" /> Excluir função
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ConfirmEncerrarPautaDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Finalizar votação</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja encerrar esta votação antes da data prevista? Os moradores não
            poderão mais votar e o resultado atual será considerado final. Esta ação não pode ser
            desfeita.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="rounded-full" onClick={onConfirm}>
            <CheckCircle2 className="h-4 w-4" /> Finalizar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDeletePautaDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Excluir votação</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir esta votação? Todos os votos registrados nela serão
            apagados permanentemente. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>
            <Trash2 className="h-4 w-4" /> Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


// ================== LANDING CONFIG SECTION (síndica) ==================

function LandingConfigSection({ condominioId }: { condominioId: string }) {
  // Sobre o condomínio
  const [sobreTitulo, setSobreTitulo] = useState("");
  const [sobreDescricao, setSobreDescricao] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  // Amenidades
  const [amenidades, setAmenidades] = useState<AmenidadeRow[]>([]);
  const [amenidadesLoading, setAmenidadesLoading] = useState(true);
  const [amenidadeEdit, setAmenidadeEdit] = useState<AmenidadeRow | null>(null);
  const [amenidadeNew, setAmenidadeNew] = useState(false);

  // Avisos públicos
  const [avisos, setAvisos] = useState<AvisoPublicoRow[]>([]);
  const [avisosLoading, setAvisosLoading] = useState(true);
  const [avisoNew, setAvisoNew] = useState(false);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const c = await fetchCondominioConfig(condominioId);
      setSobreTitulo(c?.sobre_titulo ?? "");
      setSobreDescricao(c?.sobre_descricao ?? "");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar configuração da landing.");
    } finally {
      setConfigLoading(false);
    }
  }, [condominioId]);

  const loadAmenidades = useCallback(async () => {
    setAmenidadesLoading(true);
    try { setAmenidades(await fetchAmenidades(condominioId)); }
    catch (e) { console.error(e); toast.error("Erro ao carregar amenidades."); }
    finally { setAmenidadesLoading(false); }
  }, [condominioId]);

  const loadAvisos = useCallback(async () => {
    setAvisosLoading(true);
    try { setAvisos(await fetchAvisosPublicos(condominioId)); }
    catch (e) { console.error(e); toast.error("Erro ao carregar avisos."); }
    finally { setAvisosLoading(false); }
  }, [condominioId]);

  useEffect(() => {
    loadConfig(); loadAmenidades(); loadAvisos();
  }, [loadConfig, loadAmenidades, loadAvisos]);

  const salvarSobre = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await upsertCondominioConfig({
        condominio_id: condominioId,
        sobre_titulo: sobreTitulo.trim(),
        sobre_descricao: sobreDescricao.trim(),
      });
      toast.success("Seção 'Sobre' atualizada.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar.");
    } finally {
      setSavingConfig(false);
    }
  };

  const removerAmen = async (id: string) => {
    try {
      await removerAmenidade(id);
      toast.success("Amenidade removida.");
      await loadAmenidades();
    } catch (e) { console.error(e); toast.error("Erro ao remover."); }
  };

  const toggleAviso = async (id: string, ativo: boolean) => {
    try {
      await toggleAvisoPublico(id, ativo);
      await loadAvisos();
    } catch (e) { console.error(e); toast.error("Erro ao atualizar aviso."); }
  };

  const removerAviso = async (id: string) => {
    try {
      await removerAvisoPublico(id);
      toast.success("Aviso removido.");
      await loadAvisos();
    } catch (e) { console.error(e); toast.error("Erro ao remover."); }
  };

  return (
    <section className="border-t border-border bg-background py-16">
      <div className="mx-auto max-w-7xl space-y-12 px-6">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
            <Sparkles className="h-3.5 w-3.5" /> Configurações da landing page
          </span>
          <h2 className="mt-3 text-3xl font-medium md:text-4xl">Sobre o condomínio, amenidades e mural público</h2>
          <p className="mt-4 text-muted-foreground">
            Edite os textos e cards que aparecem na página pública do condomínio.
          </p>
        </div>

        {/* Sobre o condomínio */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h3 className="font-display text-xl font-semibold">Sobre o condomínio</h3>
          <p className="mt-1 text-sm text-muted-foreground">Título e descrição exibidos na seção "Sobre" da landing.</p>
          {configLoading ? (
            <div className="mt-4"><LoadingBlock /></div>
          ) : (
            <form onSubmit={salvarSobre} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sobre-titulo">Título</Label>
                <Input id="sobre-titulo" value={sobreTitulo} onChange={(e) => setSobreTitulo(e.target.value)} placeholder="Ex: Um ambiente pensado para o seu bem-estar" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sobre-desc">Descrição</Label>
                <Textarea id="sobre-desc" value={sobreDescricao} onChange={(e) => setSobreDescricao(e.target.value)} rows={4} placeholder="Descreva o condomínio…" />
              </div>
              <Button type="submit" disabled={savingConfig} className="rounded-full">
                {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Salvar
              </Button>
            </form>
          )}
        </div>

        {/* Amenidades */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-semibold">Amenidades</h3>
              <p className="mt-1 text-sm text-muted-foreground">Cards exibidos na seção "Sobre o condomínio".</p>
            </div>
            <Button onClick={() => setAmenidadeNew(true)} className="rounded-full">
              <Plus className="h-4 w-4" /> Nova amenidade
            </Button>
          </div>

          <div className="mt-6">
            {amenidadesLoading ? (
              <LoadingBlock />
            ) : amenidades.length === 0 ? (
              <EmptyState>Nenhuma amenidade cadastrada.</EmptyState>
            ) : (
              <ul className="divide-y divide-border">
                {amenidades.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-3">
                    <div className="shrink-0">
                      <AmenidadeIconTile icone={a.icone} size="sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.nome}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        Ordem {a.ordem} · Ícone: {a.icone || "—"} · {a.descricao || "sem descrição"}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setAmenidadeEdit(a)} aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => removerAmen(a.id)} aria-label="Remover">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Mural público */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-semibold">Mural público</h3>
              <p className="mt-1 text-sm text-muted-foreground">Avisos abertos ao público na landing page.</p>
            </div>
            <Button onClick={() => setAvisoNew(true)} className="rounded-full">
              <Plus className="h-4 w-4" /> Novo aviso
            </Button>
          </div>

          <div className="mt-6">
            {avisosLoading ? (
              <LoadingBlock />
            ) : avisos.length === 0 ? (
              <EmptyState>Nenhum aviso cadastrado.</EmptyState>
            ) : (
              <ul className="divide-y divide-border">
                {avisos.map((av) => (
                  <li key={av.id} className="flex items-start gap-3 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{av.titulo}</p>
                      <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">{av.conteudo}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Switch checked={av.ativo} onCheckedChange={(v) => toggleAviso(av.id, v)} />
                        <span>{av.ativo ? "Ativo" : "Inativo"}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => removerAviso(av.id)} aria-label="Remover">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <AmenidadeDialog
        open={amenidadeNew || !!amenidadeEdit}
        onOpenChange={(v) => { if (!v) { setAmenidadeNew(false); setAmenidadeEdit(null); } }}
        condominioId={condominioId}
        amenidade={amenidadeEdit}
        onSaved={loadAmenidades}
      />
      <AvisoPublicoDialog
        open={avisoNew}
        onOpenChange={setAvisoNew}
        condominioId={condominioId}
        onSaved={loadAvisos}
      />
    </section>
  );
}

function AmenidadeIconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const trimmedKey = value.trim().toLowerCase();
  const isCustomEmoji = value.trim() !== "" && !AMENIDADE_ICONS[trimmedKey];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="flex h-10 w-full items-center justify-start gap-2 px-3 font-normal"
        >
          <AmenidadeIconTile icone={value} size="xs" />
          <span className="truncate">{value.trim() || "Escolher ícone"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3" align="start">
        <div className="grid grid-cols-4 gap-2">
          {AMENIDADE_ICON_PICKER.map(({ key, label }) => {
            const Icon = AMENIDADE_ICONS[key];
            const selected = trimmedKey === key;
            return (
              <button
                key={key}
                type="button"
                title={label}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md border p-2 text-center text-[10px] leading-tight hover:bg-secondary",
                  selected ? "border-primary bg-secondary" : "border-transparent",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="line-clamp-1">{label}</span>
              </button>
            );
          })}
        </div>
        <div className="space-y-1 border-t pt-3">
          <Label htmlFor="am-icone-emoji" className="text-xs text-muted-foreground">
            Ou cole um emoji (ex: 🍖, 🧖, 🛝)
          </Label>
          <Input
            id="am-icone-emoji"
            value={isCustomEmoji ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="🍖"
            maxLength={8}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AmenidadeDialog({
  open, onOpenChange, condominioId, amenidade, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  condominioId: string;
  amenidade: AmenidadeRow | null;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [icone, setIcone] = useState("");
  const [ordem, setOrdem] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNome(amenidade?.nome ?? "");
      setDescricao(amenidade?.descricao ?? "");
      setIcone(amenidade?.icone ?? "");
      setOrdem(amenidade?.ordem ?? 0);
    }
  }, [open, amenidade]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { toast.error("Informe o nome."); return; }
    setSaving(true);
    try {
      const patch = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        icone: icone.trim().toLowerCase(),
        ordem: Number.isFinite(ordem) ? ordem : 0,
      };
      if (amenidade) {
        await atualizarAmenidade(amenidade.id, patch);
        toast.success("Amenidade atualizada.");
      } else {
        await criarAmenidade({ condominio_id: condominioId, ...patch });
        toast.success("Amenidade criada.");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{amenidade ? "Editar amenidade" : "Nova amenidade"}</DialogTitle>
          <DialogDescription>
            Escolha um ícone na grade ou cole um emoji — a prévia mostra exatamente o que vai
            aparecer no site.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="am-nome">Nome</Label>
            <Input id="am-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="am-desc">Descrição</Label>
            <Textarea id="am-desc" rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Ícone</Label>
              <AmenidadeIconPicker value={icone} onChange={setIcone} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="am-ordem">Ordem</Label>
              <Input id="am-ordem" type="number" value={ordem} onChange={(e) => setOrdem(Number(e.target.value))} />
            </div>
          </div>
          <Button type="submit" disabled={saving} className="w-full rounded-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AvisoPublicoDialog({
  open, onOpenChange, condominioId, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  condominioId: string;
  onSaved: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setTitulo(""); setConteudo(""); } }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !conteudo.trim()) { toast.error("Preencha título e conteúdo."); return; }
    setSaving(true);
    try {
      await criarAvisoPublico({
        condominio_id: condominioId,
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
      });
      toast.success("Aviso publicado.");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao publicar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo aviso público</DialogTitle>
          <DialogDescription>Será exibido no mural público da landing.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="av-titulo">Título</Label>
            <Input id="av-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="av-conteudo">Conteúdo</Label>
            <Textarea id="av-conteudo" rows={5} value={conteudo} onChange={(e) => setConteudo(e.target.value)} />
          </div>
          <Button type="submit" disabled={saving} className="w-full rounded-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Publicar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
