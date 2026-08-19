---
id: b4c1e28a-8c7c-423c-9586-a23d7c342ec2
slug: ui
type: scar
title: Operação desktop usa dashboard canônico, não hero promocional
tags: operations, revenda, desktop, design-system, dashboard
provenance: dito
evidence: Captura da usuária em 2026-08-14; apps/mobile/src/app/operations.tsx; typecheck, lint e build:pwa:revenda aprovados; http://localhost:8086/operations retornou 200 com bundle entry-f34153b6c1f9175736d1ab5af48bf58d.js
decay: stable
created: 2026-08-14T17:08:11.037561400+00:00
updated: 2026-08-14T17:08:11.037561400+00:00
validated: 2026-08-14T17:08:11.037561400+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-14): a primeira versão da Operação da Revenda destoava das demais páginas em componentes, espaçamento, cores, ícones, padronização e hierarquia. CORREÇÃO CANÔNICA NO DESKTOP: `ScreenHeader` com descrição e voltar oculto, FAB `+` para o fluxo selecionado, resumo em cards neutros com ícones Lucide, ação de serial/equipamento como secundária, chips somente como filtro e `EmptyState` compartilhado com CTA primário. O hero azul promocional não pertence ao dashboard desktop. O mobile permanece como baseline e conserva a composição anterior.
