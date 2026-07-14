// Supabase Edge Function: criar-morador
// Cria um usuário no Auth (com senha provisória) e atualiza o profile
// correspondente com nome, unidade (bloco-apartamento) e condomínio.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Não autenticado." }, 401);
    }

    const { email, nome_completo, bloco, apartamento, condominio_id } =
      await req.json();

    if (!email || !nome_completo || !bloco || !apartamento || !condominio_id) {
      return json({ error: "Campos obrigatórios ausentes." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Cliente com o token do chamador: respeita RLS, então só enxerga o
    // próprio profile (profiles_select_proprio).
    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: authErr } = await caller.auth.getUser();
    if (authErr || !authData?.user) {
      return json({ error: "Não autenticado." }, 401);
    }

    const { data: callerProfile, error: profileErr } = await caller
      .from("profiles")
      .select("role, condominio_id")
      .eq("auth_user_id", authData.user.id)
      .maybeSingle();

    if (
      profileErr ||
      !callerProfile ||
      !["sindica", "admin_agencia"].includes(callerProfile.role) ||
      callerProfile.condominio_id !== condominio_id
    ) {
      return json({ error: "Sem permissão para esta operação." }, 403);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const unidade = `${bloco}-${apartamento}`;

    // 1. Cria usuário no Auth
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password: "Mudar@123",
        email_confirm: true,
      });
    if (createErr || !created?.user) {
      return json(
        { error: createErr?.message ?? "Falha ao criar usuário." },
        400,
      );
    }

    const authUserId = created.user.id;

    // 2. Atualiza o profile criado pelo trigger (ou faz upsert se não existir)
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    const patch = {
      nome_completo,
      unidade,
      condominio_id,
      role: "morador" as const,
      primeiro_acesso: true,
    };

    if (existing) {
      const { error: updErr } = await admin
        .from("profiles")
        .update(patch)
        .eq("auth_user_id", authUserId);
      if (updErr) return json({ error: updErr.message }, 400);
    } else {
      const { error: insErr } = await admin
        .from("profiles")
        .insert({ ...patch, auth_user_id: authUserId });
      if (insErr) return json({ error: insErr.message }, 400);
    }

    return json({ success: true });
  } catch (err) {
    return json({ error: (err as Error).message ?? "Erro inesperado." }, 500);
  }
});
