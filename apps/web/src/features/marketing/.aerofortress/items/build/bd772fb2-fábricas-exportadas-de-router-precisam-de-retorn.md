---
id: bd772fb2-6461-46f3-a7af-cfae04b0d95c
slug: build
type: scar
title: Fábricas exportadas de Router precisam de retorno explícito
tags: typescript, express, typecheck
provenance: observado
evidence: apps/api/src/features/marketing/video-editor.routes.ts; `pnpm --filter @lucro-caseiro/api typecheck` falhou antes e passou após a anotação.
decay: stable
created: 2026-08-12T19:15:57.768360800+00:00
updated: 2026-08-12T19:15:57.768360800+00:00
validated: 2026-08-12T19:15:57.768360800+00:00
links:
---

FALHA REAL (2026-08-12): o typecheck da API falhou com TS2742 ao inferir o retorno de uma fábrica exportada do Express 5, porque o tipo só podia ser nomeado por um caminho interno de `@types/express-serve-static-core`. Em fábricas de router exportadas, anotar o retorno como `Router` importado como tipo (`type Router as ExpressRouter`) evita declarações não portáveis.
