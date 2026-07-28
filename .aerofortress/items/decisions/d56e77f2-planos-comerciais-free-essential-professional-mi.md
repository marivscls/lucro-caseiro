---
id: d56e77f2-cb4f-4ce9-b47b-567dbf574e92
slug: decisions
type: decision
title: Planos comerciais: free/essential/professional (migração do premium binário)
tags: planos, premium, billing, freemium, stripe, google-play, catalogo
provenance: dito
evidence: docs/planos-comerciais.md; packages/contracts/src/schemas/plans.ts; correção da usuária em 2026-07-25
decay: stable
created: 2026-07-01T17:24:24.903438+00:00
updated: 2026-07-26T01:19:40.321617900+00:00
validated: 2026-07-26T01:19:40.321617900+00:00
links:
---

O modelo binário free/premium virou três planos: **Gratuito**, **Essencial** (R$ 29,90/mês · R$ 299/ano) e **Profissional** (R$ 69,90/mês · R$ 699/ano). Ver `docs/planos-comerciais.md`.

Regra de divisão atualizada pela usuária em 2026-07-25: **Essencial** remove os limites de volume (vendas/clientes/produtos/receitas/embalagens ilimitados), entrega o operacional básico (agenda, fiado, financeiro básico) e libera o **Catálogo completo e personalizado**. `catalogPremium` e `catalogCustomization` são features do Essencial. **Profissional** = tudo do Essencial + relatórios avançados, exportação PDF/XLSX, **fornecedores ilimitados + compras**, gastos recorrentes, rótulos personalizados, orçamentos PDF, várias fotos por produto, produtos compostos, notificações avançadas e suporte prioritário.

**Fornecedores/Compras só no Profissional.** No Essencial os fornecedores mantêm o teto do free (3); dados antigos continuam visíveis, só não passa de 3.

Fonte única da matriz: `@lucro-caseiro/contracts` (`PLAN_LIMITS`, `PLAN_FEATURES`, `planLimit`, `planHasFeature`, `resolveActivePlan`, `hasActiveFeature`, `PLAN_PRICING`). Limite free de vendas: 30/mês. Assinantes `premium` legados migram para `professional` (o valor técnico permanece normalizado na leitura). Ver [[freemium-limits-decision]], [[premium-com-limite-android-sync]] e a scar [[catalogo-completo-e-personalizado-pertence-ao-essencial]].
