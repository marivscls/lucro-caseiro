# PRD — Teste geral da aplicação (cobertura + gate completo)

Status: em implementação · Escopo: monorepo (API + mobile + packages)

## Objetivo

Fazer uma varredura de qualidade "geral" do app: (1) confirmar que toda a suíte
e o gate completo passam, (2) mapear a cobertura atual de testes, (3) preencher
as lacunas de lógica pura sem teste — com prioridade para o que mexemos
recentemente (preferências de notificação e selos de estoque).

Princípios (alinhados ao CLAUDE.md):

- AAA (Arrange / Act / Assert), fixtures claros, SUT factory.
- Funções puras de domínio não precisam de mocks.
- Não remover testes sem equivalente.
- Tudo precisa passar no `pnpm prepush` (lint + typecheck + test + sherif + knip + context:lint).

## Baseline (antes desta rodada)

- `pnpm test` em verde (exit 0). Mobile: 32 arquivos / 199 testes.
- Cobertura já ampla:
  - **API**: todas as features têm `*.domain.test.ts` + `*.usecases.test.ts`
    (clients, products, sales, finance, pricing, recipes, materials, orders,
    quotes, catalog, labels, insights, packaging, goals, subscription, payments,
    account).
  - **Mobile (lógica pura já coberta)**: sales (`fiado`, `cart`, `payment`,
    `receipt`, `receipt-pdf`), pricing/quotes/finance (`calc`), orders
    (`domain`, `reminders`), products (`kit`), materials (`domain`, `icons`),
    packaging/insights/goals (`domain`), labels (`nutrition`, `qr`),
    ingredient-image (`resolve`), utils (`phone`, `format`, `date`, `whatsapp`),
    hooks (`notification-prefs`, `notification-types`, `use-show-ads`,
    `use-interstitial`, `use-offline-queue`, `use-image-picker`, `ad-banner`),
    clients (`use-birthday-notifier` → `isBirthdayToday`).

## Lacunas identificadas (lógica pura sem teste)

| Módulo                                             | Funções                                                                    | Por quê importa                                                                                                                      |
| -------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `shared/utils/validation.ts`                       | `validateEmail`, `validatePassword`, `validateName`, `getPasswordStrength` | Usado no login/cadastro; regras de senha/e-mail sem teste.                                                                           |
| `shared/utils/currency-input.ts`                   | `maskCurrencyInput`, `parseCurrencyInput`, `currencyInput`                 | Máscara de dinheiro usada em vários formulários (preço, fiado, etc.).                                                                |
| Selo de estoque (em `components/product-card.tsx`) | `getStockBadge`                                                            | Lógica recém-alterada: selos de alerta passam a respeitar a preferência "Estoque baixo". Estava inline no componente (não testável). |

Observações:

- Os notificadores são hooks com efeito colateral; o padrão do projeto é testar
  o **helper puro** (ex.: `isPrefEnabled`, `isBirthdayToday`), não o hook. Mantido.
- API já tem cobertura completa de domínio/usecases — sem lacuna relevante.

## Plano de implementação

1. Extrair `getStockBadge` para módulo puro `features/products/stock-badge.ts`
   (sem imports de React Native), e o componente passa a importá-lo.
2. `shared/utils/validation.test.ts` — caminhos válido/ inválido de cada regra +
   níveis de força de senha.
3. `shared/utils/currency-input.test.ts` — máscara, parse e ida-e-volta
   (incluindo separador de milhar e vazio).
4. `features/products/stock-badge.test.ts` — kg/kit/sem controle → sem selo;
   alertas (sem estoque / baixo) só com preferência ligada; contagem neutra
   sempre.
5. Rodar `pnpm test` até verde; depois `git push` (gate completo).

## Changelog (implementado)

- Baseline confirmado: `pnpm test` em verde antes da rodada.
- `features/products/stock-badge.ts`: extraída a lógica `getStockBadge` (pura,
  sem imports de React Native) de `components/product-card.tsx`; o componente
  passou a importá-la.
- `features/products/stock-badge.test.ts`: 9 testes — sem selo (kg/kit/sem
  controle), contagem neutra sempre visível, alertas ("Sem estoque" /
  "Estoque baixo") só com a preferência ligada, limite-igual conta como baixo.
- `shared/utils/validation.test.ts`: 13 testes — e-mail, senha (acumulação de
  erros), nome e níveis de força de senha.
- `shared/utils/currency-input.test.ts`: 9 testes — máscara (centavos, milhar,
  limpeza de não-dígitos, limite de 10 dígitos, vazio), parse e ida-e-volta.
- Resultado: +31 testes; suíte mobile e gate completo (`prepush`) em verde.
