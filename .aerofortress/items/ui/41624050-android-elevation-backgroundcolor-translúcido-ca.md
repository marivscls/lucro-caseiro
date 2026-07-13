---
id: 41624050-5ffc-486a-a7db-f4ef6664f79e
slug: ui
type: scar
title: Android: elevation + backgroundColor translúcido = "caixa branca" sólida atrás do card
tags: android, elevation, translucido, caixa-branca, tema-claro, surface
provenance: observado
evidence: apps/mobile/src/app/tabs/new-sale.tsx (payment card ~1076-1108); getSurfaceStyle mesmo arquivo. Commit 605d370.
decay: stable
created: 2026-07-10T13:54:33.081597600+00:00
updated: 2026-07-10T13:54:33.081597600+00:00
validated: 2026-07-10T13:54:33.081597600+00:00
links: 
---

SINTOMA (2026-07-10, testes internos): no tema CLARO, ao selecionar uma forma de pagamento (Nova Venda), o card ganhava uma "caixa branca no meio". Só no Android.

CAUSA: o card selecionado usava `backgroundColor: "rgba(196,112,126,0.18)"` (TRANSLÚCIDO) e herdava `elevation: 3` do `getSurfaceStyle`. No Android, `elevation` + fundo translúcido faz o sistema pintar um retângulo SÓLIDO (branco no tema claro) atrás do conteúdo — a sombra/camada de elevação "vaza" pelo fundo semitransparente. Em iOS não acontece (usa shadow\*). Bug secundário: `...getSurfaceStyle(theme)` era espalhado DEPOIS de `borderWidth/borderColor`, sobrescrevendo a borda de 2px do estado selecionado.

CORREÇÃO: fundo do selecionado passou a ser OPACO (`theme.mode === "dark" ? "#3A2D2A" : "#F6E5EA"`); e o spread do surface foi movido pra ANTES da borda/bg (apps/mobile/src/app/tabs/new-sale.tsx).

COMO EVITAR REPETIR: NUNCA combine `elevation` (Android) com `backgroundColor` translúcido (rgba com alpha < 1) — use cor opaca, ou remova a elevation nesse estado. E ao espalhar um preset de estilo (`...getSurfaceStyle`), lembre que ele sobrescreve o que veio antes: aplique overrides (borda/estado selecionado) DEPOIS do spread. Ver [[backlog-de-testes-internos-2026-07-10-18-itens-pre]].
