---
id: dc33a7bf-5eca-47fa-af56-60bd0c6d825d
slug: ui
type: scar
title: Agenda: estado vazio se centraliza na área útil acima da tab bar
tags: agenda, empty-state, mobile-nativo, tab-bar, centralizacao, safe-area
provenance: dito
evidence: Captura e pedido da usuária em 2026-07-25; apps/mobile/src/app/tabs/agenda.tsx; apps/mobile/src/shared/layout/floating-tab-bar.ts; lint focado, 401 testes e build PWA aprovados
decay: stable
created: 2026-07-26T02:46:39.791721500+00:00
updated: 2026-07-26T02:46:39.791721500+00:00
validated: 2026-07-26T02:46:39.791721500+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): no app nativo mobile, o conjunto do estado vazio da Agenda (ilustração, título, descrição e CTA) parecia baixo porque o `EmptyState` centralizava até o fundo físico da tela, incluindo a área coberta pela tab bar flutuante. CORREÇÃO CANÔNICA: somente em Android/iOS mobile, manter tamanhos e gaps internos e acrescentar ao padding inferior a folga canônica de `floatingTabBarContentPadding(insets.bottom)`, deslocando o bloco inteiro para o centro visual da área realmente disponível. PWA e desktop permanecem inalterados. COMO EVITAR: estados vazios com `flex: 1` dentro de tabs absolutas precisam centralizar na área acima da barra, não no viewport integral.
