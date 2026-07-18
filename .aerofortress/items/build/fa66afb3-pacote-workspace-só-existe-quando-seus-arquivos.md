---
id: fa66afb3-3a80-4ebf-afd1-9f21b175cd8d
slug: build
type: scar
title: Pacote workspace só existe quando seus arquivos e consumidores resolvem juntos
tags: pnpm, workspace, next, expo, brands, module-resolution, junction
provenance: observado
evidence: packages/brands; apps/api/package.json; apps/mobile/package.json; apps/web/package.json; packages/ui/package.json; pnpm-lock.yaml; em 2026-07-18 `pnpm install --frozen-lockfile` preservou o pacote e `pnpm --filter @lucro-caseiro/web build` gerou 20 rotas
decay: stable
created: 2026-07-18T18:45:06.370398900+00:00
updated: 2026-07-18T18:53:16.193794+00:00
validated: 2026-07-18T18:53:16.193794+00:00
links:
---

SINTOMA (2026-07-18; recorreu após a primeira correção): Next/Turbopack falhava com `Module not found: Can't resolve '@lucro-caseiro/brands'`. Na recorrência, `packages/brands` tinha desaparecido novamente, mas API e web mantinham junctions em `node_modules` apontando para esse alvo inexistente; dependências diretas de mobile/UI também tinham sido revertidas. CAUSA OPERACIONAL: restaurar somente o alvo não estabiliza um workspace quando links quebrados e manifests divergentes continuam presentes. CORREÇÃO: validar os alvos, remover apenas os junctions quebrados de `@lucro-caseiro/brands`, recriar o pacote canônico, alinhar todos os manifests/lockfile e só então rodar `pnpm install`; imports relativos do pacote usam `.ts` explícito para o carregador ESM do Expo. COMO EVITAR: ao introduzir ou recuperar um workspace package, confirmar em sequência `Test-Path` do package, dependências diretas, `pnpm install --frozen-lockfile`, alvo dos junctions, typecheck e builds de cada carregador. Documentação, lockfile ou um build anterior não provam que o pacote continua fisicamente presente.
