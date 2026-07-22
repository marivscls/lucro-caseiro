---
id: 7ebac7b8-c608-45de-a8f6-4617d41b1219
slug: pricing
type: scar
title: Precificação simples não pode transferir a soma dos custos para fora do app
tags: pricing, ux, simple, automation, costs
provenance: dito
evidence: Correção da usuária em 2026-07-22 após avaliar a tela publicada; apps/mobile/src/features/pricing/components/simple-pricing-calculator.tsx
decay: stable
created: 2026-07-22T21:58:59.772069500+00:00
updated: 2026-07-22T21:58:59.772069500+00:00
validated: 2026-07-22T21:58:59.772069500+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-22): definir o modo Simples apenas como “custo total por unidade + lucro desejado” obriga a pessoa a calcular por fora embalagem, insumos, mão de obra e outros custos. Isso contradiz a proposta do Lucro Caseiro de chegar ao preço correto sem chute nem trabalho externo. COMO EVITAR: simplicidade significa menos decisões e mais preenchimento automático, não ocultar componentes do custo. O modo Simples deve puxar insumos da receita, calcular embalagem/mão de obra/rateio dentro do app com linguagem direta e permitir ajustes opcionais, mantendo o resultado ao vivo; nenhuma soma necessária deve ser delegada à calculadora externa.
