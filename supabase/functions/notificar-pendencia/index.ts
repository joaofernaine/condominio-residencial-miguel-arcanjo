// Supabase Edge Function: notificar-pendencia
// Chamada por um trigger no banco (visitantes/reservas, ver migration
// 20260902030000_trigger_notificar_pendencia.sql) toda vez que entra um
// registro com status='pendente'. Manda um e-mail (via Resend) pra quem
// pode aprovar aquele tipo de pedido e está com o alerta ligado
// (profiles.receber_alertas_pendencia).
//
// Não usa verify_jwt (quem chama é o Postgres via pg_net, não um usuário
// logado) — em vez disso, exige o header x-internal-secret batendo com
// o segredo INTERNAL_WEBHOOK_SECRET, pra ninguém de fora conseguir
// disparar e-mail em massa só descobrindo a URL da function.
//
// Precisa de duas secrets configuradas no projeto (Dashboard > Edge
// Functions > Manage secrets), em QA e produção:
//   INTERNAL_WEBHOOK_SECRET  — o mesmo valor usado no trigger SQL
//   RESEND_API_KEY           — API key do Resend (re_...)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type ProfilePermissao = { permissao: string };
type PerfilComPermissoes = {
  id: string;
  auth_user_id: string;
  nome_completo: string;
  role: string;
  profile_permissoes: ProfilePermissao[] | null;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const segredoEsperado = Deno.env.get("INTERNAL_WEBHOOK_SECRET");
  const segredoRecebido = req.headers.get("x-internal-secret");
  if (!segredoEsperado || segredoRecebido !== segredoEsperado) {
    return new Response(JSON.stringify({ error: "Não autorizado." }), { status: 401 });
  }

  try {
    const { tipo, registro_id, condominio_id } = await req.json();
    if (!tipo || !registro_id || !condominio_id) {
      return new Response(JSON.stringify({ error: "Campos ausentes." }), { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const permissaoNecessaria = tipo === "visitante" ? "aprovar_visitantes" : "aprovar_reservas";

    const { data: perfis, error: perfisErr } = await admin
      .from("profiles")
      .select("id, auth_user_id, nome_completo, role, profile_permissoes(permissao)")
      .eq("condominio_id", condominio_id)
      .eq("receber_alertas_pendencia", true);
    if (perfisErr) throw perfisErr;

    const destinatarios = ((perfis ?? []) as PerfilComPermissoes[]).filter((p) => {
      if (p.role === "sindica" || p.role === "admin_agencia") return true;
      const perms = (p.profile_permissoes ?? []).map((pp) => pp.permissao);
      return perms.includes(permissaoNecessaria);
    });

    if (destinatarios.length === 0) {
      return new Response(JSON.stringify({ ok: true, enviados: 0 }), { status: 200 });
    }

    let assunto = "";
    let detalhe = "";
    if (tipo === "visitante") {
      const { data: v } = await admin
        .from("visitantes")
        .select("nome_visitante, data_entrada, data_saida")
        .eq("id", registro_id)
        .maybeSingle();
      assunto = "Novo visitante aguardando aprovação";
      detalhe = v ? `Visitante: ${v.nome_visitante}\nPeríodo: ${v.data_entrada} até ${v.data_saida}` : "";
    } else {
      const { data: r } = await admin
        .from("reservas")
        .select("espaco, data_inicio, data_fim")
        .eq("id", registro_id)
        .maybeSingle();
      assunto = "Nova reserva aguardando aprovação";
      detalhe = r ? `Espaço: ${r.espaco}\nData: ${r.data_inicio} até ${r.data_fim}` : "";
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const remetente = Deno.env.get("RESEND_FROM") ?? "Portal Condomínio <alertas@example.com>";
    if (!resendKey) {
      console.error("RESEND_API_KEY não configurada — e-mails não enviados.");
      return new Response(JSON.stringify({ ok: false, error: "RESEND_API_KEY ausente" }), { status: 200 });
    }

    const resultados = await Promise.allSettled(
      destinatarios.map(async (p) => {
        const { data: userData, error: userErr } = await admin.auth.admin.getUserById(p.auth_user_id);
        const email = userData?.user?.email;
        if (userErr || !email) return;

        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: remetente,
            to: email,
            subject: assunto,
            text: `Olá, ${p.nome_completo}!\n\n${detalhe}\n\nAcesse o portal do condomínio para aprovar ou recusar.`,
          }),
        });
        if (!resp.ok) {
          console.error(`Falha ao enviar pra ${email}:`, await resp.text());
        }
      }),
    );

    const falhas = resultados.filter((r) => r.status === "rejected").length;
    return new Response(JSON.stringify({ ok: true, enviados: destinatarios.length, falhas }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message ?? "Erro inesperado." }), { status: 500 });
  }
});
