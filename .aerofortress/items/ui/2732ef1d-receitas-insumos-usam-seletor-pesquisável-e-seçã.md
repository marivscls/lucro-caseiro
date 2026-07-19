---
id: 2732ef1d-b6d5-482e-8fe4-5f171f1b1272
slug: ui
type: scar
title: Receitas: insumos usam seletor pesquisável e seção recolhível
tags: receitas, insumos, seletor, modal, busca, colapsavel, formulario, correcao
provenance: dito
evidence: Pedidos explícitos da usuária em 2026-07-19; apps/mobile/src/features/recipes/components/recipe-materials-editor.tsx; apps/mobile/src/shared/components/form-section.tsx; typecheck, eslint e 338 testes aprovados
decay: stable
created: 2026-07-19T03:37:47.709361100+00:00
updated: 2026-07-19T03:47:30.823892900+00:00
validated: 2026-07-19T03:47:30.823892900+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-07-19): (1) a primeira correção trocou a rolagem horizontal invisível por chips quebrando em linhas, mas deixar todos os insumos expostos poluía o card e não escalava; (2) mesmo com o seletor compacto, a seção inteira precisava poder ser minimizada em formulários longos. CORREÇÃO CANÔNICA: cada linha mostra somente um campo com o insumo atual e abre um modal responsivo pesquisável com custo/unidade; a seção usa o FormSection canônico, começa expandida e pode ser recolhida pelo cabeçalho, mantendo visíveis no resumo a quantidade de insumos e o custo total. COMO EVITAR: coleções grandes em formulários usam seletor sob demanda; blocos repetitivos devem oferecer recolhimento sem perder dados nem esconder o resumo relevante.
