---
id: d56e77f2-cb4f-4ce9-b47b-567dbf574e92
slug: decisions
type: decision
title: Planos comerciais: free/essential/professional (migração do premium binário)
tags: planos, premium, billing, freemium, stripe, google-play
provenance: dito
evidence: docs/planos-comerciais.md; packages/contracts/src/schemas/plans.ts; packages/database/src/migrations/029_commercial_plans.sql
decay: stable
created: 2026-07-01T17:24:24.903438+00:00
updated: 2026-07-01T17:24:24.903438+00:00
validated: 2026-07-01T17:24:24.903438+00:00
links: 
---

O modelo binário free/premium virou três planos: **Gratuito**, **Essencial** (R$ 29,90/mês · R$ 299/ano) e **Profissional** (R$ 69,90/mês · R$ 699/ano). Ver `docs/planos-comerciais.md`.

Regra de divisão (confirmada pela usuária, dev solo bootstrapped): **Essencial** remove os limites de volume (vendas/clientes/produtos/receitas/embalagens ilimitados) e entrega o operacional básico (agenda, fiado, financeiro básico, catálogo básico). **Profissional** = tudo do Essencial + as features premium: catálogo completo/personalizado, relatórios avançados, exportação PDF/XLSX, **fornecedores ilimitados + compras**, gastos recorrentes, rótulos personalizados, orçamentos PDF, várias fotos por produto, produtos compostos.

**Decisão-chave — Fornecedores/Compras só no Profissional** (o PRD era ambíguo: "Limitado ou não incluso"). Razão: dar ao tier de R$ 69,90 um motivo claro de existir sobre o de R$ 29,90 (diferenciação/upsell, não custo de servir). No Essencial os fornecedores mantêm o teto do free (3) — dados antigos continuam visíveis, só não passa de 3.

Fonte única da matriz (limites + features): `@lucro-caseiro/contracts` (`PLAN_LIMITS`, `PLAN_FEATURES`, `planLimit`, `planHasFeature`, `resolveActivePlan`, `hasActiveFeature`, `PLAN_PRICING`). Limite free de vendas: 50→30/mês. Assinantes `premium` legados migram para `professional` (o valor `premium` fica no enum mas é normalizado na leitura). Ver [[freemium-limits-decision]] e a scar [[premium-com-limite-android-sync]].
