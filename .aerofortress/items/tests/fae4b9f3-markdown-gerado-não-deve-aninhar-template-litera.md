---
id: fae4b9f3-85f5-4087-9a9a-573068a21d41
slug: tests
type: scar
title: Markdown gerado não deve aninhar template literal no map
tags: eslint, sonarjs, template-literal, markdown, web
provenance: observado
evidence: apps/web/src/features/marketing/campaign-studio.tsx; `pnpm --filter @lucro-caseiro/web lint` reportou sonarjs/no-nested-template-literals na linha 1132
decay: stable
created: 2026-07-18T23:20:27.989848700+00:00
updated: 2026-07-18T23:20:27.989848700+00:00
validated: 2026-07-18T23:20:27.989848700+00:00
links:
---

SINTOMA (2026-07-18): testes e typechecks passaram, mas o lint web falhou em `creativeVariantDocument` com `sonarjs/no-nested-template-literals`. CAUSA: o template do bloco Markdown interpolava um `.map()` cujo callback também usava template literal. CORREÇÃO: montar primeiro `retentionItems` com concatenação simples e só depois interpolar o resultado no template externo. COMO EVITAR: em serializadores Markdown/HTML, pré-calcular listas e fragmentos antes do template principal; isso melhora legibilidade e satisfaz a regra Sonar.
