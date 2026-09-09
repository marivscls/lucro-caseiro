# Lote 3 — Paywall e monetização

## Onde Warp parou

Nenhum item deste lote estava implementado no estado inicial recebido. O Paywall declarava title/message/currentUsage, mas exibia título e descrição fixos; havia duas listas locais de benefícios divergentes da fonte central. SubscriptionCheckout não propagava o recurso de origem. LimitBanner ainda usava #FFF9F1 e shadow="sm". Planos não tinha skeleton; o Profissional usava fundo dourado e o Essencial borda da cor da superfície.

## Alterações desde o estado inicial (somente estes arquivos)

1. apps/mobile/src/features/subscription/components/paywall.tsx
2. apps/mobile/src/features/subscription/components/subscription-checkout.tsx
3. apps/mobile/src/features/subscription/components/limit-banner.tsx
4. apps/mobile/src/app/plans.tsx
5. apps/mobile/src/features/subscription/ai.context.mobile.md
6. apps/mobile/src/features/subscription/components/paywall.test.ts (novo)
7. apps/mobile/src/features/subscription/plans.test.ts (novo)

plan-benefits.ts e limit-copy.ts já eram fontes corretas e foram reutilizados sem alteração. Nenhum arquivo compartilhado do tema foi editado. Demais alterações git no worktree pertencem ao estado inicial do usuário.

## Implementação

- Checkout lê resource de usePaywall, deriva copy com getPaywallCopy e vocabulário do perfil; Paywall renderiza title/message explicitamente, com fallback centralizado, e currentUsage quando fornecido.
- Paywall usa exclusivamente TIER_BENEFITS/tierBenefitsFor. Essencial agora comunica também PDF mensal e teto de fornecedores; não houve mudança comercial.
- limit-banner.tsx:54: fundo passa para premiumBg; removido shadow="sm", preservada borda hairline. Token já possui valores claro/escuro.
- plans.tsx:99: skeleton enquanto perfil carrega e, em conta gratuita, enquanto uso carrega. Conta paga não espera consulta de uso gratuito. Skeleton existente respeita redução de movimento.
- plans.tsx:290–291: Essencial usa border; ambos os cards têm surfaceElevated. Nome do Profissional usa text; badge mantém premiumBg/premium, contorno premium. Padding uniforme xl.
- plans.tsx:383: Profissional recebe CTA primary e Essencial outline (um CTA rosa preenchido por viewport).

## Verificação

- TDD paywall: 3 testes falharam por título/resource/benefícios ausentes; após a implementação, passaram. Teste do checkout também confirma assinatura Android com tier profissional e período anual.
- TDD skeleton: 2 testes falharam pela ausência de placeholders; após a implementação, passaram. Terceiro teste protege conta paga contra espera desnecessária.
- pnpm exec vitest run src/features/subscription --maxWorkers=2 --minWorkers=1: PASS — 8 arquivos, 51 testes.
- pnpm typecheck (apps/mobile): PASS.
- pnpm lint (apps/mobile): FAIL apenas por erro preexistente fora deste lote: features/pricing/components/simple-pricing-calculator.tsx:949 sonarjs/no-nested-conditional. Reportado ao coordenador.
- ESLint direcionado aos seis arquivos TS/TSX alterados: PASS.
- pnpm context:lint:mobile: PASS; aviso preexistente verticals/ sem ai.context.mobile.md.
- git diff --check nos arquivos do lote: PASS.
- Prettier aplicado aos seis arquivos TS/TSX.

Testes exigiram execução fora do sandbox porque esbuild era impedido de ler ancestrais do caminho; autorização automática aceita. Nenhum commit, PR ou publicação. Layout não foi inspecionado em dispositivo/navegador neste lote.
