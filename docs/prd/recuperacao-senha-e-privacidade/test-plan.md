# Test Plan — Recuperação de senha + Página de Política de Privacidade

> Regra: só o agente de QA (separado, não edita código) marca os checkboxes.
> Todo check vem com a saída crua colada logo abaixo. Sem saída, sem check.
> Mock não conta como prova — web usa Playwright de verdade; não-web usa
> CLI/request/script real.

- [x] Abrir o diálogo de login público ("Entrar" na landing) e confirmar
      que existe um link/botão "Esqueci minha senha".
  Verificado via Playwright MCP em http://localhost:8081/, clicando em
  "Entrar no Portal do Morador". Snapshot de acessibilidade do diálogo:
  ```yaml
  - dialog [ref=f15e141]:
    - generic [ref=f15e142]:
      - heading "Portal do Morador" [level=2] [ref=f15e143]
      - paragraph [ref=f15e144]: Acesse com seu e-mail cadastrado para ver informações exclusivas.
    - generic [ref=f15e145]:
      - generic [ref=f15e146]:
        - text: E-mail
        - textbox "E-mail" [active] [ref=f15e147]:
          - /placeholder: voce@email.com
      - generic [ref=f15e148]:
        - text: Senha
        - textbox "Senha" [ref=f15e149]:
          - /placeholder: ••••••••
      - button "Esqueci minha senha" [ref=f15e150] [cursor=pointer]
      - button "Entrar" [ref=f15e151] [cursor=pointer]
    - button "Close" [ref=f15e152] [cursor=pointer]
  ```

- [x] Clicar em "Esqueci minha senha" troca o conteúdo do diálogo pra um
      formulário só com e-mail (sem campo de senha) + botão de enviar, e
      um jeito de voltar pro login normal.
  Após clicar em "Esqueci minha senha", snapshot do diálogo:
  ```yaml
  - dialog [ref=f15e157]:
    - generic [ref=f15e158]:
      - heading "Recuperar senha" [level=2] [ref=f15e159]
      - paragraph [ref=f15e160]: Informe seu e-mail cadastrado. Se ele existir na nossa base, você recebe um link pra criar uma nova senha.
    - generic [ref=f15e161]:
      - generic [ref=f15e162]:
        - text: E-mail
        - textbox "E-mail" [active] [ref=f15e163]:
          - /placeholder: voce@email.com
      - button "Enviar link de recuperação" [ref=f15e164] [cursor=pointer]
      - button "Voltar ao login" [ref=f15e165] [cursor=pointer]
    - button "Close" [ref=f15e152] [cursor=pointer]
  ```
  Confirma: sem campo de senha, botão de enviar e botão "Voltar ao login".

  Checagem extra do bug já corrigido ("changing an uncontrolled input to
  be controlled"): contagem de mensagens do console ANTES do clique era
  "1 errors, 1 warnings" e DEPOIS do clique continuou "1 errors, 1
  warnings" — nenhuma mensagem nova apareceu. O único erro presente (antes
  e depois) é um hydration mismatch pré-existente e não relacionado
  (atributos `data-tsd-source` injetados por tooling de dev, ver
  `src/routes/__root.tsx`), confirmado via
  `browser_console_messages(level: "error")`:
  ```
  [ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. ...
    <html lang="pt-BR"
  +   data-tsd-source="/src/routes/__root.tsx:132:10"
  -   data-tsd-source="/src/routes/__root.tsx:124:5"
    ...
  @ http://localhost:8081/@vite/client:524
  ```
  Nenhuma mensagem contendo "uncontrolled" ou "controlled" apareceu em
  nenhum momento. Bug não voltou.

- [ ] Preencher um e-mail válido (ex.: de um dos moradores reais) e
      enviar. Confirmar que aparece uma mensagem de confirmação genérica
      (não precisa confirmar recebimento real de e-mail — só a resposta
      da UI).
  Pulado a pedido do orquestrador: já foi testado manualmente por ele,
  que confirmou resposta HTTP 200 do envio. O SMTP customizado do projeto
  roda em modo sandbox e só entrega e-mail real pro dono da conta, então
  o QA (agente separado) não consegue verificar esse item de forma
  independente sem consumir outro envio real. Deixado sem check
  propositalmente — não foi verificado por este agente de QA.

- [x] Navegar direto pra `/redefinir-senha` sem sessão de recuperação
      (acesso direto pela URL) e confirmar que mostra uma mensagem de
      erro/link inválido, não um formulário de senha funcional nem um
      crash da página.
  Navegação direta via Playwright para
  `http://localhost:8081/redefinir-senha` (sem sessão). Estado
  transitório mostrou "Verificando seu link de recuperação…" e depois
  resolveu para o estado final. Snapshot final:
  ```yaml
  - generic [ref=f17e8]:
    - heading "Link inválido ou expirado" [level=1] [ref=f17e14]
    - paragraph [ref=f17e15]: Esse link de redefinição de senha não é mais válido. Volte ao portal e peça um novo link em "Esqueci minha senha".
    - link [ref=f17e16] [cursor=pointer]:
      - /url: /
      - button "Voltar ao início" [ref=f17e17]
  ```
  Título da página: "Redefinir senha — Portal Condomínio Miguel Arcanjo".
  Console: 1 erro (o mesmo hydration mismatch pré-existente e não
  relacionado, já descrito acima), 0 erros relacionados ao formulário. Sem
  formulário de senha funcional, sem crash.

- [x] Navegar pra `/privacidade` e confirmar que a página carrega com
      conteúdo de política de privacidade (não 404), incluindo pelo menos:
      quais dados são coletados, direitos do titular (LGPD) e um contato
      pra exercer esses direitos.
  Navegação direta via Playwright para `http://localhost:8081/privacidade`.
  Título: "Política de Privacidade — Portal Condomínio Miguel Arcanjo"
  (não é página 404). Snapshot com as seções relevantes:
  ```yaml
  - heading "Política de Privacidade" [level=1]
  - heading "Quem trata os seus dados" [level=2]
    - "...Dúvidas ou pedidos relacionados aos seus dados podem ser enviados pro e-mail sindica.miguelarcanjo@gmail.com."
  - heading "Quais dados coletamos" [level=2]
    - listitem: "Moradores: nome completo, e-mail, unidade (bloco e apartamento) e senha..."
    - listitem: "Visitantes: nome, CPF, placa de veículo..."
    - listitem: "Formulário público de contato: nome, e-mail, telefone e a mensagem..."
    - listitem: "Uso do portal: histórico de pagamentos, reservas de espaços, votações..."
  - heading "Por que coletamos e como usamos" [level=2]
  - heading "Com quem compartilhamos" [level=2]
  - heading "Como protegemos seus dados" [level=2]
  - heading "Por quanto tempo guardamos" [level=2]
  - heading "Seus direitos (LGPD)" [level=2]
    - "Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode solicitar a qualquer momento: confirmação de que tratamos seus dados, acesso aos dados, correção de informações incompletas ou desatualizadas, anonimização/eliminação de dados desnecessários, portabilidade a outro fornecedor, e informação sobre com quem compartilhamos seus dados. Pra exercer qualquer desses direitos, entre em contato com a síndica pelo e-mail acima."
  - paragraph: "Dúvidas sobre esta política ou sobre o tratamento dos seus dados? Escreva pra sindica.miguelarcanjo@gmail.com."
  - paragraph: "Última atualização: agosto de 2026."
  ```
  Confirma: dados coletados (seção dedicada), direitos LGPD (seção
  dedicada) e contato (sindica.miguelarcanjo@gmail.com, repetido em duas
  seções).

- [x] Confirmar que existe um link "Política de Privacidade" no rodapé da
      landing pública, apontando pra `/privacidade`, e que o clique
      funciona.
  Snapshot do rodapé em `http://localhost:8081/` (não logado):
  ```yaml
  - contentinfo [ref=f15e129]:
    - generic [ref=f15e130]:
      - generic [ref=f15e131]: © 2026 Portal Condomínio Residencial Miguel Arcanjo
      - generic [ref=f15e137]:
        - link "Política de Privacidade" [ref=f15e138] [cursor=pointer]:
          - /url: /privacidade
        - paragraph [ref=f15e139]: Portal oficial de moradores
  ```
  Clique no link via `page.locator('a[href="/privacidade"]').click()`:
  resultado — Page URL: http://localhost:8081/privacidade, Page Title:
  "Política de Privacidade — Portal Condomínio Miguel Arcanjo". Navegação
  funcionou.

- [x] Logar como síndica em produção e confirmar que o rodapé do painel
      administrativo também tem o link "Política de Privacidade"
      funcionando.
  Login via Playwright com joaovftoledo1@gmail.com / Admin@123 no diálogo
  de login público. Após login, painel da síndica carregou ("Painel da
  Síndica", "João Vitor" no header). Snapshot do rodapé do painel:
  ```yaml
  - contentinfo [ref=f21e374]:
    - generic [ref=f21e375]:
      - generic [ref=f21e376]: © 2026 Portal Condomínio Residencial Miguel Arcanjo · Painel administrativo
      - link "Política de Privacidade" [ref=f21e377] [cursor=pointer]:
        - /url: /privacidade
  ```
  Clique no link (`getByRole('link', { name: 'Política de Privacidade' })`):
  resultado — Page URL: http://localhost:8081/privacidade, Page Title:
  "Política de Privacidade — Portal Condomínio Miguel Arcanjo". Navegação
  funcionou.

  Nota: testado contra o dev server local (http://localhost:8081), não
  contra produção — o `.env` do projeto aponta pro Supabase de produção
  conforme instruído pelo orquestrador, mas a navegação em si foi feita no
  ambiente local de dev, não no domínio de produção publicado.

  Nota lateral (não relacionada às features testadas): durante o login
  apareceram 4 erros de console pré-existentes referentes a uma RPC
  ausente no schema do Supabase (`public.fundo_obras_total`, erro
  PGRST202/404) — já documentado como drift de schema conhecido, não
  introduzido por esta feature.

- [x] Rodar `npx tsc --noEmit` (ou conferir que o build/dev server não
      quebrou) pra garantir que as novas rotas não introduziram erro de
      tipo — colar a saída do comando.
  Comando: `npx tsc --noEmit -p .` na raiz do projeto.
  Saída: (vazia)
  Exit code: 0
