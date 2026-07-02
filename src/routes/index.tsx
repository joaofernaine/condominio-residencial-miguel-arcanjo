import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { supabase } from "@/lib/supabase";
import {
  type FinancialStatus,
  type ReservationStatus,
  MONTH_NAMES_PT,
  MONTH_NAMES_PT_SHORT,
  RESERVATION_STATUS_STYLES,
  amenities,
  publicNotices,
  DOCUMENTS_BY_YEAR,
  CLASSIFIEDS,
} from "@/lib/mocks";
import {
  type Profile,
  type PautaRow,
  type ReservaRow,
  type ReservaComMorador,
  type HistoricoRow,
  type ObraRow,
  type ObraAtualizacaoRow,
  RESERVATION_SPACES,
  RESERVA_DB_TO_UI,
  HISTORICO_DB_TO_UI,
  HISTORICO_UI_TO_DB,
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
  fetchObras,
  fetchAtualizacoesObra,
  inserirAtualizacaoObra,
  removerAtualizacaoObra,
  atualizarObra,
  uploadObraFoto,
  criarMorador,
  criarObra,
  criarPauta,
  criarBloqueio,
  removerReserva,
  atualizarMorador,
  removerMorador,
  fetchOcupacoesCondominio,
  type OcupacaoRow,
} from "@/lib/portal-data";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portal Condomínio Inteligente — Bem-vindo" },
      {
        name: "description",
        content:
          "Portal oficial do Portal Condomínio Inteligente. Avisos públicos, infraestrutura e acesso ao portal do morador.",
      },
      { property: "og:title", content: "Portal Condomínio Inteligente" },
      {
        property: "og:description",
        content: "Um condomínio moderno, seguro e transparente.",
      },
    ],
  }),
  component: Index,
});

// ================== ROOT ==================

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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message || "Credenciais inválidas.");
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
          <AdminDashboard profile={profile} onLogout={handleLogout} />
        ) : profile.role === "admin_agencia" ? (
          <AgencyAdminView profile={profile} onLogout={handleLogout} />
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
            <Input id="login-password" name="password" type="password" required className="mt-2 h-11" placeholder="••••••••" />
          </div>
          <Button type="submit" size="lg" className="w-full rounded-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Entrar
          </Button>
        </form>
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
            <Input id="fa-pw" type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} required className="mt-2 h-11" placeholder="Mínimo 8 caracteres" maxLength={60} />
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
            <Input id="fa-pw2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required className="mt-2 h-11" placeholder="Repita a nova senha" maxLength={60} />
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
    <AdminDashboard profile={sindicaProfile} onLogout={onLogout} adminAgenciaToggle={toggle} />
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
  return (
    <>
      <header className="absolute top-0 z-30 w-full">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <a href="#top" className="flex items-center gap-2 text-primary-foreground">
            <Building2 className="h-6 w-6" />
            <span className="font-display text-lg font-semibold tracking-tight">Condomínio Inteligente</span>
          </a>
          <div className="hidden items-center gap-8 text-sm text-primary-foreground/85 md:flex">
            <a href="#sobre" className="hover:text-primary-foreground">Sobre</a>
            <a href="#estrutura" className="hover:text-primary-foreground">Infraestrutura</a>
            <a href="#avisos" className="hover:text-primary-foreground">Avisos</a>
          </div>
          <Button onClick={onOpenLogin} variant="secondary" size="sm" className="rounded-full">
            <LogIn className="h-4 w-4" /> Portal do Morador
          </Button>
        </nav>
      </header>

      <section id="top" className="relative isolate min-h-[92vh] overflow-hidden">
        <img src={heroImage} alt="Fachada do condomínio ao entardecer" width={1920} height={1280} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-end px-6 pb-20 pt-40 text-primary-foreground">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Um lugar para chamar de lar
            </span>
            <h1 className="mt-6 font-display text-5xl font-medium leading-[1.05] sm:text-6xl md:text-7xl">
              Bem-vindo ao<br />
              <span className="italic text-[color:var(--gold)]">Portal Condomínio Inteligente</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/85">
              Conforto, segurança e convivência em harmonia com a natureza.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={onOpenLogin} size="lg" className="rounded-full bg-[color:var(--gold)] text-primary hover:bg-[color:var(--gold)]/90">
                <LogIn className="h-4 w-4" /> Entrar no Portal do Morador
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-white/30 bg-white/5 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
                <a href="#estrutura">Conhecer o condomínio</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="sobre" className="border-b border-border bg-background py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
              <Sparkles className="h-3.5 w-3.5" /> Sobre o condomínio
            </span>
            <h2 className="mt-3 text-4xl font-medium md:text-5xl">Um ambiente pensado para o seu bem-estar</h2>
          </div>
          <div id="estrutura" className="mt-14">
            {amenities.length === 0 ? (
              <EmptyState>Cadastre as comodidades no Supabase para exibi-las aqui.</EmptyState>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {amenities.map((a) => (
                  <div key={a.title} className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-[color:var(--sage)] hover:shadow-[var(--shadow-soft)]">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <a.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">{a.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
                  </div>
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
            {publicNotices.length === 0 ? (
              <EmptyState>Nenhum aviso publicado ainda.</EmptyState>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {publicNotices.map((n) => (
                  <article key={n.title} className="group flex flex-col rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{n.tag}</span>
                      <time className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{n.date}</time>
                    </div>
                    <h3 className="mt-6 text-xl font-semibold leading-snug">{n.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{n.body}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>© {new Date().getFullYear()} Portal Condomínio Inteligente</span>
          </div>
          <p>Portal oficial de moradores</p>
        </div>
      </footer>
    </>
  );
}

// ================== RESIDENT DASHBOARD ==================

function ResidentDashboard({ profile, onLogout, adminAgenciaToggle }: { profile: Profile; onLogout: () => void; adminAgenciaToggle?: ReactNode }) {
  const [pautas, setPautas] = useState<PautaRow[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [pautasLoading, setPautasLoading] = useState(true);

  const [reservas, setReservas] = useState<ReservaRow[]>([]);
  const [reservasLoading, setReservasLoading] = useState(true);

  const [obras, setObras] = useState<ObraRow[]>([]);
  const [obrasLoading, setObrasLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const [historico, setHistorico] = useState<HistoricoRow[]>([]);
  const [historicoLoading, setHistoricoLoading] = useState(true);

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
      setReservas(await fetchMinhasReservas(profile.id));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar reservas.");
    } finally {
      setReservasLoading(false);
    }
  }, [profile.id]);

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
  }, [profile.id, currentYear]);

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
      await registrarVoto(pautaId, profile.id, choice);
      setVotedIds((prev) => new Set(prev).add(pautaId));
      toast.success(`Voto computado: ${choice === "sim" ? "Sim" : "Não"}.`);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao registrar voto.");
    }
  };

  const handleRequestReservation = async (spaceId: string, spaceName: string, dateIso: string) => {
    try {
      await criarReserva({
        condominio_id: profile.condominio_id,
        morador_id: profile.id,
        espaco: spaceId,
        data_inicio: dateIso,
        data_fim: dateIso,
      });
      toast.success(`Solicitação enviada: ${spaceName} em ${dateIso.split("-").reverse().join("/")}.`);
      loadReservas();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao solicitar reserva.");
    }
  };

  const residentName = profile.nome_completo;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-display text-lg font-semibold tracking-tight">Condomínio Inteligente</span>
            <span className="ml-3 hidden rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground sm:inline">
              Portal do Morador
            </span>
          </div>
          <div className="flex items-center gap-3">
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
            <Button onClick={onLogout} variant="outline" size="sm" className="rounded-full">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </nav>
      </header>

      <section className="border-b border-border bg-secondary/30">
        <div className="mx-auto max-w-7xl px-6 py-14">
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
        </div>
      </section>

      {/* Votações */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
              <Vote className="h-3.5 w-3.5" /> Enquetes ativas
            </span>
            <h2 className="mt-3 text-3xl font-medium md:text-4xl">Votações em andamento</h2>
            <p className="mt-4 text-muted-foreground">
              Sua opinião conta. Cada morador pode votar apenas uma vez por enquete.
            </p>
          </div>

          <div className="mt-10">
            {pautasLoading ? (
              <LoadingBlock label="Carregando votações…" />
            ) : pautas.length === 0 ? (
              <EmptyState>Nenhuma enquete aberta no momento.</EmptyState>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {pautas.map((p) => (
                  <PollCard key={p.id} pauta={p} hasVoted={votedIds.has(p.id)} onVote={handleVote} />
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
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
                <FileText className="h-3.5 w-3.5" /> Transparência financeira
              </span>
              <h2 className="mt-3 text-3xl font-medium md:text-4xl">Meu histórico ({currentYear})</h2>
              <p className="mt-4 text-muted-foreground">
                Situação de pagamento da sua unidade ({profile.unidade || "—"}) mês a mês.
              </p>
              <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
                Documentos e balancetes serão exibidos aqui após integração.
              </div>
            </div>

            <div>
              {historicoLoading ? (
                <LoadingBlock label="Carregando histórico…" />
              ) : (
                <MyPaymentGrid rows={historico} year={currentYear} />
              )}
              <div className="mt-8">
                <DocumentsArchive />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Obras */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
              <Hammer className="h-3.5 w-3.5" /> Obras & Reformas
            </span>
            <h2 className="mt-3 text-3xl font-medium md:text-4xl">Linha do tempo dos projetos</h2>
            <p className="mt-4 text-muted-foreground">
              O que já entregamos, o que está em execução e o que vem a seguir.
            </p>
          </div>

          {obrasLoading ? (
            <div className="mt-10"><LoadingBlock label="Carregando obras…" /></div>
          ) : (
            <ObrasTabs obras={obras} />
          )}
        </div>
      </section>

      {/* Reservas */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
                <CalendarIcon className="h-3.5 w-3.5" /> Sistema de reservas
              </span>
              <h2 className="mt-3 text-3xl font-medium md:text-4xl">Reserve um espaço</h2>
              <p className="mt-4 text-muted-foreground">
                Escolha um espaço e uma data. A confirmação chega em até 24h.
              </p>
            </div>
          </div>

          <ReservationModule onRequest={handleRequestReservation} />

          <div className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-medium">Minhas reservas</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Acompanhe o status dos seus pedidos.
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
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
                {reservas.filter((r) => r.status !== "bloqueado").map((r) => {
                  const uiStatus = RESERVA_DB_TO_UI[r.status as Exclude<typeof r.status, "bloqueado">];
                  const spaceName = RESERVATION_SPACES.find((s) => s.id === r.espaco)?.name ?? r.espaco;
                  return (
                    <li key={r.id} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                        <CalendarIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug">{spaceName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Data: <span className="font-mono">{r.data_inicio.split("-").reverse().join("/")}</span>
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
                      </div>
                    </li>
                  );
                })}
              </ul>

            )}
          </div>
        </div>
      </section>

      {/* Classificados (mock vazio) */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
                <Store className="h-3.5 w-3.5" /> Marketplace interno
              </span>
              <h2 className="mt-3 text-3xl font-medium md:text-4xl">Classificados dos moradores</h2>
            </div>
          </div>
          <div className="mt-10">
            {CLASSIFIEDS.length === 0 ? (
              <EmptyState>Nenhum classificado publicado ainda.</EmptyState>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                {CLASSIFIEDS.map((c) => (
                  <article key={c.title} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1">
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[color:var(--sage)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--sage)]">
                      <Tag className="h-3 w-3" /> {c.tag}
                    </span>
                    <h3 className="mt-4 text-base font-semibold leading-snug">{c.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA canal */}
      <section className="relative overflow-hidden bg-primary py-20 text-primary-foreground">
        <div aria-hidden className="absolute -right-32 -top-32 h-96 w-96 rounded-full" style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--gold) 45%, transparent), transparent 70%)" }} />
        <div className="relative mx-auto max-w-7xl px-6">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--gold)]">
            <Mail className="h-3.5 w-3.5" /> Canal do morador
          </span>
          <h2 className="mt-3 text-3xl font-medium md:text-4xl">Fale com a administração</h2>
          <p className="mt-4 max-w-lg text-primary-foreground/80">
            Solicitações de manutenção, sugestões e reclamações serão integradas em breve.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3 text-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><Phone className="h-4 w-4" /></div>
              <div><p className="font-medium">Portaria 24h</p><p className="text-primary-foreground/70">—</p></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><Mail className="h-4 w-4" /></div>
              <div><p className="font-medium">Síndica</p><p className="text-primary-foreground/70">—</p></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><MapPin className="h-4 w-4" /></div>
              <div><p className="font-medium">Administração</p><p className="text-primary-foreground/70">—</p></div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Portal Condomínio Inteligente · Portal restrito a moradores
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
        <div className="mt-6 flex gap-3">
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

function MyPaymentGrid({ rows, year }: { rows: HistoricoRow[]; year: number }) {
  const byMonth = new Map<number, HistoricoRow>();
  rows.forEach((r) => byMonth.set(r.mes, r));
  const currentMonth = new Date().getMonth() + 1;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Pagamentos {year}</h3>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => {
          const monthNum = i + 1;
          const row = byMonth.get(monthNum);
          const uiStatus = row ? HISTORICO_DB_TO_UI[row.status] : null;
          const isFuture = monthNum > currentMonth;
          const isCurrent = monthNum === currentMonth;
          return (
            <div key={monthNum} className={`rounded-xl border p-3 ${isCurrent ? "border-primary bg-primary/5" : isFuture ? "border-dashed border-border bg-secondary/30" : "border-border bg-card"}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{MONTH_NAMES_PT_SHORT[i]}</p>
                {isCurrent && (
                  <span className="rounded-full bg-primary px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">Atual</span>
                )}
              </div>
              {isFuture ? (
                <p className="mt-3 text-[11px] italic text-muted-foreground">A faturar</p>
              ) : uiStatus ? (
                <span className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[uiStatus]}`}>
                  {uiStatus}
                </span>
              ) : (
                <p className="mt-3 text-[11px] italic text-muted-foreground">Sem registro</p>
              )}
            </div>
          );
        })}
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

type MoradorInfo = { id: string; nome_completo: string; unidade: string };

function AdminDashboard({ profile, onLogout, adminAgenciaToggle }: { profile: Profile; onLogout: () => void; adminAgenciaToggle?: ReactNode }) {
  const [pautas, setPautas] = useState<PautaRow[]>([]);
  const [pautasLoading, setPautasLoading] = useState(true);
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);

  const [reservas, setReservas] = useState<ReservaComMorador[]>([]);
  const [reservasLoading, setReservasLoading] = useState(true);

  const [historico, setHistorico] = useState<HistoricoRow[]>([]);
  const [moradores, setMoradores] = useState<MoradorInfo[]>([]);
  const [finLoading, setFinLoading] = useState(true);
  const [historyUnitId, setHistoryUnitId] = useState<string | null>(null);

  const [obras, setObras] = useState<ObraRow[]>([]);
  const [obrasLoading, setObrasLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [newMoradorOpen, setNewMoradorOpen] = useState(false);
  const [newObraOpen, setNewObraOpen] = useState(false);
  const [newPautaOpen, setNewPautaOpen] = useState(false);
  const [editObra, setEditObra] = useState<ObraRow | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [editMorador, setEditMorador] = useState<MoradorInfo | null>(null);
  const [deleteMoradorId, setDeleteMoradorId] = useState<string | null>(null);



  const loadPautas = useCallback(async () => {
    setPautasLoading(true);
    try { setPautas(await fetchPautasAtivas(profile.condominio_id)); }
    catch (e) { console.error(e); toast.error("Erro ao carregar pautas."); }
    finally { setPautasLoading(false); }
  }, [profile.condominio_id]);

  const loadReservas = useCallback(async () => {
    setReservasLoading(true);
    try { setReservas(await fetchReservasDoCondominio(profile.condominio_id)); }
    catch (e) { console.error(e); toast.error("Erro ao carregar reservas."); }
    finally { setReservasLoading(false); }
  }, [profile.condominio_id]);

  const loadFinanceiro = useCallback(async () => {
    setFinLoading(true);
    try {
      const [h, m] = await Promise.all([
        fetchHistoricoCondominio(profile.condominio_id),
        fetchMoradoresDoCondominio(profile.condominio_id),
      ]);
      setHistorico(h);
      setMoradores(m);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar dados financeiros.");
    } finally {
      setFinLoading(false);
    }
  }, [profile.condominio_id]);

  const loadObras = useCallback(async () => {
    setObrasLoading(true);
    try { setObras(await fetchObras(profile.condominio_id)); }
    catch (e) { console.error(e); toast.error("Erro ao carregar obras."); }
    finally { setObrasLoading(false); }
  }, [profile.condominio_id]);

  useEffect(() => {
    loadPautas(); loadReservas(); loadFinanceiro(); loadObras();
  }, [loadPautas, loadReservas, loadFinanceiro, loadObras]);

  const stats = useMemo(() => {
    const counts: Record<FinancialStatus, number> = { "Em dia": 0, Pendente: 0, Atrasado: 0 };
    moradores.forEach((m) => {
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

  const handleHistoricoChange = async (rowId: string, uiStatus: FinancialStatus) => {
    try {
      await atualizarHistorico(rowId, HISTORICO_UI_TO_DB[uiStatus]);
      setHistorico((prev) => prev.map((r) => (r.id === rowId ? { ...r, status: HISTORICO_UI_TO_DB[uiStatus] } : r)));
      toast.success(`Status atualizado para "${uiStatus}".`);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao atualizar histórico.");
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

  const handleDeleteMorador = async () => {
    if (!deleteMoradorId) return;
    try {
      await removerMorador(deleteMoradorId);
      toast.success("Morador removido.");
      setDeleteMoradorId(null);
      loadFinanceiro();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover morador.");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-display text-lg font-semibold tracking-tight">Condomínio Inteligente</span>
            <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-[color:var(--gold)]/20 px-2.5 py-0.5 text-xs font-semibold text-[color:var(--gold)]">
              <ShieldCheck className="h-3 w-3" /> Painel da Síndica
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-sm sm:flex">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--gold)]/20 text-[color:var(--gold)]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="font-medium capitalize">{profile.nome_completo}</span>
            </div>
            {adminAgenciaToggle}
            <Button onClick={onLogout} variant="outline" size="sm" className="rounded-full">
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

      {/* Inadimplência */}
      <section className="bg-secondary/40 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
                <Wallet className="h-3.5 w-3.5" /> Situação financeira
              </span>
              <h2 className="mt-3 text-3xl font-medium md:text-4xl">Unidades & cobranças</h2>
              <p className="mt-4 text-muted-foreground">
                Clique em uma linha para editar o histórico mensal ({currentYear}).
              </p>
            </div>
            <Button onClick={() => setNewMoradorOpen(true)} className="rounded-full">
              <Plus className="h-4 w-4" /> Cadastrar morador
            </Button>
          </div>


          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Unidade</TableHead>
                  <TableHead>Morador responsável</TableHead>
                  <TableHead>Status ({MONTH_NAMES_PT_SHORT[currentMonth - 1]}/{currentYear})</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : moradores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhuma unidade cadastrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  moradores.map((m) => {
                    const row = historico.find((h) => h.unidade_id === m.id && h.ano === currentYear && h.mes === currentMonth);
                    const uiStatus: FinancialStatus = row ? HISTORICO_DB_TO_UI[row.status] : "Pendente";
                    return (
                      <TableRow key={m.id} onClick={() => setHistoryUnitId(m.id)} className="cursor-pointer">
                        <TableCell className="font-mono font-semibold">{m.unidade}</TableCell>
                        <TableCell>{m.nome_completo}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[uiStatus]}`}>
                            {uiStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="h-9 rounded-full" onClick={() => setHistoryUnitId(m.id)}>
                              <History className="h-3.5 w-3.5" /> Histórico
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 rounded-full" onClick={() => setEditMorador(m)}>
                              <Pencil className="h-3.5 w-3.5" /> Editar
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteMoradorId(m.id)}>
                              <Trash2 className="h-3.5 w-3.5" /> Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <PaymentHistoryDialog
        moradorId={historyUnitId}
        moradores={moradores}
        historico={historico}
        year={currentYear}
        onClose={() => setHistoryUnitId(null)}
        onChange={handleHistoricoChange}
      />

      {/* Votações */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
                <Vote className="h-3.5 w-3.5" /> Votações
              </span>
              <h2 className="mt-3 text-3xl font-medium md:text-4xl">Resultados em tempo real</h2>
              <p className="mt-4 text-muted-foreground">
                Visível apenas para a síndica. Os moradores não enxergam os parciais.
              </p>
            </div>
            <Button onClick={() => setNewPautaOpen(true)} className="rounded-full">
              <Plus className="h-4 w-4" /> Nova pauta
            </Button>
          </div>


          <div className="mt-8 space-y-4">
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
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Reservas */}
      <ReservationsManagement
        reservas={reservas}
        loading={reservasLoading}
        onApprove={handleApprove}
        onReject={handleReject}
        onBlock={() => setBlockOpen(true)}
        onDeleteBloqueio={handleDeleteBloqueio}
      />

      {/* Obras admin */}
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
                <ObrasTabs obras={obras} admin onEdit={setEditObra} onChanged={loadObras} />
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

      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Portal Condomínio Inteligente · Painel administrativo
        </div>
      </footer>

      <NewMoradorDialog
        open={newMoradorOpen}
        onOpenChange={setNewMoradorOpen}
        condominioId={profile.condominio_id}
        onCreated={loadFinanceiro}
      />
      <NewObraDialog
        open={newObraOpen}
        onOpenChange={setNewObraOpen}
        condominioId={profile.condominio_id}
        onCreated={loadObras}
      />
      <NewPautaDialog
        open={newPautaOpen}
        onOpenChange={setNewPautaOpen}
        condominioId={profile.condominio_id}
        onCreated={loadPautas}
      />
      <EditObraDialog
        obra={editObra}
        onOpenChange={(v) => { if (!v) setEditObra(null); }}
        onSaved={loadObras}
      />
      <BlockDateDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        profile={profile}
        onCreated={loadReservas}
      />
      <EditMoradorDialog
        morador={editMorador}
        onOpenChange={(v) => { if (!v) setEditMorador(null); }}
        onSaved={loadFinanceiro}
      />
      <ConfirmDeleteMoradorDialog
        open={deleteMoradorId !== null}
        onOpenChange={(v) => { if (!v) setDeleteMoradorId(null); }}
        onConfirm={handleDeleteMorador}
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
  const [unidade, setUnidade] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setNome(""); setEmail(""); setUnidade(""); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !unidade.trim()) {
      toast.error("Preencha nome e unidade.");
      return;
    }
    setSaving(true);
    try {
      await criarMorador({
        condominio_id: condominioId,
        nome_completo: nome.trim(),
        unidade: unidade.trim(),
      });
      toast.success("Morador cadastrado. Envie o convite por email quando o fluxo estiver ativo.");
      reset();
      onOpenChange(false);
      onCreated();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao cadastrar morador.");
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
            O morador receberá acesso ao portal quando o fluxo de convite por email for ativado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nm-nome">Nome completo</Label>
            <Input id="nm-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nm-email">Email</Label>
            <Input id="nm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="opcional por enquanto" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nm-un">Unidade</Label>
            <Input id="nm-un" value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="Ex.: 101" required />
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
}: {
  pauta: PautaRow;
  expanded: boolean;
  onToggleAudit: () => void;
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
          <p className="font-medium leading-snug">{pauta.titulo}</p>
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
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Participação: <strong className="text-foreground">{total}</strong>{" "}
          {total === 1 ? "morador" : "moradores"}
        </p>
        <Button type="button" size="sm" variant="outline" className="h-8 rounded-full text-xs" onClick={onToggleAudit} aria-expanded={expanded}>
          <Search className="h-3.5 w-3.5" />
          {expanded ? "Ocultar auditoria" : "Auditar votação"}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </Button>
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
}: {
  reservas: ReservaComMorador[];
  loading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string, motivo: string) => void;
  onBlock: () => void;
  onDeleteBloqueio: (id: string) => void;
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
          <div className="flex items-center gap-3">
            <Button onClick={onBlock} variant="outline" className="rounded-full">
              <Lock className="h-4 w-4" /> Bloquear data
            </Button>
            <div className="rounded-full bg-[color:var(--gold)]/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--gold)]">
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
                          {r.data_inicio.split("-").reverse().join("/")}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${RESERVATION_STATUS_STYLES[uiStatus]}`}>
                            {uiStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
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
                  <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-3">
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-semibold">{spaceName} · <span className="font-mono">{b.data_inicio.split("-").reverse().join("/")}</span></p>
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
      </div>
    </section>
  );
}


// ================== RESERVATION MODULE (morador) ==================

function ReservationModule({
  onRequest,
}: {
  onRequest: (spaceId: string, spaceName: string, dateIso: string) => void;
}) {
  const [selectedSpace, setSelectedSpace] = useState<string>(RESERVATION_SPACES[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });

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
    onRequest(space.id, space.name, selectedDate);
    setSelectedDate(null);
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
            const disabled = cell.past;
            return (
              <button
                key={cell.iso}
                type="button"
                disabled={disabled}
                onClick={() => setSelectedDate(cell.iso)}
                className={`group relative flex aspect-square flex-col items-center justify-center rounded-lg border text-center transition-all ${
                  cell.past ? "cursor-not-allowed border-border bg-secondary/40 opacity-40" : isSelected ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-soft)]" : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/50"
                }`}
              >
                <span className="font-display text-sm font-semibold sm:text-base">{cell.day}</span>
                {!cell.past && !isSelected && (
                  <span className="mt-0.5 text-[9px] font-medium text-[color:var(--sage)]">Livre</span>
                )}
              </button>
            );
          })}
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
        <Button onClick={submit} size="lg" className="mt-auto w-full rounded-full" disabled={!selectedDate || !space}>
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
  onChanged,
}: {
  obras: ObraRow[];
  admin?: boolean;
  onEdit?: (o: ObraRow) => void;
  onChanged?: () => void;
}) {
  const completed = obras.filter((o) => o.status === "concluido" || o.progresso_atual >= 100);
  const inProgress = obras.filter((o) => o.status === "em_andamento");
  const planned = obras.filter((o) => o.status === "planejado");

  return (
    <Tabs defaultValue="inProgress" className="mt-10">
      <TabsList className="h-auto w-full justify-start gap-1 rounded-full bg-card p-1.5 shadow-[var(--shadow-soft)] sm:w-auto">
        <TabsTrigger value="completed" className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Concluídas</TabsTrigger>
        <TabsTrigger value="inProgress" className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Em andamento</TabsTrigger>
        <TabsTrigger value="planned" className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Planejadas</TabsTrigger>
      </TabsList>

      <TabsContent value="completed" className="mt-10">
        {completed.length === 0 ? <EmptyState>Nenhuma obra concluída.</EmptyState> : <ObraTimeline items={completed} icon={CheckCircle2} accent="var(--sage)" admin={admin} onEdit={onEdit} onChanged={onChanged} />}
      </TabsContent>
      <TabsContent value="inProgress" className="mt-10">
        {inProgress.length === 0 ? <EmptyState>Nenhuma obra em andamento.</EmptyState> : <ObraTimeline items={inProgress} icon={Hammer} accent="var(--gold)" withUpdates admin={admin} onEdit={onEdit} onChanged={onChanged} />}
      </TabsContent>
      <TabsContent value="planned" className="mt-10">
        {planned.length === 0 ? <EmptyState>Nenhuma obra planejada.</EmptyState> : <ObraTimeline items={planned} icon={Clock} accent="var(--primary)" admin={admin} onEdit={onEdit} onChanged={onChanged} />}
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
  onChanged,
}: {
  items: ObraRow[];
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  withUpdates?: boolean;
  admin?: boolean;
  onEdit?: (o: ObraRow) => void;
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
          {item.descricao && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.descricao}</p>}

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">Conclusão</span>
              <span className="font-mono font-semibold" style={{ color: accent }}>{item.progresso_atual}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full transition-all" style={{ width: `${item.progresso_atual}%`, backgroundColor: accent }} />
            </div>
          </div>

          {withUpdates && <ObraUpdatesGallery obraId={item.id} accent={accent} admin={admin} />}

          {admin && onEdit && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-5 h-8 gap-1.5 rounded-full text-xs"
              onClick={() => onEdit(item)}
            >
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Button>
          )}

          <span className="absolute right-5 top-5 text-xs font-mono text-muted-foreground/60">0{i + 1}</span>
        </li>
      ))}
    </ol>
  );
}

function ObraUpdatesGallery({ obraId, accent, admin = false }: { obraId: string; accent: string; admin?: boolean }) {
  const [items, setItems] = useState<ObraAtualizacaoRow[] | null>(null);
  const [active, setActive] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
          <img src={current.foto_url} alt={current.descricao ?? ""} className="h-full w-full object-cover" />
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

function DocumentsArchive() {
  if (DOCUMENTS_BY_YEAR.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
        Nenhum documento publicado ainda.
      </div>
    );
  }

  const currentMonthKey = DOCUMENTS_BY_YEAR[0]?.months[0]?.key ?? "";
  return (
    <div className="space-y-6">
      {DOCUMENTS_BY_YEAR.map((yearGroup, yi) => (
        <div key={yearGroup.year} className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <h3 className="font-display text-lg font-semibold">{yearGroup.year}</h3>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {yearGroup.months.reduce((sum, m) => sum + m.docs.length, 0)} arquivos
            </span>
          </div>
          <Accordion type="multiple" defaultValue={yi === 0 ? [currentMonthKey] : []} className="px-2">
            {yearGroup.months.map((m) => (
              <AccordionItem key={m.key} value={m.key} className="border-b last:border-b-0">
                <AccordionTrigger className="px-3 hover:no-underline [&[data-state=open]_.folder-closed]:hidden [&[data-state=closed]_.folder-open]:hidden">
                  <div className="flex items-center gap-3">
                    <Folder className="folder-closed h-4 w-4 text-muted-foreground" />
                    <FolderOpen className="folder-open h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{m.name}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                      {m.docs.length} {m.docs.length === 1 ? "doc" : "docs"}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3">
                  <ul className="space-y-2 pl-7">
                    {m.docs.map((doc) => (
                      <li key={doc.title} className="group flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-all hover:border-[color:var(--sage)]">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{doc.title}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">PDF · {doc.size}</p>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => toast.info(`Baixando "${doc.title}"…`)} aria-label={`Baixar ${doc.title}`} className="shrink-0 rounded-full text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground">
                          <Download className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
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
  onChange: (rowId: string, status: FinancialStatus) => void;
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
          <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => {
              const monthNum = i + 1;
              const row = rowsByMonth.get(monthNum);
              const uiStatus = row ? HISTORICO_DB_TO_UI[row.status] : null;
              const isFuture = i > currentMonthIdx;
              const isCurrent = i === currentMonthIdx;
              return (
                <div key={i} className={`rounded-xl border p-3 transition-all ${isCurrent ? "border-primary bg-primary/5" : isFuture ? "border-dashed border-border bg-secondary/30" : "border-border bg-card"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {MONTH_NAMES_PT_SHORT[i]}
                    </p>
                    {isCurrent && (
                      <span className="rounded-full bg-primary px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                        Atual
                      </span>
                    )}
                  </div>
                  {isFuture ? (
                    <p className="mt-3 text-[11px] italic text-muted-foreground">A faturar</p>
                  ) : row && uiStatus ? (
                    <Select value={uiStatus} onValueChange={(v) => onChange(row.id, v as FinancialStatus)}>
                      <SelectTrigger className={`mt-2 h-8 w-full border-0 px-2 text-[11px] font-bold uppercase tracking-wider ${STATUS_STYLES[uiStatus]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Em dia">Em dia (Pago)</SelectItem>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-3 text-[11px] italic text-muted-foreground">Sem registro</p>
                  )}
                </div>
              );
            })}
          </div>
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
  const [unidade, setUnidade] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (morador) { setNome(morador.nome_completo); setUnidade(morador.unidade); }
  }, [morador]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!morador) return;
    if (!nome.trim() || !unidade.trim()) {
      toast.error("Preencha nome e unidade.");
      return;
    }
    setSaving(true);
    try {
      await atualizarMorador(morador.id, {
        nome_completo: nome.trim(),
        unidade: unidade.trim(),
      });
      toast.success("Morador atualizado.");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar morador.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={morador !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Editar morador</DialogTitle>
          <DialogDescription>Atualize nome e unidade.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="em-nome">Nome completo</Label>
            <Input id="em-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="em-un">Unidade</Label>
            <Input id="em-un" value={unidade} onChange={(e) => setUnidade(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDeleteMoradorDialog({
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
          <DialogTitle className="font-display text-2xl">Excluir morador</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover este morador? Esta ação não pode ser desfeita.
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

