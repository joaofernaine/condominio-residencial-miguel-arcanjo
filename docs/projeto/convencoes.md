# Convenções de código

## Nomenclatura de arquivos

- `src/components/*.tsx`: kebab-case, sufixo semântico de domínio+papel:
  `chamados-admin-section.tsx` / `chamados-resident-section.tsx`,
  `classificados-admin-section.tsx` / `classificados-resident-section.tsx`,
  `visitantes-admin-section.tsx` / `visitantes-resident-section.tsx`.
- `src/components/ui/*`: kebab-case padrão shadcn, sem customização de nome.
- `src/hooks/*`: prefixo `use-` (`use-portal-auth.ts`, `use-mobile.tsx`).
- `src/lib/*`: kebab-case; módulos de dados terminam em `-data.ts`
  (`portal-data.ts`, `classificados-data.ts`).
- `src/routes/*`: convenção de ponto do TanStack Router
  (`admin.classificados.pendentes.tsx` → `/admin/classificados/pendentes`).

## Componentes React

- **Só named export.** Nenhum `export default` em `src/`.
- Props tipadas **inline** no destructuring
  (`export function X({ condominioId }: { condominioId: string })`), sem
  `interface Props` separada (exceção: componentes internos pequenos, ex.
  `classificados-shell.tsx`).
- Hooks "crus" do React (`useState`/`useEffect`/`useCallback`/`useMemo`).
  Padrão recorrente: `loading`/`busy` + `reload` via `useCallback` chamado em
  `useEffect` + `try/catch` com `console.error` + `toast.error` (sonner).
- **react-hook-form e zod estão instalados mas NÃO são usados no domínio.**
  Formulários usam `useState` por campo + validação manual (`canSubmit` via
  `useMemo`). Não introduzir rhf/zod em componente novo sem alinhar antes —
  seria inconsistente com o resto do código.
- Consumo de dados é **direto**: componente chama função de `lib/*-data.ts`
  ou `supabase.from(...)` — não existe camada de hooks tipo `useClassificados()`,
  exceto autenticação (`usePortalAuth()`).
- Componente `*-resident-section.tsx` costuma exportar os tipos/constantes de
  domínio (status, labels, classes CSS) que o `*-admin-section.tsx`
  correspondente importa.

## Estilo / lint

- Prettier: aspas duplas, `;` obrigatório, `printWidth: 100`,
  `trailingComma: "all"`.
- ESLint: `@typescript-eslint/no-unused-vars` **desligado** (coerente com
  `noUnusedLocals/Parameters: false` no `tsconfig.json`). `no-restricted-imports`
  bloqueia `server-only` (usar convenção `*.server.ts` do TanStack Start).
- **CRLF**: o repositório está em CRLF, mas Prettier exige LF → lint/format
  falham em massa por isso hoje. Ver `docs/projeto/ambiente.md`. **Não é
  sinal de bug real**, é ruído de line ending.
- Alias `@/` (`tsconfig.json` → `./src/*`) usado em todo import não-relativo.
  Import relativo só entre arquivos irmãos.

## Estilização

- Tailwind v4, quase 100% classes utilitárias inline no JSX.
- `cn()` = `twMerge(clsx(...))` em `src/lib/utils.ts`.
- Tema custom "Miguel Arcanjo" via `@theme inline` em `src/styles.css`
  (paleta cobalt/marble/wood/turquoise sobre os tokens shadcn).
- `class-variance-authority` só é usado em `src/components/ui/*` (não em
  componentes de domínio).

## Admin vs residente

- Rotas: prefixo `admin.` no arquivo.
- Componentes: sufixo `-admin-section.tsx` vs `-resident-section.tsx`.
- Controle de acesso é reforçado em runtime na própria rota (ex.
  `profile.role !== "sindica"` em `src/routes/admin.classificados.index.tsx:118`),
  não só por convenção de nome — nunca confiar só no nome do arquivo/rota
  como controle de acesso.
