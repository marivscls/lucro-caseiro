---
id: d88980a8-0d7b-41e1-8449-867e9847b19b
slug: ui
type: scar
title: Cards Lucro e Agenda precisam de espaçamento fora do Card animado
tags: home, pwa, spacing, react-native-web
provenance: dito
evidence: apps/mobile/src/app/tabs/index.tsx; captura C:\Users\maria\AppData\Roaming\AeroFortress\constellation\tmp\418c0280-4b09-4b11-bad2-93fc62b590b0.png; typecheck e eslint aprovados em 2026-08-10
decay: stable
created: 2026-08-10T23:50:52.562200500+00:00
updated: 2026-08-10T23:55:33.863747500+00:00
validated: 2026-08-10T23:55:33.863747500+00:00
links:
---

SINTOMA (2026-08-10): no PWA mobile, os cards “Lucro em agosto” e “Agenda” continuaram visualmente colados mesmo após adicionar `marginTop` diretamente ao componente `Card`; a captura enviada pela usuária confirmou que a primeira correção não surtiu efeito. CORREÇÃO CANÔNICA: colocar a margem responsiva (`spacing.lg` no eixo vertical mobile, horizontal desktop) em um `View` externo que envolve o Card da Agenda. O Card animado fica responsável apenas por conteúdo/pressão, sem espaçamento externo. Ao revisar esse trecho, validar a estrutura renderizada e não inferir o resultado apenas pela presença da propriedade no JSX.
