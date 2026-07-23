---
id: 5aca8855-0b93-4a36-b433-3db6c1b2d2d0
slug: pricing
type: decision
title: Salvar precificação confirma o cadastro e leva ao Histórico
tags: pricing, ux, navigation, history, success-feedback
provenance: dito
evidence: apps/mobile/src/app/pricing.tsx; apps/mobile/src/app/pricing-complete.tsx; apps/mobile/.maestro/flows/15-pricing.yaml
decay: stable
created: 2026-07-23T02:38:31.838421500+00:00
updated: 2026-07-23T02:38:31.838421500+00:00
validated: 2026-07-23T02:38:31.838421500+00:00
links:
---

Decisão confirmada pela usuária em 2026-07-22: ao salvar/finalizar uma precificação, o app deve informar claramente que o cálculo foi cadastrado/salvo e conduzir a pessoa ao Histórico. Implementação: nos modos Simples e Completo, o alerta “Cálculo salvo!” mantém a confirmação e o botão “Ver histórico” abre o histórico compartilhado, onde o novo cálculo aparece no topo.
