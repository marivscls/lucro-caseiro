---
id: 82f0f4d7-cf3e-48e8-a3ad-ac7cbd8fe8ca
slug: build
type: scar
title: Utilitário compartilhado não deve importar expo-file-system/legacy no topo
tags: vitest, vite, expo-file-system, imports, mobile
provenance: observado
evidence: apps/mobile/src/shared/utils/export-html.ts; suíte receipt-pdf + export-html e typecheck aprovados em 2026-07-16
decay: stable
created: 2026-07-17T00:54:10.639468200+00:00
updated: 2026-07-17T00:54:10.639468200+00:00
validated: 2026-07-17T00:54:10.639468200+00:00
links:
---

SINTOMA (2026-07-16): a suíte completa falhou ao importar `receipt-pdf.ts` porque o novo utilitário compartilhado carregava `expo-file-system/legacy` no topo; o Metro/typecheck aceitavam, mas o resolvedor Vite/Vitest não encontrava esse subpath. CORREÇÃO: carregar `expo-print`, `expo-sharing` e a API moderna `File/Paths` de `expo-file-system` dinamicamente dentro da ação de exportação. COMO EVITAR: módulos compartilhados por produção e testes não devem importar subpaths legados nativos no escopo do módulo; prefira API pública moderna e lazy import no caminho realmente nativo.
