---
id: 2580ece2-b1ff-4b25-9d86-0a74c41d8050
slug: build
type: scar
title: Ternários aninhados devem ser extraídos antes da renderização
tags: react, lint, sonarjs, conditional-rendering, catalog
provenance: observado
evidence: apps/mobile/src/app/pricing-complete.tsx; apps/api/src/features/catalog/catalog.domain.ts; lint/pre-commit executado em 2026-07-29
decay: stable
created: 2026-07-22T22:49:26.277677400+00:00
updated: 2026-07-29T12:45:29.761482+00:00
validated: 2026-07-29T12:45:29.761482+00:00
links:
---

SINTOMAS: (1) o gate da Precificação Completa falhou em `sonarjs/no-nested-conditional` ao renderizar loading/autorizado/bloqueado; (2) em 2026-07-29, o pre-commit do Catálogo falhou pela mesma regra ao construir uma seção HTML com um ternário externo e outro dentro do atributo `aria-labelledby`.

CORREÇÃO: calcular previamente o conteúdo ou atributo condicional em uma variável simples e usar essa variável na renderização. No Catálogo, `productsAriaLabel` passou a ser calculado antes de `productsSection`.

COMO EVITAR: não embutir ternários dentro de outros ternários em JSX ou templates HTML. Para três ou mais estados, usar variável tipada e `if / else`; para um atributo opcional dentro de uma condição maior, extrair o atributo antes do template.
