---
id: 10eb1ee9-a194-4879-946b-8c82e836f199
slug: ui
type: scar
title: UI comercial: não chamar feature Profissional de Premium
tags: catalogo, planos, terminologia, premium-legado, profissional
provenance: dito
evidence: apps/mobile/src/app/catalog.tsx; apps/mobile/src/features/subscription/plan-features.test.ts; mensagem da usuária em 2026-07-13
decay: stable
created: 2026-07-13T03:05:53.401921100+00:00
updated: 2026-07-13T03:05:53.401921100+00:00
validated: 2026-07-13T03:05:53.401921100+00:00
links: 
---

Correção da usuária em 2026-07-13: o Catálogo ainda dizia que a personalização exigia “Premium”, apesar do modelo atual usar Essencial e Profissional. “Premium” legado é apenas um valor técnico normalizado para `professional`, não um nome comercial exibível. CORREÇÃO: textos, badge, acessibilidade, teaser e CTA do Catálogo agora dizem “Profissional”; o gate continua por `catalogPremium`/`catalogCustomization`, e teste prova que o valor legado `premium` é aceito como Profissional. COMO EVITAR: em UI e documentação comercial nova, usar sempre Gratuito/Essencial/Profissional; manter “premium” somente em chaves técnicas legadas quando renomeá-las quebraria compatibilidade.
