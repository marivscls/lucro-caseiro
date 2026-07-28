---
id: 983e2f3f-796c-499f-b770-6bcb1dd58319
slug: ui
type: scar
title: Páginas desktop são donas do título da rota
tags: desktop, header, hierarquia, responsividade, todas-as-rotas, correcao
provenance: dito
evidence: Correção explícita da usuária em 2026-07-26 invertendo a regra anterior do shell; apps/mobile/src/shared/components/desktop-shell.tsx e ScreenHeader com hideBack mantendo título
decay: stable
created: 2026-07-17T03:49:25.982713100+00:00
updated: 2026-07-26T04:00:00.000000000+00:00
validated: 2026-07-26T04:00:00.000000000+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-26): no desktop (≥1024 px) o DesktopShell mantém apenas a sidebar; o header superior de título/subtítulo foi removido. Cada página é dona do próprio título e subtítulo (via ScreenHeader ou tipografia local). Em telas empilhadas, use `hideBack={isDesktop}` para ocultar só o voltar e preservar título/subtítulo/ações. Abaixo do breakpoint, o cabeçalho mobile permanece intacto. COMO EVITAR: não reintroduzir um header global de rota no shell; inventariar rotas autenticadas ao mudar a hierarquia.
