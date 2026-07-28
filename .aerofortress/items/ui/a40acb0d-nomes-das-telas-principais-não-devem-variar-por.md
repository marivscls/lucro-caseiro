---
id: a40acb0d-0e57-4b9d-b01c-7f1444e3634a
slug: ui
type: scar
title: Nomes das telas principais não devem variar por nicho
tags: navegacao, rotulos, arquitetura-da-informacao, personalizacao, mobile
provenance: dito
evidence: Correção da usuária em 2026-07-25; apps/mobile/src/app/_layout.tsx; apps/mobile/src/app/materials.tsx; apps/mobile/src/app/recipes.tsx; apps/mobile/src/app/packaging.tsx
decay: stable
created: 2026-07-25T17:16:11.043592100+00:00
updated: 2026-07-25T17:16:11.043592100+00:00
validated: 2026-07-25T17:16:11.043592100+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): personalizar os nomes das telas principais conforme o tipo de negócio fez a navegação parecer renomeada e gerou confusão. CORREÇÃO CANÔNICA: manter os rótulos estruturais fixos `Insumos`, `Produtos`, `Receitas` e `Embalagens` em menus, cabeçalhos e atalhos, independentemente do nicho. A personalização por perfil pode existir em exemplos, placeholders e textos auxiliares, mas não deve alterar a arquitetura da informação nem os nomes usados para orientação e suporte.
