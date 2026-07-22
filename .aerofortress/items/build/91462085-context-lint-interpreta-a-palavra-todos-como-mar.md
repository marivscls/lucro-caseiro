---
id: 91462085-6e0d-4a9a-82be-438f1f85c3fe
slug: build
type: scar
title: Context lint interpreta a palavra Todos como marcador TODO
tags: context-lint, documentation, false-positive, build
provenance: observado
evidence: apps/mobile/src/features/pricing/ai.context.mobile.md; falha de pnpm context:lint em 2026-07-22 e correção para iniciar a frase com “Os campos”
decay: stable
created: 2026-07-22T23:25:10.838490600+00:00
updated: 2026-07-22T23:25:10.838490600+00:00
validated: 2026-07-22T23:25:10.838490600+00:00
links:
---

SINTOMA: `pnpm context:lint` falhou com “Contains TODO/PLACEHOLDER content” em uma frase normal iniciada por “Todos os campos...”, pois a busca do validador trata a sequência inicial `Todo` sem distinguir a palavra portuguesa. CORREÇÃO: reescrever a frase sem `todo/todos` em arquivos `ai.context.*.md`. COMO EVITAR: antes de validar contextos em português, evitar as palavras “todo” e “todos”; preferir “cada”, “qualquer” ou uma construção específica.
