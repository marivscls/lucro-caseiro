---
id: c0252e61-b726-4935-a25b-9e095ad75efa
slug: releases
type: fact
title: Logo transparente do tema claro publicada no PWA
tags: release, pwa, branding, tema-claro, railway, produção
provenance: observado
evidence: commit 2fc0e191e000856b5f7d4e66de95d7cceaa0f87c; Railway production status em 2026-08-01; https://app.lucrocaseiro.com.br; bundle entry-b43ce510dc547b79adef3e5cbd02cbbd.js; GitHub Actions run 30722701104
decay: seasonal
created: 2026-08-01T23:11:13.596555600+00:00
updated: 2026-08-01T23:11:13.596555600+00:00
validated: 2026-08-01T23:11:13.596555600+00:00
links:
---

Em 2026-08-01, a versão transparente da marca do Lucro Caseiro para o tema claro foi publicada em produção no commit `2fc0e191e000856b5f7d4e66de95d7cceaa0f87c` (`feat(brand): use transparent logo in light mode`). O Railway terminou com `@lucro-caseiro/mobile` e `@lucro-caseiro/api` Online; `https://app.lucrocaseiro.com.br` respondeu HTTP 200 com o novo bundle `entry-b43ce510dc547b79adef3e5cbd02cbbd.js`, que contém `auth-house-light` e o hash do PNG `cd0280b8a7946118ae9b55c43821f144`. O mesmo push publicou `7566de7`; `https://catalogo.lucrocaseiro.com.br/c/papelaria` deixou de conter `service-placeholder`. O pre-push passou lint, typecheck, 1.092 testes, Sherif e context lint. A CI do GitHub falhou apenas em `knip:full` por dívidas preexistentes não relacionadas (arquivos/dependências/exports já não usados); lint, typecheck, testes e Sherif passaram.
