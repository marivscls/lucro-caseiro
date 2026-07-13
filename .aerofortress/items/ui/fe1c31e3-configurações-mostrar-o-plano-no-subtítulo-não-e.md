---
id: fe1c31e3-2785-4f46-b065-752f01c76018
slug: ui
type: scar
title: Configurações: mostrar o plano no subtítulo, não em badge lateral
tags: configuracoes, planos, badge, layout, correcao
provenance: dito
evidence: apps/mobile/src/app/settings.tsx; screenshots e correção da usuária em 2026-07-13
decay: stable
created: 2026-07-13T03:29:25.769541+00:00
updated: 2026-07-13T03:31:04.811227+00:00
validated: 2026-07-13T03:31:04.811227+00:00
links: 
---

Correção da usuária em 2026-07-13 após ver o primeiro ajuste: no card de assinatura em Configurações, a redundância deve ser resolvida removendo o badge lateral “ESSENCIAL”, não o subtítulo “Essencial ativo”. O badge comprime o título “Plano Lucro Caseiro” e ficou visualmente ruim. CORREÇÃO: restaurar o subtítulo com o plano ativo e remover o badge do card. COMO EVITAR: nesse card, a indicação canônica do tier é o subtítulo; não adicionar badge lateral concorrendo pela largura.
