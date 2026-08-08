---
id: a3a180a9-857b-48f9-96c1-b6d8e1c4fe45
slug: scripts
type: scar
title: Context lint confunde “método” com marcador TODO após normalização
tags: context, lint, unicode, false-positive
provenance: observado
evidence: apps/api/src/features/pricing/ai.context.api.md; apps/mobile/src/features/pricing/ai.context.mobile.md; pnpm context:lint:changed (falhou e depois passou em 2026-08-08)
decay: stable
created: 2026-08-08T15:09:33.636008300+00:00
updated: 2026-08-08T15:09:33.636008300+00:00
validated: 2026-08-08T15:09:33.636008300+00:00
links:
---

SINTOMA OBSERVADO (2026-08-08): `pnpm context:lint:changed` rejeitou contextos válidos porque a normalização Unicode removeu o acento de “método”, produzindo a sequência `metodo`, que contém `todo`. CORREÇÃO: nos arquivos `ai.context.*.md`, evitar “método” enquanto o detector procurar `TODO` por substring; usar “forma”, “estratégia” ou tornar o detector sensível a limites de palavra antes de voltar ao termo.
