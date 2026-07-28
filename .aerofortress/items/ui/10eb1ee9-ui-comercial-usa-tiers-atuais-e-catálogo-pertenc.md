---
id: 10eb1ee9-a194-4879-946b-8c82e836f199
slug: ui
type: scar
title: UI comercial usa tiers atuais e Catálogo pertence ao Essencial
tags: catalogo, planos, terminologia, premium-legado, essential
provenance: dito
evidence: apps/mobile/src/app/catalog.tsx; packages/contracts/src/schemas/plans.ts; correções da usuária em 2026-07-13 e 2026-07-25
decay: stable
created: 2026-07-13T03:05:53.401921100+00:00
updated: 2026-07-26T01:20:26.444246200+00:00
validated: 2026-07-26T01:20:26.444246200+00:00
links:
---

Correção da usuária em 2026-07-13: a UI comercial não pode chamar planos ou recursos de “Premium”; o valor legado é apenas técnico. ATUALIZAÇÃO DA USUÁRIA EM 2026-07-25: Catálogo completo e personalização pertencem ao **Essencial**. CORREÇÃO ATUAL: textos, badge, acessibilidade, teaser e CTA do Catálogo dizem “Essencial”; o gate continua pelas chaves técnicas `catalogPremium`/`catalogCustomization`, agora presentes no conjunto de features do Essencial. O valor legado `premium` continua normalizado para Profissional apenas por compatibilidade. COMO EVITAR: usar sempre Gratuito/Essencial/Profissional na UI e consultar a matriz atual antes de escolher o tier.
