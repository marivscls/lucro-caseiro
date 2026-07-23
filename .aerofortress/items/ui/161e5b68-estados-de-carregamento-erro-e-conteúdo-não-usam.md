---
id: 161e5b68-849e-4b6d-a4f3-5eed8cbac831
slug: ui
type: scar
title: Estados de carregamento, erro e conteúdo não usam ternário aninhado
tags: react, jsx, lint, sonarjs, estados, receitas
provenance: observado
evidence: apps/mobile/src/features/recipes/components/recipe-statistics-modal.tsx; lint e typecheck aprovados após a correção em 2026-07-20
decay: stable
created: 2026-07-20T20:49:38.420170300+00:00
updated: 2026-07-20T20:49:38.420170300+00:00
validated: 2026-07-20T20:49:38.420170300+00:00
links:
---

SINTOMA (2026-07-20): o lint da nova modal de estatísticas de receitas falhou em `sonarjs/no-nested-conditional` porque carregamento, erro e conteúdo eram escolhidos por um ternário aninhado no JSX. CORREÇÃO: resolver os três estados em uma variável `React.ReactNode` com `if/else` antes do retorno e deixar o JSX da modal apenas renderizar `{content}`. COMO EVITAR: componentes com três ou mais estados visuais devem nomear o fluxo antes do JSX; ternário fica reservado a uma escolha binária simples.
