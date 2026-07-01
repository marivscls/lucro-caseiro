---
id: 085ddbe6-8d18-49c0-b966-71f356901d3e
slug: geral
type: decision
title: Sessão 2026-06-25: 4 features premium shipadas (modo claro, faixa promo, fotos múltiplas, recorrência de gastos) + observação onboarding
tags: features, premium, kyte, onboarding, finance, catalog, products
provenance: observado
evidence: origin/main commits b698582,e38a5d8,d949ae2,5b8f0a6,e98ea34,fd1aee2,1c3876a; migrations 023/024/025; app/recurring-expenses.tsx
decay: seasonal
created: 2026-06-25T16:02:25.537163300+00:00
updated: 2026-06-25T16:02:25.537163300+00:00
validated: 2026-06-25T16:02:25.537163300+00:00
links: 
---

Sessão guiada por comparação com o Kyte (concorrente). Decidido construir só o que faz sentido pro público caseiro; **cortados** Facebook Pixel e import de produtos; **multiusuário separado** (quebraria o user-scoping/RLS, vira projeto à parte).

**Shipado em prod (origin/main, migrations 023/024/025 RODADAS no Supabase prod):**

- **Modo claro** persistido + segue o sistema + StatusBar por tema (`packages/ui` theme-context `onModeChange`; mobile `theme-pref.ts` AsyncStorage; `_layout.tsx`). Bundlado no commit `b698582`.
- **Faixa promocional** no catálogo público (Premium): `catalog_settings.promo_banner` (máx 60), tira `.promo` no topo, gate `wantsCustomization`. Commit `e38a5d8`.
- **Fotos múltiplas por produto** (1 grátis / 3 Premium): `products.extra_photos text[]` (máx 2 extras; `photoUrl` segue principal), guard `requirePremiumForExtraPhotos` em POST/PATCH; galeria no catálogo (tira scroll-snap sem JS, `PublicCatalogProduct.extraPhotos`); form mobile "Mais fotos" em create-product-form. Commits `d949ae2`+`5b8f0a6`+`e98ea34`.
- **Recorrência de gastos** (Premium): tabela `recurring_expenses` + `finance_entries.recurring_expense_id`. Geração automática idempotente: `getMonthlySummary` do mês corrente chama `applyDueRecurring`. CRUD em `/finance/recurring` (criar Premium). Tela mobile `app/recurring-expenses.tsx` (aba Mais → "Gastos fixos"). Commits `fd1aee2`+`1c3876a`.

**Observação pendente (não decidida):** Kyte tem educação contextual em TODA tela — wizard de setup (LC já tem em `app/onboarding.tsx`) E carrossel de intro por feature no estado vazio (1/3,2/3,3/3). LC NÃO tem o 2º: usa `EmptyState` simples. Recomendei subir o nível dos EmptyState das telas-chave (Histórico, Financeiro, Catálogo, Gastos fixos) pra educarem, em vez de carrossel (que adiciona toques e briga com o princípio #1). Aguardando decisão da usuária.
