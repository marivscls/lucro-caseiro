---
id: 000c69bd-32bf-432c-9487-2ef3239985a1
slug: ui
type: scar
title: Primeiros Passos: renomear estado de dismiss exige atualizar também o fim da prévia
tags: primeiros-passos, onboarding, preview, typescript, rename
provenance: observado
evidence: apps/mobile/src/app/tabs/index.tsx; `pnpm --filter @lucro-caseiro/mobile typecheck` falhou com TS2304 e o setter remanescente foi corrigido
decay: stable
created: 2026-08-24T13:48:28.158034600+00:00
updated: 2026-08-24T13:48:28.158034600+00:00
validated: 2026-08-24T13:48:28.158034600+00:00
links: 
---

FALHA CORRIGIDA (2026-08-24): ao generalizar `previewDismissed` para `gettingStartedDismissed`, o ramo que encerra a última etapa da prévia continuou chamando `setPreviewDismissed`, quebrando o typecheck. CORREÇÃO: usar o novo setter em todos os ramos e rodar o typecheck imediatamente. COMO EVITAR: depois de renomear estado/setter compartilhado entre fluxo real e prévia, buscar o identificador antigo no arquivo inteiro antes da validação.
