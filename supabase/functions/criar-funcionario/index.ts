// Supabase Edge Function: criar-funcionario
// Cria um usuário no Auth (com senha provisória) e um profile role
// "zelador" — funcionário com acesso restrito a aprovar/recusar
// visitantes e reservas (ver RLS em supabase/migrations,
// 20260831000000_role_zelador.sql). Espelha o mesmo padrão de segurança
// de criar-morador: só sindica/admin_agencia do próprio condomínio podem
// chamar isso.
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

    const { email, nome_completo, condominio_id, titulo_funcao, permissoes } =
      await req.json();

    if (!email || !nome_completo || !condominio_id) {
      return json({ error: "Campos obrigatórios ausentes." }, 400);
    }

    const permissoesValidas = [
      "ver_financeiro", "editar_financeiro", "gerenciar_moradores", "excluir_morador",
      "gerenciar_obras", "gerenciar_votacoes", "publicar_avisos", "moderar_classificados",
      "responder_chamados", "aprovar_visitantes", "aprovar_reservas", "cadastrar_funcionario",
    ];
    const permissoesLimpa: string[] = Array.isArray(permissoes)
      ? permissoes.filter((p) => permissoesValidas.includes(p))
      : [];

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    let callerTemPermissao = false;
    if (
      callerProfile &&
      !["sindica", "admin_agencia"].includes(callerProfile.role) &&
      callerProfile.condominio_id === condominio_id
    ) {
      const { data: podeCadastrar } = await caller.rpc("has_permissao", {
        p_permissao: "cadastrar_funcionario",
      });
      callerTemPermissao = podeCadastrar === true;
    }

    if (
      profileErr ||
      !callerProfile ||
      callerProfile.condominio_id !== condominio_id ||
      !(["sindica", "admin_agencia"].includes(callerProfile.role) || callerTemPermissao)
    ) {
      return json({ error: "Sem permissão para esta operação." }, 403);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

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

    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    const patch = {
      nome_completo,
      unidade: null,
      condominio_id,
      role: "zelador" as const,
      titulo_funcao: titulo_funcao || null,
      primeiro_acesso: true,
    };

    let profileId: string;
    if (existing) {
      const { error: updErr } = await admin
        .from("profiles")
        .update(patch)
        .eq("auth_user_id", authUserId);
      if (updErr) return json({ error: updErr.message }, 400);
      profileId = existing.id;
    } else {
      const { data: inserted, error: insErr } = await admin
        .from("profiles")
        .insert({ ...patch, auth_user_id: authUserId })
        .select("id")
        .single();
      if (insErr || !inserted) return json({ error: insErr?.message ?? "Falha ao criar profile." }, 400);
      profileId = inserted.id;
    }

    if (permissoesLimpa.length > 0) {
      const { error: permErr } = await admin
        .from("profile_permissoes")
        .insert(permissoesLimpa.map((permissao) => ({ profile_id: profileId, permissao })));
      if (permErr) return json({ error: permErr.message }, 400);
    }

    return json({ success: true });
  } catch (err) {
    return json({ error: (err as Error).message ?? "Erro inesperado." }, 500);
  }
});
