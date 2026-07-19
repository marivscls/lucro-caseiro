---
id: cc20c1ad-392a-4a2c-8aa4-42b073aead9b
slug: ui
type: scar
title: Handlers de itens repetidos não devem aninhar atualizadores dentro do JSX
tags: react, mobile, formulario, lint, listas, handlers
provenance: observado
evidence: apps/mobile/src/features/purchases/components/create-purchase-form.tsx; `pnpm --filter @lucro-caseiro/mobile lint` aprovado em 2026-07-19
decay: stable
created: 2026-07-19T04:53:32.199796+00:00
updated: 2026-07-19T04:53:32.199796+00:00
validated: 2026-07-19T04:53:32.199796+00:00
links:
---

SINTOMA (2026-07-19): o lint mobile falhou com `sonarjs/no-nested-functions` em quatro controles do formulário de entrada de estoque, porque callbacks de `Pressable`, `Chip` e `Input` criavam `setItems(current => current.map/filter(...))` diretamente dentro de um `items.map`. CORREÇÃO: mover inclusão, remoção e atualização para funções nomeadas do componente (`addProduct`, `removeItem`, `updateItem`) e deixar o JSX apenas encaminhar índice/valor. COMO EVITAR: em listas editáveis renderizadas por map, concentre mutações de estado em handlers nomeados; não aninhe atualizador de estado e outro map/filter dentro do callback JSX.
