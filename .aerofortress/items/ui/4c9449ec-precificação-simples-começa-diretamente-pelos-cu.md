---
id: 4c9449ec-64ec-4a33-b59c-5c32ba6a3827
slug: ui
type: decision
title: Precificação simples começa diretamente pelos custos
tags: ui, precificacao, mobile
provenance: dito
evidence: apps/mobile/src/features/pricing/components/simple-pricing-calculator.tsx; apps/mobile/src/assets/pricing-costs-hero.png; .codex-logs/pricing-card-side-breathing.png
decay: stable
created: 2026-07-25T20:33:18.303813100+00:00
updated: 2026-07-25T21:02:02.381429400+00:00
validated: 2026-07-25T21:02:02.381429400+00:00
links:
---

A tela de precificação simples deve começar diretamente pela seção “Custos da unidade”, sem cabeçalho introdutório nem rótulo de produto/ficha técnica. A seção segue a referência visual fornecida em 2026-07-25: card elevado com título e subtítulo, ilustração PNG ampliada de calculadora e moedas no canto superior direito, campos com área de ícone segmentada, seletor de embalagem, divisor tracejado e total; abaixo ficam lucro desejado e taxa de venda. O card de custos mantém 24 px de respiro horizontal interno. Textos visíveis permanecem em português conforme a referência. O atalho de importar ficha técnica continua compacto e só aparece quando há ficha com custo disponível.
