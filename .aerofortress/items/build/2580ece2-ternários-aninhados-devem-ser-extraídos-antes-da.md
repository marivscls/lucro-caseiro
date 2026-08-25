---
id: 2580ece2-b1ff-4b25-9d86-0a74c41d8050
slug: build
type: scar
title: Ternários aninhados devem ser extraídos antes da renderização
tags: react, lint, sonarjs, conditional-rendering, catalog, mais-opcoes
provenance: observado
evidence: apps/mobile/src/app/pricing-complete.tsx; apps/api/src/features/catalog/catalog.domain.ts; apps/mobile/src/app/tabs/more.tsx; lint mobile executado em 2026-08-24
decay: stable
created: 2026-07-22T22:49:26.277677400+00:00
updated: 2026-08-25T00:08:36.357566500+00:00
validated: 2026-08-25T00:08:36.357566500+00:00
links:
---

SINTOMAS: (1) o gate da Precificação Completa falhou em `sonarjs/no-nested-conditional` ao renderizar loading/autorizado/bloqueado; (2) em 2026-07-29, o pre-commit do Catálogo falhou pela mesma regra ao construir uma seção HTML com um ternário externo e outro dentro de `aria-labelledby`; (3) em 2026-08-24, o lint de Mais opções falhou ao somar os itens visíveis usando um ternário dentro da condição JSX do espaçador da grade.

CORREÇÃO: calcular previamente o conteúdo, atributo ou contagem condicional em uma variável simples e usar essa variável na renderização. Em Mais opções, `visibleManagementItemCount` passou a ser derivado antes do JSX.

COMO EVITAR: não embutir ternários dentro de outros ternários em JSX ou templates HTML. Para três ou mais estados, usar variável tipada e `if / else`; para um atributo opcional ou uma contagem dentro de uma condição maior, extrair o valor antes do template.
