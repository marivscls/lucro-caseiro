---
id: 2ab1f37e-be0b-4159-9fc6-85948e7034b8
slug: build
type: scar
title: Expo web fica branco quando Metro resolve pretty-format 30 pelo hoist do monorepo
tags: expo, metro, web, tela-branca, pretty-format, pnpm, hmr, runtime
provenance: observado
evidence: apps/mobile/package.json; pnpm-lock.yaml; Brave CDP em http://localhost:8084 após a correção: rootLength=9545, tela de login renderizada e EXCEPTIONS=[]
decay: stable
created: 2026-07-25T17:05:47.327854900+00:00
updated: 2026-07-25T17:05:47.327854900+00:00
validated: 2026-07-25T17:05:47.327854900+00:00
links:
---

SINTOMA OBSERVADO (2026-07-25): `localhost:8084` respondia HTTP 200 e entregava um bundle válido, mas `#root` permanecia vazio. O console real do navegador mostrava `TypeError: Cannot read properties of undefined (reading 'default')` em `@expo/metro-runtime/src/HMRClient.ts`, na expressão que normaliza a exportação de `pretty-format`. CAUSA: `@expo/metro-runtime@5.0.5` importa `pretty-format` sem declará-lo; no monorepo pnpm, o resolvedor do Metro alcançou o hoist de `pretty-format@30.3.0` trazido pelos testes, cuja forma ESM não era compatível com esse HMR. CORREÇÃO: declarar `pretty-format: 29.7.0` diretamente nos devDependencies de `apps/mobile`, a mesma versão usada pelo React Native 0.81.5, e reiniciar o Expo com cache limpo. COMO EVITAR: ao diagnosticar tela branca do Expo web, capturar `Runtime.exceptionThrown` no navegador e conferir o módulo/versão realmente resolvido no bundle; HTTP 200, typecheck e bundle gerado não provam que o runtime montou. Validar `#root` com conteúdo e console sem exceções.
