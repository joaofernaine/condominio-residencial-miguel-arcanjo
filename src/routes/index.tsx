import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
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
  Lock,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Search,
  Send,
  Sparkles,
  Store,
  Tag,
  User,
  Vote,
  ThumbsUp,
  ThumbsDown,
  UserPlus,
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
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Toaster } from "@/components/ui/sonner";

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

// ----------------- DATA -----------------
// Todos os dados vêm de `src/lib/mocks.ts` (atualmente vazio — pronto para
// receber queries reais via Supabase). Substitua os `useState(INITIAL_*)`
// por `useQuery({ queryFn: () => supabase.from(...).select() })`.
import {
  type FinancialStatus,
  type Role,
  type Poll,
  type Apartment,
  type ResidentAccount,
  type Reservation,
  FIRST_ACCESS_EMAIL,
  FIRST_ACCESS_TEMP_PASSWORD,
  MONTH_NAMES_PT,
  MONTH_NAMES_PT_SHORT,
  RESERVATION_STATUS_STYLES,
  amenities,
  publicNotices,
  projects,
  DOCUMENTS_BY_YEAR,
  RESERVATION_SPACES,
  RESERVED_DATES,
  CLASSIFIEDS,
  INITIAL_POLLS,
  MOCK_VOTE_DETAILS,
  INITIAL_RESERVATIONS,
  INITIAL_APARTMENTS,
  INITIAL_RESIDENTS,
} from "@/lib/mocks";

// ----------------- ROOT -----------------

function Index() {
  const [role, setRole] = useState<Role | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [residentName, setResidentName] = useState("");
  const [residentEmail, setResidentEmail] = useState("");
  const [firstAccessOpen, setFirstAccessOpen] = useState(false);
  const [pendingFirstAccess, setPendingFirstAccess] = useState<{ email: string; name: string } | null>(null);

  const [polls, setPolls] = useState<Poll[]>(INITIAL_POLLS);
  const [apartments, setApartments] = useState<Apartment[]>(INITIAL_APARTMENTS);
  const [residents, setResidents] = useState<ResidentAccount[]>(INITIAL_RESIDENTS);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const asAdmin = formData.get("role") === "admin";
    if (!email) return;

    // TODO: substituir por supabase.auth.signInWithPassword({ email, password }).
    if (
      FIRST_ACCESS_EMAIL &&
      !asAdmin &&
      email === FIRST_ACCESS_EMAIL &&
      password === FIRST_ACCESS_TEMP_PASSWORD
    ) {
      setPendingFirstAccess({ email, name: "" });
      setLoginOpen(false);
      setFirstAccessOpen(true);
      return;
    }

    setResidentEmail(email);
    setResidentName(email.split("@")[0] || "Morador");
    setRole(asAdmin ? "admin" : "resident");
    setLoginOpen(false);
    toast.success(
      asAdmin ? "Acesso administrativo ativado." : "Bem-vindo(a) ao portal do morador!",
    );
  };

  const handleFirstAccessComplete = () => {
    if (!pendingFirstAccess) return;
    setResidentEmail(pendingFirstAccess.email);
    setResidentName(pendingFirstAccess.name);
    setRole("resident");
    setFirstAccessOpen(false);
    setPendingFirstAccess(null);
    toast.success("Senha atualizada com sucesso!");
  };

  const handleLogout = () => {
    // TODO: supabase.auth.signOut()
    setRole(null);
    setResidentName("");
    setResidentEmail("");
    toast.info("Você saiu do portal.");
  };

  const handleVote = (pollId: string, choice: "yes" | "no") => {
    if (!residentEmail) return;
    // TODO: supabase.from('poll_votes').insert({ poll_id, user_id, choice })
    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p;
        if (p.votedBy.includes(residentEmail)) {
          toast.error("Você já votou nesta enquete.");
          return p;
        }
        toast.success(`Voto computado: ${choice === "yes" ? "Sim" : "Não"}.`);
        return {
          ...p,
          yes: choice === "yes" ? p.yes + 1 : p.yes,
          no: choice === "no" ? p.no + 1 : p.no,
          votedBy: [...p.votedBy, residentEmail],
        };
      }),
    );
  };

  const handleRequestReservation = (spaceId: string, spaceName: string, dateIso: string) => {
    // TODO: supabase.from('reservations').insert({...})
    const now = new Date().toLocaleDateString("pt-BR");
    const newRes: Reservation = {
      id: `r${Date.now()}`,
      unit: "",
      resident: residentName || "Morador",
      email: residentEmail,
      spaceId,
      spaceName,
      date: dateIso,
      status: "Pendente",
      createdAt: now,
    };
    setReservations((prev) => [newRes, ...prev]);
    toast.success(`Solicitação enviada: ${spaceName} em ${dateIso.split("-").reverse().join("/")}.`);
  };

  const handleApproveReservation = (id: string) => {
    // TODO: supabase.from('reservations').update({ status: 'Confirmada' }).eq('id', id)
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Confirmada", reason: undefined } : r)));
    toast.success("Reserva aprovada com sucesso!");
  };

  const handleRejectReservation = (id: string, reason: string) => {
    // TODO: supabase.from('reservations').update({ status: 'Recusada', reason }).eq('id', id)
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Recusada", reason } : r)));
    toast.error("Reserva recusada.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-center" richColors />

      {role === "admin" ? (
        <AdminDashboard
          adminName={residentName}
          onLogout={handleLogout}
          onSwitchToResident={() => setRole("resident")}
          apartments={apartments}
          setApartments={setApartments}
          residents={residents}
          setResidents={setResidents}
          polls={polls}
          setPolls={setPolls}
          reservations={reservations}
          onApproveReservation={handleApproveReservation}
          onRejectReservation={handleRejectReservation}
        />
      ) : role === "resident" ? (
        <ResidentDashboard
          residentName={residentName}
          residentEmail={residentEmail}
          onLogout={handleLogout}
          onSwitchToAdmin={() => setRole("admin")}
          polls={polls}
          onVote={handleVote}
          reservations={reservations}
          onRequestReservation={handleRequestReservation}
        />
      ) : (
        <PublicLanding onOpenLogin={() => setLoginOpen(true)} />
      )}

      {/* Floating role toggle (demo only) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        {role === null ? (
          <button
            onClick={() => setLoginOpen(true)}
            className="rounded-full bg-foreground px-4 py-3 text-xs font-semibold uppercase tracking-wider text-background shadow-lg hover:opacity-90"
            type="button"
          >
            🔐 Entrar
          </button>
        ) : (
          <>
            <div className="rounded-full bg-foreground/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-background shadow">
              Visão: {role === "admin" ? "Síndico" : "Morador"}
            </div>
            <button
              onClick={() => setRole(role === "admin" ? "resident" : "admin")}
              className="rounded-full bg-[color:var(--gold)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary shadow-lg hover:opacity-90"
              type="button"
            >
              ↔ {role === "admin" ? "Ver como morador" : "Ver como síndico"}
            </button>
            <button
              onClick={handleLogout}
              className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-wider text-background shadow-lg hover:opacity-90"
              type="button"
            >
              🔓 Sair
            </button>
          </>
        )}
      </div>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} onSubmit={handleLogin} />
      <FirstAccessDialog open={firstAccessOpen} onComplete={handleFirstAccessComplete} />
    </div>
  );
}

// ----------------- LOGIN DIALOG -----------------

function LoginDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Portal do Morador</DialogTitle>
          <DialogDescription>
            Acesse com seu e-mail cadastrado para ver informações exclusivas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="mt-2 space-y-4">
          <div>
            <Label htmlFor="login-email">E-mail</Label>
            <Input id="login-email" name="email" type="email" required className="mt-2 h-11" placeholder="voce@email.com" />
          </div>
          <div>
            <Label htmlFor="login-password">Senha</Label>
            <Input id="login-password" name="password" type="password" required className="mt-2 h-11" placeholder="••••••••" />
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 p-3 text-sm">
            <input type="checkbox" name="role" value="admin" className="h-4 w-4 accent-[color:var(--gold)]" />
            <span>Entrar como <strong>Síndico</strong> (acesso administrativo)</span>
          </label>
          <Button type="submit" size="lg" className="w-full rounded-full">
            <LogIn className="h-4 w-4" /> Entrar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ----------------- FIRST-ACCESS PASSWORD RESET -----------------

function FirstAccessDialog({
  open,
  onComplete,
}: {
  open: boolean;
  onComplete: () => void;
}) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setPw("");
    setPw2("");
    setSubmitting(false);
  };

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) {
      toast.error("A nova senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (strength < 3) {
      toast.error("Escolha uma senha mais forte (letras, números e símbolos).");
      return;
    }
    if (pw !== pw2) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setSubmitting(true);
    // TODO: supabase.auth.updateUser({ password: pw })
    setTimeout(() => {
      reset();
      onComplete();
    }, 700);
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
            Conforme as diretrizes da LGPD e para a segurança das informações
            financeiras do condomínio, você deve alterar sua senha provisória agora.
          </DialogDescription>
        </div>

        <form onSubmit={submit} className="space-y-5 px-7 py-7">
          <div>
            <Label htmlFor="fa-pw" className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Nova senha
            </Label>
            <Input
              id="fa-pw"
              type="password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
              className="mt-2 h-11"
              placeholder="Mínimo 8 caracteres"
              maxLength={60}
            />
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
            <Input
              id="fa-pw2"
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              required
              className="mt-2 h-11"
              placeholder="Repita a nova senha"
              maxLength={60}
            />
            {pw2.length > 0 && pw !== pw2 && (
              <p className="mt-1 text-xs font-medium text-destructive">As senhas não coincidem.</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-secondary/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
            <p className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--sage)]" /> Sua senha é criptografada
            </p>
            <p className="mt-1">
              A administração do condomínio nunca terá acesso à sua senha pessoal. Apenas você poderá
              utilizá-la para acessar o portal.
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full rounded-full bg-[color:var(--gold)] text-primary hover:bg-[color:var(--gold)]/90"
          >
            {submitting ? (
              <>
                <Lock className="h-4 w-4 animate-pulse" /> Salvando com segurança…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" /> Salvar e Acessar
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ----------------- EMPTY STATE HELPER -----------------

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

// ----------------- PUBLIC LANDING -----------------

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
        <img
          src={heroImage}
          alt="Fachada do Portal Condomínio Inteligente ao entardecer"
          width={1920}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-end px-6 pb-20 pt-40 text-primary-foreground">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Um lugar para chamar de lar
            </span>
            <h1 className="mt-6 font-display text-5xl font-medium leading-[1.05] sm:text-6xl md:text-7xl">
              Bem-vindo ao<br />
              <span className="italic text-[color:var(--gold)]">Portal Condomínio Inteligente</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/85">
              Conforto, segurança e convivência em harmonia com a natureza. Mais do que um endereço,
              uma comunidade que cuida de cada detalhe.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                onClick={onOpenLogin}
                size="lg"
                className="rounded-full bg-[color:var(--gold)] text-primary hover:bg-[color:var(--gold)]/90"
              >
                <LogIn className="h-4 w-4" /> Entrar no Portal do Morador
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-white/5 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
              >
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
            <h2 className="mt-3 text-4xl font-medium md:text-5xl">
              Um ambiente pensado para o seu bem-estar
            </h2>
            <p className="mt-4 text-muted-foreground">
              Localizado em uma das regiões mais arborizadas da cidade, o Condomínio Inteligente oferece
              infraestrutura completa para todas as idades, com tecnologia, sustentabilidade e
              segurança de ponta.
            </p>
          </div>

          <div id="estrutura" className="mt-14">
            {amenities.length === 0 ? (
              <EmptyState>Cadastre as comodidades no Supabase para exibi-las aqui.</EmptyState>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {amenities.map((a) => (
                  <div
                    key={a.title}
                    className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-[color:var(--sage)] hover:shadow-[var(--shadow-soft)]"
                  >
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
                  <article
                    key={n.title}
                    className="group flex flex-col rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                        {n.tag}
                      </span>
                      <time className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {n.date}
                      </time>
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

// ----------------- RESIDENT DASHBOARD -----------------

function ResidentDashboard({
  residentName,
  residentEmail,
  onLogout,
  onSwitchToAdmin,
  polls,
  onVote,
  reservations,
  onRequestReservation,
}: {
  residentName: string;
  residentEmail: string;
  onLogout: () => void;
  onSwitchToAdmin: () => void;
  polls: Poll[];
  onVote: (pollId: string, choice: "yes" | "no") => void;
  reservations: Reservation[];
  onRequestReservation: (spaceId: string, spaceName: string, dateIso: string) => void;
}) {
  const myReservations = reservations.filter((r) => !residentEmail || r.email === residentEmail);
  const [form, setForm] = useState({ unit: "", type: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim() || !form.type) {
      toast.error("Preencha o tipo e a mensagem.");
      return;
    }
    // TODO: supabase.from('support_tickets').insert({...})
    toast.success("Chamado registrado. A administração responderá em até 48h.");
    setForm({ unit: "", type: "", message: "" });
  };

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
            </div>
            <Button onClick={onSwitchToAdmin} variant="ghost" size="sm" className="rounded-full">
              <ShieldCheck className="h-4 w-4" /> Síndico
            </Button>
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
            {polls.length === 0 ? (
              <EmptyState>Nenhuma enquete aberta no momento.</EmptyState>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {polls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    hasVoted={poll.votedBy.includes(residentEmail)}
                    onVote={onVote}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
                <FileText className="h-3.5 w-3.5" /> Transparência financeira
              </span>
              <h2 className="mt-3 text-3xl font-medium md:text-4xl">Documentos & balanços</h2>
              <p className="mt-4 text-muted-foreground">
                Atas, balancetes e prestações de contas auditadas. Baixe a qualquer momento.
              </p>
              <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
                Saldo em caixa e indicadores serão exibidos aqui após integração com o Supabase.
              </div>
            </div>

            <DocumentsArchive />
          </div>
        </div>
      </section>

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

          <Tabs defaultValue="inProgress" className="mt-10">
            <TabsList className="h-auto w-full justify-start gap-1 rounded-full bg-card p-1.5 shadow-[var(--shadow-soft)] sm:w-auto">
              <TabsTrigger value="completed" className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Concluídas</TabsTrigger>
              <TabsTrigger value="inProgress" className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Em andamento</TabsTrigger>
              <TabsTrigger value="planned" className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Planejadas</TabsTrigger>
            </TabsList>

            <TabsContent value="completed" className="mt-10">
              {projects.completed.length === 0 ? (
                <EmptyState>Nenhuma obra concluída cadastrada.</EmptyState>
              ) : (
                <ProjectTimeline items={projects.completed} icon={CheckCircle2} accent="var(--sage)" />
              )}
            </TabsContent>
            <TabsContent value="inProgress" className="mt-10">
              {projects.inProgress.length === 0 ? (
                <EmptyState>Nenhuma obra em andamento.</EmptyState>
              ) : (
                <ProjectTimeline items={projects.inProgress} icon={Hammer} accent="var(--gold)" />
              )}
            </TabsContent>
            <TabsContent value="planned" className="mt-10">
              {projects.planned.length === 0 ? (
                <EmptyState>Nenhuma obra planejada.</EmptyState>
              ) : (
                <ProjectTimeline items={projects.planned} icon={Clock} accent="var(--primary)" />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
                <CalendarIcon className="h-3.5 w-3.5" /> Sistema de reservas
              </span>
              <h2 className="mt-3 text-3xl font-medium md:text-4xl">Reserve um espaço</h2>
              <p className="mt-4 text-muted-foreground">
                Navegue pelo calendário mensal e envie um pedido de reserva à
                administração. A confirmação chega em até 24h.
              </p>
            </div>
          </div>

          <ReservationModule onRequest={onRequestReservation} />

          <div className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-medium">Minhas reservas</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Acompanhe o status dos seus pedidos enviados à administração.
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                {myReservations.length} {myReservations.length === 1 ? "pedido" : "pedidos"}
              </span>
            </div>

            {myReservations.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Você ainda não solicitou nenhuma reserva.
              </div>
            ) : (
              <ul className="mt-6 grid gap-3 md:grid-cols-2">
                {myReservations.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                      <CalendarIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug">{r.spaceName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Data: <span className="font-mono">{r.date.split("-").reverse().join("/")}</span>{" "}
                        · solicitado em {r.createdAt}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${RESERVATION_STATUS_STYLES[r.status]}`}
                        >
                          {r.status === "Pendente" && "PENDENTE — Aguardando aprovação"}
                          {r.status === "Confirmada" && "CONFIRMADA"}
                          {r.status === "Recusada" && "RECUSADA"}
                        </span>
                      </div>
                      {r.status === "Recusada" && r.reason && (
                        <p className="mt-2 rounded-md bg-destructive/5 px-2.5 py-1.5 text-[11px] text-destructive">
                          Motivo: {r.reason}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
                <Store className="h-3.5 w-3.5" /> Marketplace interno
              </span>
              <h2 className="mt-3 text-3xl font-medium md:text-4xl">Classificados dos moradores</h2>
              <p className="mt-4 text-muted-foreground">
                Indicações de serviços, vendas e recomendações da nossa própria comunidade.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => toast.info("Em breve: publicar seu próprio anúncio.")}
            >
              <Tag className="h-4 w-4" /> Publicar anúncio
            </Button>
          </div>

          <div className="mt-10">
            {CLASSIFIEDS.length === 0 ? (
              <EmptyState>Nenhum classificado publicado ainda.</EmptyState>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                {CLASSIFIEDS.map((c) => (
                  <article
                    key={c.title}
                    className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1"
                  >
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[color:var(--sage)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--sage)]">
                      <Tag className="h-3 w-3" /> {c.tag}
                    </span>
                    <h3 className="mt-4 text-base font-semibold leading-snug">{c.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                    <div className="mt-5 border-t border-border pt-4 text-xs">
                      <p className="font-semibold text-foreground">{c.author}</p>
                      <p className="mt-1 font-mono text-muted-foreground">{c.contact}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-primary py-20 text-primary-foreground">
        <div
          aria-hidden
          className="absolute -right-32 -top-32 h-96 w-96 rounded-full"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--gold) 45%, transparent), transparent 70%)" }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--gold)]">
              <Mail className="h-3.5 w-3.5" /> Canal do morador
            </span>
            <h2 className="mt-3 text-3xl font-medium md:text-4xl">Abra um chamado ou envie um feedback</h2>
            <p className="mt-4 max-w-lg text-primary-foreground/80">
              Solicitações de manutenção, sugestões e reclamações chegam direto à síndica e são
              respondidas em até 48 horas úteis.
            </p>
            <div className="mt-10 space-y-5 text-sm">
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

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-background p-8 text-foreground shadow-[var(--shadow-elegant)] md:p-10"
          >
            <div className="grid gap-5">
              <div>
                <Label htmlFor="unit">Unidade</Label>
                <Input
                  id="unit"
                  placeholder="Ex: Bl A — 304"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="mt-2 h-11"
                  maxLength={20}
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo de solicitação *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger id="type" className="mt-2 h-11">
                    <SelectValue placeholder="Selecione…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="sugestao">Sugestão</SelectItem>
                    <SelectItem value="reclamacao">Reclamação</SelectItem>
                    <SelectItem value="elogio">Elogio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Mensagem *</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="mt-2 min-h-32 resize-none"
                  maxLength={1000}
                  required
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {form.message.length}/1000
                </p>
              </div>
            </div>
            <Button type="submit" size="lg" className="mt-6 w-full rounded-full">
              <Send className="h-4 w-4" /> Enviar chamado
            </Button>
          </form>
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

// ----------------- POLL CARD -----------------

function PollCard({
  poll,
  hasVoted,
  onVote,
}: {
  poll: Poll;
  hasVoted: boolean;
  onVote: (pollId: string, choice: "yes" | "no") => void;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          <Vote className="h-3.5 w-3.5" /> Enquete aberta
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Voto sigiloso
        </span>
      </div>

      <h3 className="mt-5 text-xl font-semibold leading-snug">{poll.question}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{poll.detail}</p>

      {hasVoted ? (
        <div className="mt-6 rounded-xl border border-[color:var(--sage)]/30 bg-[color:var(--sage)]/10 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--sage)]" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Obrigado! Seu voto foi registrado.
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Os resultados serão divulgados pela síndica após o encerramento.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex gap-3">
          <Button
            onClick={() => onVote(poll.id, "yes")}
            className="flex-1 rounded-full bg-[color:var(--sage)] text-primary-foreground hover:opacity-90"
          >
            <ThumbsUp className="h-4 w-4" /> Votar Sim
          </Button>
          <Button
            onClick={() => onVote(poll.id, "no")}
            variant="outline"
            className="flex-1 rounded-full"
          >
            <ThumbsDown className="h-4 w-4" /> Votar Não
          </Button>
        </div>
      )}
    </article>
  );
}

// ----------------- ADMIN DASHBOARD -----------------

const STATUS_STYLES: Record<FinancialStatus, string> = {
  "Em dia": "bg-[color:var(--sage)]/15 text-[color:var(--sage)] border-[color:var(--sage)]/30",
  Pendente: "bg-[color:var(--gold)]/15 text-[color:var(--gold)] border-[color:var(--gold)]/30",
  Atrasado: "bg-destructive/10 text-destructive border-destructive/30",
};

function AdminDashboard({
  adminName,
  onLogout,
  onSwitchToResident,
  apartments,
  setApartments,
  residents,
  setResidents,
  polls,
  setPolls,
  reservations,
  onApproveReservation,
  onRejectReservation,
}: {
  adminName: string;
  onLogout: () => void;
  onSwitchToResident: () => void;
  apartments: Apartment[];
  setApartments: React.Dispatch<React.SetStateAction<Apartment[]>>;
  residents: ResidentAccount[];
  setResidents: React.Dispatch<React.SetStateAction<ResidentAccount[]>>;
  polls: Poll[];
  setPolls: React.Dispatch<React.SetStateAction<Poll[]>>;
  reservations: Reservation[];
  onApproveReservation: (id: string) => void;
  onRejectReservation: (id: string, reason: string) => void;
}) {
  const [newResident, setNewResident] = useState({ name: "", email: "" });
  const [newPoll, setNewPoll] = useState({ question: "", detail: "" });
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);
  const [historyUnit, setHistoryUnit] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Record<string, FinancialStatus[]>>({});

  const handleHistoryChange = (unit: string, monthIdx: number, status: FinancialStatus) => {
    // TODO: supabase.from('payment_history').upsert({ unit, month_idx: monthIdx, status })
    setPaymentHistory((prev) => ({
      ...prev,
      [unit]: (prev[unit] ?? Array(12).fill("Pendente")).map((s, i) => (i === monthIdx ? status : s)),
    }));
    toast.success(`${MONTH_NAMES_PT[monthIdx]}: status atualizado para "${status}".`);
  };

  const stats = useMemo(() => {
    const counts = apartments.reduce(
      (acc, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1;
        return acc;
      },
      { "Em dia": 0, Pendente: 0, Atrasado: 0 } as Record<FinancialStatus, number>,
    );
    return counts;
  }, [apartments]);

  const handleCreateResident = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newResident.name.trim();
    const email = newResident.email.trim().toLowerCase();
    if (!name || !email) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("E-mail inválido.");
      return;
    }
    if (residents.some((r) => r.email === email)) {
      toast.error("Já existe um morador com este e-mail.");
      return;
    }
    // TODO: supabase.auth.admin.inviteUserByEmail(email) + supabase.from('profiles').insert({...})
    const now = new Date().toLocaleDateString("pt-BR");
    setResidents((prev) => [...prev, { name, email, createdAt: now }]);
    toast.success(`Conta criada para ${name}. Um e-mail de boas-vindas seria enviado.`);
    setNewResident({ name: "", email: "" });
  };

  const handleStatusChange = (unit: string, status: FinancialStatus) => {
    // TODO: supabase.from('apartments').update({ status }).eq('unit', unit)
    setApartments((prev) => prev.map((a) => (a.unit === unit ? { ...a, status } : a)));
    toast.success(`Unidade ${unit}: status atualizado para "${status}".`);
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoll.question.trim()) {
      toast.error("Escreva uma pergunta para a enquete.");
      return;
    }
    // TODO: supabase.from('polls').insert({...})
    setPolls((prev) => [
      ...prev,
      {
        id: `p${Date.now()}`,
        question: newPoll.question.trim(),
        detail: newPoll.detail.trim() || "Sem detalhes adicionais.",
        yes: 0,
        no: 0,
        votedBy: [],
      },
    ]);
    toast.success("Enquete publicada para os moradores.");
    setNewPoll({ question: "", detail: "" });
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
              <span className="font-medium capitalize">{adminName}</span>
            </div>
            <Button onClick={onSwitchToResident} variant="ghost" size="sm" className="rounded-full">
              <User className="h-4 w-4" /> Ver como morador
            </Button>
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
            Gerencie contas de moradores, atualize o status financeiro de cada unidade e
            publique enquetes para a comunidade.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard label="Em dia" value={stats["Em dia"]} accent="var(--sage)" />
            <StatCard label="Pendentes" value={stats["Pendente"]} accent="var(--gold)" />
            <StatCard label="Atrasados" value={stats["Atrasado"]} accent="hsl(var(--destructive))" />
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
              <UserPlus className="h-3.5 w-3.5" /> Cadastro de morador
            </span>
            <h2 className="mt-3 text-3xl font-medium md:text-4xl">Registrar novo morador</h2>
            <p className="mt-4 text-muted-foreground">
              Crie a conta de acesso ao portal. O morador receberá um e-mail com instruções
              para definir a senha.
            </p>

            <form
              onSubmit={handleCreateResident}
              className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
            >
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="new-name">Nome completo</Label>
                  <Input
                    id="new-name"
                    value={newResident.name}
                    onChange={(e) => setNewResident({ ...newResident, name: e.target.value })}
                    className="mt-2 h-11"
                    placeholder="Ex: Nome do morador"
                    maxLength={80}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-email">E-mail</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newResident.email}
                    onChange={(e) => setNewResident({ ...newResident, email: e.target.value })}
                    className="mt-2 h-11"
                    placeholder="morador@email.com"
                    maxLength={120}
                    required
                  />
                </div>
              </div>
              <Button type="submit" size="lg" className="mt-5 w-full rounded-full">
                <UserPlus className="h-4 w-4" /> Criar conta de morador
              </Button>
            </form>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Moradores cadastrados</h3>
            <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead className="text-right">Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {residents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                        Nenhum morador cadastrado ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    residents.map((r) => (
                      <TableRow key={r.email}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-muted-foreground">{r.email}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {r.createdAt}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
              <Wallet className="h-3.5 w-3.5" /> Situação financeira
            </span>
            <h2 className="mt-3 text-3xl font-medium md:text-4xl">Unidades & cobranças</h2>
            <p className="mt-4 text-muted-foreground">
              Atualize manualmente o status de pagamento de cada apartamento. As mudanças
              refletem nos avisos enviados aos moradores.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Unidade</TableHead>
                  <TableHead>Morador responsável</TableHead>
                  <TableHead>Status atual</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhuma unidade cadastrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  apartments.map((apt) => (
                    <TableRow
                      key={apt.unit}
                      onClick={() => setHistoryUnit(apt.unit)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-mono font-semibold">{apt.unit}</TableCell>
                      <TableCell>{apt.resident}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[apt.status]}`}
                        >
                          {apt.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={apt.status}
                            onValueChange={(v) => handleStatusChange(apt.unit, v as FinancialStatus)}
                          >
                            <SelectTrigger className="h-9 w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Em dia">Em dia</SelectItem>
                              <SelectItem value="Pendente">Pendente</SelectItem>
                              <SelectItem value="Atrasado">Atrasado</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-full"
                            onClick={() => setHistoryUnit(apt.unit)}
                          >
                            <History className="h-3.5 w-3.5" /> Histórico
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Clique em uma linha para abrir o histórico mensal de pagamentos.
          </p>
        </div>
      </section>

      <PaymentHistoryDialog
        unit={historyUnit}
        apartments={apartments}
        history={historyUnit ? paymentHistory[historyUnit] ?? Array(12).fill("Pendente") : null}
        onClose={() => setHistoryUnit(null)}
        onChange={handleHistoryChange}
      />

      <section className="bg-background py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--sage)]">
              <Vote className="h-3.5 w-3.5" /> Nova enquete
            </span>
            <h2 className="mt-3 text-3xl font-medium md:text-4xl">Publicar uma votação</h2>
            <p className="mt-4 text-muted-foreground">
              A enquete aparece imediatamente no portal do morador. Cada residente pode votar
              apenas uma vez.
            </p>

            <form
              onSubmit={handleCreatePoll}
              className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
            >
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="poll-q">Pergunta</Label>
                  <Input
                    id="poll-q"
                    value={newPoll.question}
                    onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                    className="mt-2 h-11"
                    placeholder="Ex: Aprovar nova pintura da fachada?"
                    maxLength={140}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="poll-d">Detalhes</Label>
                  <Textarea
                    id="poll-d"
                    value={newPoll.detail}
                    onChange={(e) => setNewPoll({ ...newPoll, detail: e.target.value })}
                    className="mt-2 min-h-24 resize-none"
                    placeholder="Contexto, valor estimado, prazo…"
                    maxLength={400}
                  />
                </div>
              </div>
              <Button type="submit" size="lg" className="mt-5 w-full rounded-full">
                <Send className="h-4 w-4" /> Publicar enquete
              </Button>
            </form>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Resultados em tempo real</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Visível apenas para a síndica. Os moradores não enxergam os parciais.
            </p>
            <div className="mt-4 space-y-4">
              {polls.length === 0 ? (
                <EmptyState>Nenhuma enquete publicada ainda.</EmptyState>
              ) : (
                polls.map((p) => {
                  const total = p.yes + p.no;
                  const yesPct = total === 0 ? 0 : Math.round((p.yes / total) * 100);
                  const noPct = total === 0 ? 0 : 100 - yesPct;
                  return (
                    <div
                      key={p.id}
                      className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <p className="font-medium leading-snug">{p.question}</p>
                        <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                          {total} {total === 1 ? "voto" : "votos"}
                        </span>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span className="font-medium text-[color:var(--sage)]">Sim — {p.yes}</span>
                            <span className="font-mono text-muted-foreground">{yesPct}%</span>
                          </div>
                          <Progress
                            value={yesPct}
                            className="h-2.5 bg-secondary [&>div]:bg-[color:var(--sage)]"
                          />
                        </div>
                        <div>
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span className="font-medium text-destructive">Não — {p.no}</span>
                            <span className="font-mono text-muted-foreground">{noPct}%</span>
                          </div>
                          <Progress
                            value={noPct}
                            className="h-2.5 bg-secondary [&>div]:bg-destructive"
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          Participação registrada:{" "}
                          <strong className="text-foreground">{p.votedBy.length}</strong>{" "}
                          {p.votedBy.length === 1 ? "morador" : "moradores"}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-full text-xs"
                          onClick={() =>
                            setExpandedAudit((cur) => (cur === p.id ? null : p.id))
                          }
                          aria-expanded={expandedAudit === p.id}
                        >
                          <Search className="h-3.5 w-3.5" />
                          {expandedAudit === p.id ? "Ocultar auditoria" : "Auditar votação"}
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform ${
                              expandedAudit === p.id ? "rotate-180" : ""
                            }`}
                          />
                        </Button>
                      </div>

                      {expandedAudit === p.id && <PollAuditTable pollId={p.id} />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      <ReservationsManagement
        reservations={reservations}
        onApprove={onApproveReservation}
        onReject={onRejectReservation}
      />

      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Portal Condomínio Inteligente · Painel administrativo
        </div>
      </footer>
    </>
  );
}

// ----------------- POLL AUDIT TABLE -----------------

function PollAuditTable({ pollId }: { pollId: string }) {
  const records = MOCK_VOTE_DETAILS[pollId] ?? [];
  const yesCount = records.filter((r) => r.choice === "yes").length;
  const noCount = records.filter((r) => r.choice === "no").length;

  return (
    <div className="animate-in fade-in slide-in-from-top-2 mt-5 overflow-hidden rounded-xl border border-primary/15 bg-primary/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 bg-primary px-5 py-3 text-primary-foreground">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--gold)]" />
          Registro de auditoria
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="rounded-full bg-white/10 px-2.5 py-0.5">
            Participantes: <strong className="font-mono">{records.length}</strong>
          </span>
          <span className="rounded-full bg-[color:var(--sage)]/25 px-2.5 py-0.5">SIM: {yesCount}</span>
          <span className="rounded-full bg-destructive/30 px-2.5 py-0.5">NÃO: {noCount}</span>
        </div>
      </div>

      <p className="border-b border-border bg-secondary/30 px-5 py-2.5 text-[11px] italic leading-relaxed text-muted-foreground">
        Esta listagem é restrita à administração para fins de auditoria interna
        e registro de ata.
      </p>

      {records.length === 0 ? (
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
            {records.map((r, i) => (
              <TableRow key={`${r.unit}-${i}`}>
                <TableCell className="font-mono text-xs font-semibold">{r.unit}</TableCell>
                <TableCell>{r.resident}</TableCell>
                <TableCell>
                  {r.choice === "yes" ? (
                    <span className="inline-flex items-center rounded-full border border-[color:var(--sage)]/30 bg-[color:var(--sage)]/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[color:var(--sage)]">
                      SIM
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-destructive">
                      NÃO
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-muted-foreground">
                  {r.timestamp}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ----------------- RESERVATIONS MANAGEMENT (ADMIN) -----------------

function ReservationsManagement({
  reservations,
  onApprove,
  onReject,
}: {
  reservations: Reservation[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const pending = reservations.filter((r) => r.status === "Pendente");
  const processed = reservations.filter((r) => r.status !== "Pendente");

  const confirmReject = (id: string) => {
    onReject(id, reason.trim() || "Sem motivo informado.");
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
              Aprove ou recuse os pedidos enviados pelos moradores. As alterações
              refletem imediatamente no portal do solicitante.
            </p>
          </div>
          <div className="rounded-full bg-[color:var(--gold)]/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--gold)]">
            {pending.length} {pending.length === 1 ? "pedido pendente" : "pedidos pendentes"}
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
                <TableHead className="w-[260px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...pending, ...processed].map((r) => (
                <Fragment key={r.id}>
                  <TableRow>
                    <TableCell className="font-mono text-xs font-semibold">{r.unit}</TableCell>
                    <TableCell>{r.resident}</TableCell>
                    <TableCell>{r.spaceName}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.date.split("-").reverse().join("/")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${RESERVATION_STATUS_STYLES[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "Pendente" ? (
                        rejectingId === r.id ? null : (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              className="h-8 rounded-full bg-[color:var(--sage)] text-primary-foreground hover:opacity-90"
                              onClick={() => onApprove(r.id)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => {
                                setRejectingId(r.id);
                                setReason("");
                              }}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Recusar
                            </Button>
                          </div>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {r.status === "Confirmada" ? "Aprovada" : "Recusada"}
                          {r.status === "Recusada" && r.reason ? ` · ${r.reason}` : ""}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                  {rejectingId === r.id && (
                    <TableRow key={`${r.id}-reject`}>
                      <TableCell colSpan={6} className="bg-destructive/5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Label htmlFor={`reason-${r.id}`} className="shrink-0 text-xs font-semibold uppercase tracking-wider text-destructive">
                            Motivo (opcional)
                          </Label>
                          <Input
                            id={`reason-${r.id}`}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ex: Manutenção no local, débito pendente…"
                            className="h-9 flex-1"
                            maxLength={120}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 rounded-full"
                              onClick={() => {
                                setRejectingId(null);
                                setReason("");
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              className="h-9 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => confirmReject(r.id)}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Confirmar recusa
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
              {reservations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum pedido de reserva no momento.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}

// ----------------- RESERVATION MODULE (morador) -----------------

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
    const cells: ({
      iso: string;
      day: number;
      reserved: boolean;
      past: boolean;
    } | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dateObj = new Date(year, month, d);
      cells.push({
        iso,
        day: d,
        reserved: RESERVED_DATES.has(iso),
        past: dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      });
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
    if (!space) {
      toast.error("Nenhum espaço configurado.");
      return;
    }
    if (!selectedDate) {
      toast.error("Escolha uma data disponível.");
      return;
    }
    onRequest(space.id, space.name, selectedDate);
    setSelectedDate(null);
  };

  const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  if (RESERVATION_SPACES.length === 0) {
    return (
      <div className="mt-10">
        <EmptyState>Nenhum espaço disponível para reserva ainda.</EmptyState>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap gap-2">
          {RESERVATION_SPACES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSelectedSpace(s.id);
                setSelectedDate(null);
              }}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selectedSpace === s.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3 py-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full"
            onClick={() => goMonth(-1)}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="font-display text-base font-semibold capitalize sm:text-lg">
            {MONTH_NAMES_PT[viewMonth.month]} {viewMonth.year}
          </p>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full"
            onClick={() => goMonth(1)}
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {weekdayLabels.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">
          {monthGrid.map((cell, idx) => {
            if (!cell) return <span key={`e-${idx}`} className="aspect-square" />;
            const isSelected = selectedDate === cell.iso;
            const disabled = cell.reserved || cell.past;
            return (
              <button
                key={cell.iso}
                type="button"
                disabled={disabled}
                onClick={() => setSelectedDate(cell.iso)}
                className={`group relative flex aspect-square flex-col items-center justify-center rounded-lg border text-center transition-all ${
                  cell.reserved
                    ? "cursor-not-allowed border-destructive/30 bg-destructive/10"
                    : cell.past
                    ? "cursor-not-allowed border-border bg-secondary/40 opacity-40"
                    : isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                    : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/50"
                }`}
              >
                <span className="font-display text-sm font-semibold sm:text-base">{cell.day}</span>
                {cell.reserved && (
                  <span className="mt-0.5 rounded-sm bg-destructive px-1 py-0 text-[8px] font-bold uppercase tracking-wider text-destructive-foreground">
                    Reserv.
                  </span>
                )}
                {!cell.reserved && !cell.past && !isSelected && (
                  <span className="mt-0.5 text-[9px] font-medium text-[color:var(--sage)]">
                    Livre
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-border bg-card" /> Disponível
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-destructive/30 bg-destructive/10" /> Reservado
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-primary bg-primary" /> Selecionado
          </span>
        </div>
      </div>

      <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Resumo da reserva
        </p>
        <h3 className="mt-3 font-display text-2xl font-medium">{space?.name ?? "—"}</h3>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Capacidade:</strong> {space?.capacity ?? "—"}</p>
          <p><strong className="text-foreground">Taxa:</strong> {space?.price ?? "—"}</p>
          <p>
            <strong className="text-foreground">Data:</strong>{" "}
            {selectedDate
              ? selectedDate.split("-").reverse().join("/")
              : "Selecione um dia disponível"}
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

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: `color-mix(in oklab, ${accent} 100%, transparent)` }}
        />
      </div>
      <p className="mt-3 font-display text-3xl font-medium">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">unidades</p>
    </div>
  );
}

// ----------------- TIMELINE -----------------

type ProjectMilestone = { pct: number; date: string; caption: string; color: string };
type ProjectItem = {
  title: string;
  date: string;
  detail: string;
  progress: number;
  milestones?: ProjectMilestone[];
};

function ProjectTimeline({
  items,
  icon: Icon,
  accent,
}: {
  items: ProjectItem[];
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <ol className="relative space-y-6 border-l-2 border-dashed border-border pl-8 md:grid md:grid-cols-3 md:items-start md:gap-6 md:space-y-0 md:border-0 md:pl-0">
      {items.map((item, i) => (
        <li
          key={item.title}
          className="relative rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
        >
          <span
            className="absolute -left-[42px] top-7 grid h-8 w-8 place-items-center rounded-full text-primary-foreground md:hidden"
            style={{ backgroundColor: `color-mix(in oklab, ${accent} 100%, transparent)` }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div
            className="hidden h-10 w-10 place-items-center rounded-full text-primary-foreground md:grid"
            style={{ backgroundColor: `color-mix(in oklab, ${accent} 100%, transparent)` }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {item.date}
          </p>
          <h3 className="mt-2 text-lg font-semibold leading-snug">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                Conclusão
              </span>
              <span className="font-mono font-semibold" style={{ color: accent }}>
                {item.progress}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${item.progress}%`, backgroundColor: accent }}
              />
            </div>
          </div>

          {item.milestones && item.milestones.length > 0 && (
            <EvolutionGallery milestones={item.milestones} accent={accent} />
          )}

          <span className="absolute right-5 top-5 text-xs font-mono text-muted-foreground/60">
            0{i + 1}
          </span>
        </li>
      ))}
    </ol>
  );
}

// ----------------- EVOLUTION GALLERY -----------------

function EvolutionGallery({
  milestones,
  accent,
}: {
  milestones: ProjectMilestone[];
  accent: string;
}) {
  const [active, setActive] = useState(milestones.length - 1);
  const current = milestones[active];

  return (
    <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <ImageIcon className="h-3.5 w-3.5" style={{ color: accent }} />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Galeria de evolução
        </p>
      </div>

      <div
        className="relative aspect-video w-full overflow-hidden rounded-lg"
        style={{
          background: `linear-gradient(135deg, ${current.color}, color-mix(in oklab, ${current.color} 65%, #000))`,
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-primary-foreground/90">
          <ImageIcon className="h-8 w-8 opacity-70" />
          <p className="mt-2 text-[11px] font-medium uppercase tracking-widest opacity-80">
            Foto da obra
          </p>
        </div>
        <span
          className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground shadow"
          style={{ backgroundColor: accent }}
        >
          {current.pct}%
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-0.5 font-mono text-[11px] text-white backdrop-blur">
          {current.date}
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-foreground">
        <strong>{current.pct}% — </strong>
        {current.caption}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {milestones.map((m, i) => {
          const isActive = i === active;
          return (
            <button
              key={m.pct}
              type="button"
              onClick={() => setActive(i)}
              className={`group relative aspect-video overflow-hidden rounded-md border-2 transition-all ${
                isActive
                  ? "border-primary shadow-[var(--shadow-soft)]"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
              style={{
                background: `linear-gradient(135deg, ${m.color}, color-mix(in oklab, ${m.color} 65%, #000))`,
              }}
              aria-label={`Ver foto da fase ${m.pct}%`}
            >
              <span className="absolute inset-0 grid place-items-center">
                <ImageIcon className="h-4 w-4 text-white/80" />
              </span>
              <span
                className="absolute bottom-1 left-1 rounded px-1.5 py-0 text-[10px] font-bold text-white"
                style={{ backgroundColor: `color-mix(in oklab, #000 50%, transparent)` }}
              >
                {m.pct}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ----------------- DOCUMENTS ARCHIVE -----------------

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
        <div
          key={yearGroup.year}
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]"
        >
          <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <h3 className="font-display text-lg font-semibold">{yearGroup.year}</h3>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {yearGroup.months.reduce((sum, m) => sum + m.docs.length, 0)} arquivos
            </span>
          </div>
          <Accordion
            type="multiple"
            defaultValue={yi === 0 ? [currentMonthKey] : []}
            className="px-2"
          >
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
                      <li
                        key={doc.title}
                        className="group flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-all hover:border-[color:var(--sage)]"
                      >
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{doc.title}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            PDF · {doc.size}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toast.info(`Baixando "${doc.title}"…`)}
                          aria-label={`Baixar ${doc.title}`}
                          className="shrink-0 rounded-full text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground"
                        >
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

// ----------------- PAYMENT HISTORY DIALOG (admin) -----------------

function PaymentHistoryDialog({
  unit,
  apartments,
  history,
  onClose,
  onChange,
}: {
  unit: string | null;
  apartments: Apartment[];
  history: FinancialStatus[] | null;
  onClose: () => void;
  onChange: (unit: string, monthIdx: number, status: FinancialStatus) => void;
}) {
  const apt = unit ? apartments.find((a) => a.unit === unit) : null;
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();

  return (
    <Dialog open={!!unit} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Histórico de pagamentos — Apto {apt?.unit}
          </DialogTitle>
          <DialogDescription>
            {apt?.resident} · Ano {currentYear}. Clique em qualquer mês para
            alterar o status retroativamente.
          </DialogDescription>
        </DialogHeader>

        {history && apt && (
          <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {history.map((status, i) => {
              const isFuture = i > currentMonthIdx;
              const isCurrent = i === currentMonthIdx;
              return (
                <div
                  key={i}
                  className={`rounded-xl border p-3 transition-all ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : isFuture
                      ? "border-dashed border-border bg-secondary/30"
                      : "border-border bg-card"
                  }`}
                >
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
                    <p className="mt-3 text-[11px] italic text-muted-foreground">
                      A faturar
                    </p>
                  ) : (
                    <Select
                      value={status}
                      onValueChange={(v) => onChange(apt.unit, i, v as FinancialStatus)}
                    >
                      <SelectTrigger
                        className={`mt-2 h-8 w-full border-0 px-2 text-[11px] font-bold uppercase tracking-wider ${STATUS_STYLES[status]}`}
                      >
                        <SelectValue />
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
        )}

        <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3 text-[11px] text-muted-foreground">
          <p className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--sage)]" /> Edição registrada
          </p>
          <p className="mt-1">
            Toda alteração retroativa fica registrada no log financeiro do
            condomínio para fins de auditoria.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
