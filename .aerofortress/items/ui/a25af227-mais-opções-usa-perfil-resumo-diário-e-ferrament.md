---
id: a25af227-67ef-4199-8452-6418929d08ce
slug: ui
type: decision
title: Mais opções usa perfil, resumo diário e ferramentas editoriais em camadas
tags: mais-opcoes, perfil, resumo-diario, ferramentas, pwa, responsivo, design-system
provenance: observado
evidence: apps/mobile/src/app/tabs/more.tsx; apps/mobile/src/assets/more-today-overview.png; .aerofortress/tmp/more-options-validation/more-430-final-top.png; .aerofortress/tmp/more-options-validation/more-430-final-management.png; .aerofortress/tmp/more-options-validation/more-native-final-validated2.png
decay: stable
created: 2026-08-24T23:43:50.704007300+00:00
updated: 2026-08-25T00:20:20.957186100+00:00
validated: 2026-08-25T00:20:20.957186100+00:00
links:
---

A tela canônica `tabs/more.tsx` preserva cabeçalho, perfil dinâmico, resumo via `useTodaySummary`, destinos, feature flags, expansão `Ver tudo/Ver menos`, banner condicional e conta/ajuda. A área de ferramentas usa gutter móvel de 24 px, gap de 12 px, Financeiro com 88 px e ícone de 56 px, cards compactos com 80 px e ícones de 46–48 px, raio de 16 px, subtítulo denso de 12/16 px e chevrons alinhados. Em <360 px a grade empilha; em duas colunas mantém larguras iguais inclusive quando a quantidade de itens é ímpar, e no desktop o conteúdo continua limitado a 960 px pelo shell. A navbar permanece exclusivamente no layout global. Validação observada em PWA 320/430/1280 px e Android nativo em aproximadamente 411 dp, sem títulos quebrados ou conteúdo cortado.
