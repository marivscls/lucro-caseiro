---
id: dd666175-e547-4bcf-81ab-a8efc39193fa
slug: specs
type: doc
title: PRD — Densidade e dimensionamento da PWA no desktop
tags: desktop, responsividade, ui, prd
provenance: observado
evidence: docs/prd-densidade-dimensionamento-desktop.md; capturas da usuária de 2026-07-17 mostram implementação incompleta
decay: stable
created: 2026-07-17T13:30:23.673247500+00:00
updated: 2026-07-17T15:38:09.875221400+00:00
validated: 2026-07-17T15:38:09.875221400+00:00
links:
---

PRD em implementação. As zonas e helpers de densidade foram criados, mas a primeira aplicação não limitou visualmente várias superfícies de modal: capturas da usuária mostram detalhe/edição de encomenda, Novo cliente, Editar cliente e Editar insumo ainda em largura quase total. TypeScript, testes, lint e build passaram, mas isso não valida a composição. A correção precisa atuar na superfície/contêiner efetivo de cada tela e ser verificada visualmente antes de marcar o PRD como implementado.
