// Supabase Edge Function: excluir-pessoa
// Apaga o profile E o usuário correspondente no Auth. Antes, "Excluir"
// só apagava a linha em `profiles` (via delete direto do client, RLS
// profiles_delete) — o login em auth.users continuava existindo pra
// sempre, e o e-mail ficava travado: "A user with this email address
// has already been registered" ao tentar recadastrar a mesma pessoa.
//
// Mesma regra de autorização de profiles_delete (RLS não se aplica aqui
// porque a function usa a service role, então replicamos a regra à mão):
//   - alvo role='morador': quem chama precisa ser sindica/admin_agencia
//     OU ter a permissão granular 'excluir_morador'.
//   - alvo role='sindica': quem chama precisa ser admin_agencia.
//   - alvo role='admin_agencia': NUNCA pode ser apagada, por ninguém.
// Apaga o profile primeiro; só apaga o login depois se isso funcionar —
// se der erro no meio, o pior caso é ficar como hoje (login órfão), nunca
// pior (profile órfão sem login).
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

    const { profile_id } = await req.json();
    if (!profile_id) {
      return json({ error: "Campo profile_id ausente." }, 400);
    }

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

    const { data: callerProfile, error: callerErr } = await caller
      .from("profiles")
      .select("role, condominio_id")
      .eq("auth_user_id", authData.user.id)
      .maybeSingle();
    if (callerErr || !callerProfile) {
      return json({ error: "Sem permissão para esta operação." }, 403);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: alvo, error: alvoErr } = await admin
      .from("profiles")
      .select("id, auth_user_id, role, condominio_id")
      .eq("id", profile_id)
      .maybeSingle();
    if (alvoErr || !alvo) {
      return json({ error: "Pessoa não encontrada." }, 404);
    }

    if (alvo.condominio_id !== callerProfile.condominio_id) {
      return json({ error: "Sem permissão para esta operação." }, 403);
    }

    if (alvo.role === "admin_agencia") {
      return json({ error: "Administradora não pode ser excluída." }, 403);
    }

    let autorizado = false;
    if (alvo.role === "sindica") {
      autorizado = callerProfile.role === "admin_agencia";
    } else {
      // morador (inclui funcionário puro, unidade null) e o legado zelador
      if (["sindica", "admin_agencia"].includes(callerProfile.role)) {
        autorizado = true;
      } else {
        const { data: podeExcluir } = await caller.rpc("has_permissao", {
          p_permissao: "excluir_morador",
        });
        autorizado = podeExcluir === true;
      }
    }

    if (!autorizado) {
      return json({ error: "Sem permissão para esta operação." }, 403);
    }

    const { error: delProfileErr } = await admin
      .from("profiles")
      .delete()
      .eq("id", profile_id);
    if (delProfileErr) {
      return json({ error: delProfileErr.message }, 400);
    }

    if (alvo.auth_user_id) {
      const { error: delAuthErr } = await admin.auth.admin.deleteUser(alvo.auth_user_id);
      // Profile já foi apagado com sucesso — não falha a operação toda se
      // sobrar um login órfão (mesmo estado de antes desta function
      // existir). Só avisa no log pra investigar depois.
      if (delAuthErr) console.error("Falha ao apagar login:", delAuthErr.message);
    }

    return json({ success: true });
  } catch (err) {
    return json({ error: (err as Error).message ?? "Erro inesperado." }, 500);
  }
});
