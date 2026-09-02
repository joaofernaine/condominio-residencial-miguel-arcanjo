# Requirements — Recuperação de senha ("esqueci minha senha") + Página de Política de Privacidade

## Contexto
Levantamento de prontidão pra lançamento (domínio sendo comprado) apontou
duas lacunas: (1) não existe nenhum jeito de um morador recuperar a senha
sozinho se esquecer (só tem o fluxo de primeiro acesso, que assume que a
pessoa ainda lembra a senha provisória); (2) o site coleta dados pessoais
reais (CPF de visitantes, nome/e-mail/telefone no formulário público, dados
de moradores) sem nenhuma política de privacidade formal, só um aviso
pontual no diálogo de troca de senha obrigatória.

## Perguntas em aberto
Nenhuma pergunta foi levantada ao usuário — decisões de baixo risco tomadas
e documentadas aqui:
- Fluxo de recuperação usa o mecanismo nativo do Supabase Auth
  (`resetPasswordForEmail` + `updateUser`), consistente com o resto do app
  (que já usa Supabase Auth diretamente, sem backend próprio).
- Mensagem de confirmação do "enviar link" é sempre genérica (não revela se
  o e-mail existe ou não na base) — prática padrão de segurança contra
  enumeração de usuários.
- **Limitação conhecida e aceita**: o Supabase free tier tem limite de 2
  e-mails/hora no SMTP embutido. Isso significa que, em uso real com 44+
  moradores, se mais de 2 pedirem recuperação na mesma hora, os demais não
  recebem e-mail (sem erro visível pro usuário, já que a mensagem é
  genérica por design). Não é bug desta tarefa — é a mesma limitação de
  infra já registrada em memória (ver [[qa-supabase-drift-de-producao]] /
  decisão de migrar pra infra própria no futuro). Fora de escopo resolver
  aqui (exigiria SMTP customizado).
- Política de privacidade é conteúdo estático (não editável pela síndica
  via UI) — igual a qualquer página institucional, não um dado do banco.
- Link de "Esqueci minha senha" fica dentro do próprio diálogo de login
  (troca pra um modo "recuperar" no mesmo diálogo, sem abrir diálogo novo).

## Requisitos

### Recuperação de senha
- [ ] No diálogo de login ("Portal do Morador"), existe um link/botão
      "Esqueci minha senha".
- [ ] Clicar nele troca o conteúdo do diálogo pra um formulário só com
      e-mail + botão "Enviar link de recuperação", e um link "Voltar ao
      login".
- [ ] Ao enviar, chama `supabase.auth.resetPasswordForEmail` com
      `redirectTo` apontando pra uma nova rota `/redefinir-senha` no mesmo
      domínio, e mostra mensagem de confirmação genérica (não revela se o
      e-mail existe).
- [ ] Nova rota pública `/redefinir-senha`: ao chegar via link do e-mail
      (sessão de recuperação válida), mostra formulário de nova senha +
      confirmação, com a mesma validação de força de senha já usada no
      "Primeiro acesso" (mínimo 8 caracteres, indicador de força).
- [ ] Ao salvar com sucesso: atualiza a senha via `supabase.auth.updateUser`,
      marca `primeiro_acesso` como concluído (evita pedir troca de senha
      de novo logo em seguida), mostra toast de sucesso e redireciona pro
      painel (usuário já fica logado, sem precisar logar de novo).
- [ ] Se a pessoa chegar em `/redefinir-senha` sem uma sessão de
      recuperação válida (link expirado/inválido/acesso direto), mostra
      mensagem de erro clara com link pra voltar e pedir um novo link.

### Página de Política de Privacidade
- [ ] Nova rota pública `/privacidade` com o texto da política, cobrindo:
      quem coleta os dados (síndica/condomínio), quais dados são
      coletados (moradores, visitantes/CPF, formulário de contato
      público), finalidade de cada coleta, com quem é compartilhado (em
      princípio ninguém, exceto obrigação legal), como é armazenado
      (Supabase, senha nunca em texto puro), direitos do titular conforme
      LGPD art. 18 (acesso, correção, exclusão, portabilidade) e como
      exercê-los (contato da síndica), e data da última atualização.
- [ ] Link "Política de Privacidade" adicionado nos rodapés das três
      views (landing pública, painel do morador, painel da síndica),
      apontando pra `/privacidade`.
- [ ] Página segue a identidade visual existente do site (mesmas fontes,
      cores, componentes de card/prose já usados nas outras páginas).

## Fora de escopo
- SMTP customizado / aumento do limite de e-mails (seria pra resolver a
  limitação do free tier — fica pra quando migrar de infra).
- Editor de conteúdo da política de privacidade pela síndica via UI
  (conteúdo é estático no código, igual outras páginas institucionais).
- Termos de uso (Termos de Serviço) — não foi pedido, só política de
  privacidade.
- Revisão jurídica formal do texto da política — é um rascunho razoável
  cobrindo os pontos padrão de LGPD, não substitui parecer de advogado.
