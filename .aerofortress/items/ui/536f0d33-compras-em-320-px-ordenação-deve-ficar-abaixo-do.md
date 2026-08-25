---
id: 536f0d33-6ee0-47a2-8d43-d14462d25024
slug: ui
type: scar
title: Compras: em 320 px, ordenação deve ficar abaixo do título da seção
tags: compras, pwa, responsivo, 320px, ordenacao, chips, cta
provenance: observado
evidence: apps/mobile/src/app/purchases.tsx; .aerofortress/tmp/purchases-responsive-audit/report.json e capturas empty/data em 320 e 592 px
decay: stable
created: 2026-08-24T17:07:23.092283400+00:00
updated: 2026-08-24T17:07:23.092283400+00:00
validated: 2026-08-24T17:07:23.092283400+00:00
links: 
---

FALHA CORRIGIDA (2026-08-24): após compactar os filtros de Compras, manter “Compras recentes” e “Mais recentes” na mesma linha fez o título truncar para “Compras re...” em 320 px. CORREÇÃO CANÔNICA: abaixo de 360 px, o cabeçalho da seção vira coluna, preserva o título completo em 24 px e alinha o indicador de ordenação à direita; em larguras maiores, ambos permanecem na mesma linha. A faixa de filtros usa altura explícita de 44 px para não esticar no React Native Web. O estado vazio mantém apenas o CTA interno; o CTA inferior só aparece quando existem compras.
