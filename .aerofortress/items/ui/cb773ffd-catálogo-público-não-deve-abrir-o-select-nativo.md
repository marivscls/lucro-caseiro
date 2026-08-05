---
id: cb773ffd-3cc9-49d3-b624-845442dd74ac
slug: ui
type: scar
title: Catálogo público não deve abrir o select nativo escuro do Android
tags: catalogo, android, select, bottom-sheet, ui, accessibility, web
provenance: dito
evidence: Capturas da usuária em 2026-08-04; apps/api/src/features/catalog/catalog.domain.ts; apps/api/src/features/catalog/catalog.domain.test.ts; 35 testes, typecheck e lint da API aprovados em 2026-08-04
decay: stable
created: 2026-08-05T01:44:08.898917500+00:00
updated: 2026-08-05T02:11:34.677091200+00:00
validated: 2026-08-05T02:11:34.677091200+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-08-04): (1) o filtro de categoria do catálogo público abriu a lista nativa escura do Android, fora da identidade visual do Lucro Caseiro; (2) a primeira tentativa foi considerada esquecida porque ainda mantinha o `<select>` nativo como controle inicial e dependia de JavaScript para escondê-lo e criar um `<dialog>`. CORREÇÃO CANÔNICA: categoria e ordenação deixam o `<select>` nativo oculto desde o HTML inicial e usam um trigger temático que abre uma camada clara própria (`div` com `role=dialog`), sem `showModal` e sem popup do sistema. A lista é rolável, destaca a seleção com as cores do catálogo, fecha pelo fundo/×/Escape, restaura o foco e respeita a safe area. COMO EVITAR: em superfícies públicas com identidade própria, não expor a UI nativa não tematizável nem depender do suporte a `<dialog>` para o controle principal; o teste deve provar que o select nasce oculto e que não existe chamada a `showModal`.
