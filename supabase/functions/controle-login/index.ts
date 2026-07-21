// Supabase Edge Function: controle-login
// Rate-limit de tentativas de login (proteção contra força bruta).
// Chamada em duas etapas pelo cliente:
//   1. action "verificar" — antes de signInWithPassword, pergunta se o
//      e-mail está bloqueado.
//   2. action "registrar" — depois do signInWithPassword, informa se deu
//      certo ou não, pra atualizar o contador.
// Nunca confirma/nega se o e-mail existe de verdade (evita enumeração de
// contas): resposta idêntica pra e-mail real ou inventado.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const MAX_FAILURES = 5;
const WINDOW_MINUTES = 15;
const LOCKOUT_MINUTES = 15;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeEmail(email: unknown) {
  return String(email ?? "").trim().toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { action, email, sucesso } = await req.json();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !["verificar", "registrar"].includes(action)) {
      return json({ error: "Parâmetros inválidos." }, 400);
    }
    if (action === "registrar" && typeof sucesso !== "boolean") {
      return json({ error: "Parâmetro 'sucesso' obrigatório." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (action === "registrar") {
      if (sucesso) {
        await admin.from("login_attempts").delete().eq("email", normalizedEmail);
        return json({ bloqueado: false });
      }
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
      const { error: insErr } = await admin
        .from("login_attempts")
        .insert({ email: normalizedEmail, success: false, ip });
      if (insErr) return json({ error: "Falha ao registrar tentativa." }, 500);
    }

    // Tanto "verificar" quanto "registrar" (depois de logar uma falha)
    // terminam calculando o estado atual de bloqueio pra esse e-mail.
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
    const { data: recentFailures, error: qErr } = await admin
      .from("login_attempts")
      .select("created_at")
      .eq("email", normalizedEmail)
      .eq("success", false)
      .gte("created_at", windowStart)
      .order("created_at", { ascending: false })
      .limit(MAX_FAILURES);

    if (qErr) return json({ error: "Falha ao verificar tentativas." }, 500);

    const count = recentFailures?.length ?? 0;
    if (count >= MAX_FAILURES) {
      const mostRecent = new Date(recentFailures![0].created_at);
      const lockedUntil = new Date(mostRecent.getTime() + LOCKOUT_MINUTES * 60_000);
      const now = new Date();
      if (now < lockedUntil) {
        const retryAfter = Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000);
        return json({ bloqueado: true, retry_after_segundos: retryAfter });
      }
    }

    return json({ bloqueado: false, tentativas_restantes: Math.max(0, MAX_FAILURES - count) });
  } catch (err) {
    return json({ error: (err as Error).message ?? "Erro inesperado." }, 500);
  }
});
