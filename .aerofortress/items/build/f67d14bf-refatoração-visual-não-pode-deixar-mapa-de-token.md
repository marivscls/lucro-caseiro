---
id: f67d14bf-29e3-48f7-bf38-9cdb85c94138
slug: build
type: scar
title: Refatoração visual não pode deixar mapa de tokens sem uso
tags: lint, typescript, remotion, refatoracao, unused-vars
provenance: observado
evidence: apps/promo-video/src/FeatureGraphics.tsx; `pnpm lint` falhou e depois passou em 2026-08-11
decay: stable
created: 2026-08-11T23:59:34.484920800+00:00
updated: 2026-08-11T23:59:34.484920800+00:00
validated: 2026-08-11T23:59:34.484920800+00:00
links:
---

SINTOMA (2026-08-11): ao migrar `FeatureGraphics.tsx` dos aliases locais de cor para `MARKETING_COLORS`, o objeto `colors` permaneceu declarado e fez o lint falhar em `@typescript-eslint/no-unused-vars`. CORREÇÃO: remover o mapa órfão junto com a migração e executar `pnpm lint` antes da renderização final. COMO EVITAR: depois de substituir tokens ou helpers compartilhados, buscar referências remanescentes e eliminar declarações que ficaram sem consumidores.
