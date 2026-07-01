---
id: f930d521-1ce4-4688-8de8-6433d5d8fb34
slug: ui
type: scar
title: Clientes repetidos na tela podem ser duplicação visual, não linhas duplicadas
tags: duplicidade, clientes, ui, cache, listagem
provenance: dito
evidence: Correção da usuária em 2026-06-30 com resultado SQL: apenas uma linha Mariana com phone_digits 27999383888 no user_id atual, mas tela exibia várias Mariana iguais.
decay: stable
created: 2026-06-30T22:59:36.693742900+00:00
updated: 2026-06-30T22:59:36.693742900+00:00
validated: 2026-06-30T22:59:36.693742900+00:00
links: 
---

Falha real: após focar em bloqueio no banco para clientes duplicados, a query no Supabase mostrou só uma Mariana com telefone para o usuário, enquanto a tela repetia a mesma cliente várias vezes. A lição é confirmar se a duplicidade existe no banco antes de tratar como persistência; se o banco retorna uma linha e a UI mostra várias, investigar cache/listagem/agrupamento/render, e aplicar dedupe por id no consumo da lista.
