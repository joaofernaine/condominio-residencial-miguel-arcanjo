import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, Lock, ShieldCheck, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { markFirstAccessComplete } from "@/lib/portal-data";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [{ title: "Redefinir senha — Portal Condomínio Miguel Arcanjo" }],
  }),
  component: RedefinirSenhaPage,
});

type Status = "checking" | "ready" | "invalid" | "done";

function RedefinirSenhaPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("checking");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let settled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        settled = true;
        setStatus("ready");
      }
    });

    // Se a sessão de recuperação já tiver sido processada antes deste efeito
    // rodar (a URL é lida na inicialização do cliente Supabase), o evento
    // PASSWORD_RECOVERY pode nunca disparar aqui — confirma via getSession.
    supabase.auth.getSession().then(({ data }) => {
      if (settled) return;
      if (data.session) {
        settled = true;
        setStatus("ready");
      }
    });

    const timeout = setTimeout(() => {
      if (!settled) setStatus("invalid");
    }, 4000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

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
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;

      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (uid) {
        try {
          await markFirstAccessComplete(uid);
        } catch (err) {
          console.error(err);
        }
      }

      toast.success("Senha redefinida com sucesso!");
      setStatus("done");
      setTimeout(() => navigate({ to: "/" }), 1500);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Erro ao redefinir senha.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-secondary/30 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
        {status === "checking" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Verificando seu link de recuperação…</p>
          </div>
        )}

        {status === "invalid" && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="h-6 w-6" />
            </div>
            <h1 className="font-display text-xl font-semibold">Link inválido ou expirado</h1>
            <p className="text-sm text-muted-foreground">
              Esse link de redefinição de senha não é mais válido. Volte ao portal e peça um
              novo link em "Esqueci minha senha".
            </p>
            <Link to="/" className="mt-2">
              <Button variant="outline" className="rounded-full">Voltar ao início</Button>
            </Link>
          </div>
        )}

        {status === "done" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--sage)]/15 text-[color:var(--sage)]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="font-display text-xl font-semibold">Senha redefinida!</h1>
            <p className="text-sm text-muted-foreground">Redirecionando pro portal…</p>
          </div>
        )}

        {status === "ready" && (
          <>
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-semibold">Criar nova senha</h1>
                <p className="text-sm text-muted-foreground">Escolha uma nova senha de acesso ao portal.</p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div>
                <Label htmlFor="rs-pw" className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Nova senha
                </Label>
                <PasswordInput
                  id="rs-pw"
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
                <Label htmlFor="rs-pw2" className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Confirmar nova senha
                </Label>
                <PasswordInput
                  id="rs-pw2"
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

              <Button type="submit" size="lg" disabled={submitting} className="w-full rounded-full">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Salvar nova senha
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
