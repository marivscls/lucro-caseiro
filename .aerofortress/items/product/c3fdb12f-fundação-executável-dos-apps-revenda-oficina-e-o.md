---
id: c3fdb12f-e5ed-468b-8ba1-66d5e665e84b
slug: product
type: fact
title: Fundação executável dos apps Revenda, Oficina e Obra
tags: vertical-apps, revenda, oficina, obra, implementation
provenance: observado
evidence: apps/mobile/src/app/operations.tsx; apps/mobile/src/app/lucro-apps.tsx; apps/api/src/features/verticals; packages/database/src/migrations/056_vertical_apps_foundation.sql
decay: seasonal
created: 2026-08-14T03:18:29.293423100+00:00
updated: 2026-08-14T03:18:29.293423100+00:00
validated: 2026-08-14T03:18:29.293423100+00:00
links:
---

Em 2026-08-14 foi implementada a primeira fundação executável dos três apps aprovados: marcas/builds isolados, documentos verticais tipados com eventos e estados, central operacional mobile/PWA, ativos da Oficina, seriais da Revenda, vínculos de Obra, dashboard e área Aplicativos Lucro com memberships/deep links. A API valida posse de referências entre contas e a migração 056 nasce com RLS e privilégios diretos revogados. Os 3 exports PWA passaram; typechecks dos cinco pacotes, lint mobile, 757 testes da API e 443 testes mobile passaram. A migração de produção, projetos EAS, artes/ícones exclusivos e publicação nas lojas ainda dependem da etapa de release e não foram executados.
