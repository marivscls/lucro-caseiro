---
id: 41c54006-7b1b-452f-a0dd-3848fe320eca
slug: ui
type: scar
title: AppIcon aceita apenas nomes presentes no mapa tipado
tags: app-icon, typescript, ui
provenance: observado
evidence: apps/mobile/src/app/products.tsx; pnpm --filter @lucro-caseiro/mobile typecheck (TS2322 em 2026-07-25)
decay: stable
created: 2026-07-25T03:51:07.626443200+00:00
updated: 2026-07-25T03:51:07.626443200+00:00
validated: 2026-07-25T03:51:07.626443200+00:00
links:
---

SINTOMA OBSERVADO (2026-07-25): ao redesenhar os filtros de Produtos, foi usado `swap-vertical-outline`, nome válido no vocabulário do Ionicons mas ausente do mapa local de `AppIcon`; o typecheck falhou com TS2322. CORREÇÃO: usar `swap-horizontal-outline`, já mapeado. COMO EVITAR: antes de introduzir um nome de ícone, consultar `shared/components/app-icon.tsx` (ou o autocomplete do tipo) e reutilizar uma chave existente; não presumir que todo nome Ionicons é aceito pela camada Lucide do app.
