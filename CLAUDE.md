# CLAUDE.md — Lucro Caseiro (AI-Oriented Dev Guide)

## Regras de Trabalho (AI-Oriented)

- **Sempre** leia antes de trabalhar:
  1. este `CLAUDE.md` inteiro
  2. `ai.context.api.md` ou `ai.context.mobile.md` da feature que voce vai alterar

- **Sempre** atualize o `ai.context.*.md` correspondente quando mudar qualquer um destes:
  - invariantes de dominio
  - contratos (DTO/Zod), endpoints, status codes
  - fluxos (vendas/financeiro/receitas/etc.)
  - schema do banco/indices/RLS
  - regras de autorizacao
  - limites freemium

- Ao criar uma feature nova:
  - crie **obrigatoriamente** `ai.context.api.md` (API) ou `ai.context.mobile.md` (mobile) usando o template padrao
  - rode `pnpm context:lint` antes de finalizar

- **Nao invente comportamento**:
  - se nao esta definido em ADR ou `ai.context.*.md`, atualize a spec antes de implementar.

- **Commite de acordo com o que foi definido na secao Commits desse documento**

## Sobre o Projeto

**Lucro Caseiro** e um app de gestao completa para negocios caseiros (confeitaria, manicure, artesanato, marmitas, etc).

- **Publico**: pessoas de todas as idades, incluindo idosos e jovens sem experiencia tech
- **Principio #1 de UX**: simplicidade radical — maximo 3 toques pra qualquer acao principal
- **Plataformas**: iOS, Android e Web (codebase unica via Expo Router)
- **Monetizacao**: Freemium (limites) + Premium (assinatura)

### Limites Freemium

| Recurso    | Free          | Premium             |
| ---------- | ------------- | ------------------- |
| Vendas/mes | 30            | Ilimitado           |
| Clientes   | 20            | Ilimitado           |
| Receitas   | 5             | Ilimitado           |
| Embalagens | 3             | Ilimitado           |
| Rotulos    | 1 template    | Ilimitado           |
| Relatorios | Basico mensal | Completo + graficos |
| Exportacao | Nao           | PDF/Excel           |

## Arquitetura (Boundaries)

- Cada feature e um **vertical slice** em `features/<feature>/`.
- Arquivos por feature ficam juntos e seguem naming:

### API (`apps/api/src/features/<feature>/`)

- `*.routes.ts`, `*.usecases.ts`, `*.repo.pg.ts`
- `*.domain.ts`, `*.types.ts`, `*.test.ts`
- `ai.context.api.md`

### Mobile (`apps/mobile/src/features/<feature>/`)

- `api.ts`, `hooks.ts`, `types.ts`, `domain.ts`
- `components/*.tsx`
- `ai.context.mobile.md`

### Regras de dependencia (inviolaveis)

- **Dominio e puro:** `*.domain.ts` **nao** importa infra, controller ou UI.
- **Routes nao fala com DB:** `*.routes.ts` chama `*.usecases.ts`, nunca `*.repo.pg.ts` direto.
- **Repo nao contem regra de negocio:** `*.repo.pg.ts` so persiste/busca dados.
- **UI nao decide governanca:** mobile apenas projeta o que o back retorna (status, policies, limites).
- Cross-feature: importar apenas **contratos publicos** (`@lucro-caseiro/contracts`), nunca arquivos internos de outra feature.

### Design System / UI Components

- **Centralizacao:** Todos os componentes genericos ficam no package `@lucro-caseiro/ui` (em `packages/ui`).
- Antes de criar um componente no mobile, **sempre** verifique se ja existe em `@lucro-caseiro/ui`.
- Componentes devem seguir os principios de acessibilidade:
  - Fontes minimas 16px, botoes minimo 48x48dp
  - Icones sempre com texto
  - Contraste minimo 4.5:1 (WCAG AA)
  - Linguagem simples, sem jargoes

## Testes

- Ao modificar uma feature: **atualize os testes existentes**.
- Ao criar feature: adicione no minimo:
  - `<feature>.domain.test.ts` (invariantes e regras puras)
  - `<feature>.usecases.test.ts` (fluxos, mocks via interfaces)

### Padroes

- AAA (Arrange / Act / Assert)
- SUT factory
- fixtures claros
- mocks apenas via interfaces (`IXxxRepo`)
- funcoes puras de dominio nao precisam de mocks

- Nunca remova testes sem substituir por equivalentes.

## Quality Gates (Hooks + CI)

### Git hooks (husky)

- **commit-msg**: `commitlint` — rejeita mensagens fora do Conventional Commits
- **pre-commit**: `lint-staged` (prettier + eslint --fix) + `pnpm sherif`
- **pre-push**: `pnpm prepush`
  - `lint + typecheck + test + sherif + knip + context:lint`

### CI

- Executa gates completos (inclui `knip:full` e build).

**Nunca** use `--no-verify` para pular hooks.

## Scripts uteis

- `pnpm dev` — inicia API + mobile em paralelo
- `pnpm prepush` — gate local completo
- `pnpm ci` — gate completo + build
- `pnpm context:lint` — valida specs dos `ai.context.*.md`
- `pnpm context:lint:api` — valida apenas API contexts
- `pnpm context:lint:mobile` — valida apenas mobile contexts
- `pnpm context:lint:changed` — valida apenas features tocadas no diff
- `pnpm context:lint:staged` — valida apenas features staged
- `pnpm check` — lint + typecheck + build
- `pnpm test` — todos os testes

## Commits

- Use **Conventional Commits** (validado por commitlint).
- Faca **micro commits**: 1 mudanca logica por commit.
- Nao inclua co-author lines.

Formato: `tipo(escopo opcional): descricao curta`

Tipos: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`, `perf`, `ci`, `build`

Exemplos:

- `feat(sales): add quick sale registration flow`
- `fix(pricing): handle zero ingredients cost`
- `refactor(api): extract auth middleware`
- `chore: configure commitlint and husky hooks`

## Regras de Consistencia e Seguranca

- **User-scoped:** toda query deve ser escopada por `userId`. Nunca crie query "global".
- **Indices:** para keys por user, use indices compostos (ex.: `(user_id, key)`).
- **RLS:** alteracoes de RLS/policies devem estar em migrations versionadas.
- **Limites freemium:** enforcement deve ser feito no backend (nunca confie no front).
- **Dados sensiveis:** dados de clientes e financeiros sao prioridade de seguranca.

## Linguagem do App

- O app e em **portugues brasileiro** para os usuarios
- Codigo e em **ingles** (nomes de variaveis, funcoes, arquivos)
- Mensagens de erro e labels de UI sao em **portugues**
- Exemplos: "Voce atingiu o limite de vendas do plano gratuito" (nao "Free plan sales limit reached")
