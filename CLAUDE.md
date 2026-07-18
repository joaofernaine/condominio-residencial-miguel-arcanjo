# CLAUDE.md

Portal do Condomínio Residencial Miguel Arcanjo — TanStack Start + React 19 +
Supabase, single-tenant (só este condomínio; outros condomínios/nichos serão
projetos separados forkados deste). Status: dev/pré-lançamento.

## Docs

- [`docs/projeto/arquitetura.md`](docs/projeto/arquitetura.md) — o que é, pra
  quem, camadas, decisões e porquês.
- [`docs/projeto/convencoes.md`](docs/projeto/convencoes.md) — padrões de
  código.
- [`docs/projeto/ambiente.md`](docs/projeto/ambiente.md) — comandos testados
  (install/dev/build/lint) e seus pré-requisitos/falhas conhecidas.
- `docs/prd/<tarefa>/requirements.md` e `test-plan.md` — por tarefa (template
  em `docs/prd/_template/`).
- `docs/aprendizados/` — escrito ao fechar sessão.

## Regras

1. **Requisitos primeiro.** Toda funcionalidade nova ou bug fix começa por
   `docs/prd/<tarefa>/requirements.md` (copiar do template). Pergunte o que
   faltar antes de escrever código. Quebre cada item num checkbox.

2. **Test Plan junto.** Sempre acompanhado de
   `docs/prd/<tarefa>/test-plan.md` (copiar do template), item a item, com
   checkbox espelhando os requisitos.

3. **QA separado marca o check.** Ao terminar CADA item, suba um agente de QA
   (subagent que **não edita código**) para rodar o Test Plan. O
   implementador **nunca** marca check. Todo check vem com a **saída crua
   colada embaixo**. Sem saída, sem check.

4. **QA testa de verdade.** Se for web, usa Playwright (abrir, clicar,
   conferir de fato). Se não for web, roda como der: CLI, request, script.
   **Mock não conta como prova.** Se faltar o plugin do Playwright, passe o
   comando ao usuário, avise que a sessão precisa reiniciar, e continue
   depois. QA nunca escreve no Supabase de produção — usa o Supabase de QA
   dedicado.

5. **"Fecha a sessão"** → escreva os aprendizados em `docs/aprendizados/` e
   **mostre antes de salvar**.

## Notas rápidas que valem a pena lembrar

- Lint/format estão quebrados hoje por CRLF vs LF (~13.988 erros de quebra de
  linha) — não é gate de QA. Ver `docs/projeto/ambiente.md`.
- `routeTree.gen.ts` é gerado — nunca editar manualmente.
- Não existe camada de testes automatizados nem CI hoje.
