---
id: 78238655-1137-41c3-8fdd-2fad215a2130
slug: ai
type: fact
title: Estrategista de anúncios e copywriter: web implementado, desktop ainda genérico
tags: central-marketing, ia, anuncios, copywriting, web, desktop, portabilidade
provenance: dito
evidence: Correção explícita da usuária em 2026-07-18; referências informadas: campaign-plan.v1, creative-bundle.v3, /campaigns, /creative, apps/desktop/src/AiConsultant.tsx, apps/desktop/src/ResourceBoard.tsx, packages/core/src/marketing.ts
decay: seasonal
created: 2026-07-18T19:12:20.000561600+00:00
updated: 2026-07-18T20:17:53.743266+00:00
validated: 2026-07-18T20:17:53.743266+00:00
links: 
---

Estado corrigido pela usuária em 2026-07-18: no produto como um todo já existe o fluxo dedicado estrategista → copywriter no cliente web Next.js. `campaign-plan.v1` gera um CampaignPlan estruturado com público, objetivo, oferta, orçamento, canais, KPIs e próxima ação em `/campaigns`; `creative-bundle.v3` recebe o contexto da campanha e o BrandProfile (voz, restrições e exemplos aprovados), gera variantes de headline/body/CTA por canal e oferece aprovação e persistência em `/creative`. No desktop, Copywriting e Tráfego Pago continuam como competências da instrução genérica; a Consultoria IA usa modos genéricos e o ResourceBoard gera/refina briefings, sem agentes dedicados nomeados. A lacuna atual é portar para o desktop a experiência especializada que já existe no web, não criar o fluxo no produto do zero.
