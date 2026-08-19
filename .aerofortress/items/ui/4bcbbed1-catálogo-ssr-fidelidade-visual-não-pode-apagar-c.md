---
id: 4bcbbed1-31f5-457a-852d-35d55226f2eb
slug: ui
type: scar
title: Catálogo SSR: fidelidade visual não pode apagar contratos funcionais do HTML
tags: catalogo, ssr, renderer, testes, variacoes, markup
provenance: observado
evidence: apps/api/src/features/catalog/catalog.domain.ts; pnpm --filter @lucro-caseiro/api exec vitest run src/features/catalog/catalog.domain.test.ts falhou em 2/42 e passou em 42/42 após preservar os contratos
decay: stable
created: 2026-08-17T02:46:22.982609700+00:00
updated: 2026-08-17T02:46:22.982609700+00:00
validated: 2026-08-17T02:46:22.982609700+00:00
links:
---

FALHA CORRIGIDA (2026-08-16): ao aproximar o catálogo público da referência, trocar a contagem visual de “e” para “•” e remover o dropdown de variação fez 2 testes do renderer falharem. CORREÇÃO: manter o texto legado nos metadados e derivar somente o rótulo visual com “•”; preservar o seletor de variação no HTML para o contrato existente, ocultá-lo apenas na vitrine não varejista e impedir que o CTA exija um controle oculto. COMO EVITAR: em redesign de HTML SSR, diferenciar apresentação visível de contratos semânticos/funcionais cobertos por teste; rode os testes do domínio após mudanças de markup e ajuste sem tornar controles ocultos obrigatórios.
