---
id: 2580ece2-b1ff-4b25-9d86-0a74c41d8050
slug: build
type: scar
title: Gate React com três estados deve calcular o conteúdo antes do JSX
tags: react, lint, sonarjs, conditional-rendering, gate
provenance: observado
evidence: apps/mobile/src/app/pricing-complete.tsx; lint mobile executado em 2026-07-22
decay: stable
created: 2026-07-22T22:49:26.277677400+00:00
updated: 2026-07-22T22:49:26.277677400+00:00
validated: 2026-07-22T22:49:26.277677400+00:00
links:
---

SINTOMA: o gate da Precificação Completa falhou primeiro em `sonarjs/no-nested-conditional` ao renderizar loading/autorizado/bloqueado com ternário aninhado; ao extrair para uma função com retornos JSX diferentes, falhou em `sonarjs/function-return-type`. CORREÇÃO: calcular uma variável `React.ReactNode` com `if / else if / else` antes do JSX e renderizar essa variável. COMO EVITAR: gates React com três ou mais estados devem usar conteúdo pré-calculado, não ternário aninhado nem helper com tipos de elemento diferentes.
