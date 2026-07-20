---
id: 26ec68b4-541d-4832-ab5e-a0aff554e9f2
slug: ui
type: scar
title: Estados vazios não devem duplicar a ação principal nem rebaixar o CTA visualmente
tags: nova-venda, insumos, embalagens, etiquetas, empty-state, botao, consistencia-visual, cta, validacao-visual, deploy, pwa
provenance: observado
evidence: apps/mobile/src/app/tabs/new-sale.tsx; apps/mobile/src/app/materials.tsx; apps/mobile/src/app/packaging.tsx; apps/mobile/src/app/labels.tsx; commit f0b08e9; Railway @lucro-caseiro/mobile Online; verificação HTTP de https://app.lucrocaseiro.com.br em 2026-07-19
decay: stable
created: 2026-07-20T02:02:39.248887800+00:00
updated: 2026-07-20T02:20:42.758611100+00:00
validated: 2026-07-20T02:20:42.758611100+00:00
links:
---

SINTOMA (2026-07-19): na etapa de produto da Nova Venda, um estado vazio central com “Nenhum produto cadastrado” e “Cadastrar produto” aparecia ao fundo embora “Adicionar produto” já existisse no topo. Em Insumos, Embalagens e Etiquetas, os CTAs dos estados vazios eram os únicos botões principais equivalentes sem fundo rosa porque forçavam `variant="outline"`. CORREÇÃO: remover o bloco vazio duplicado da Nova Venda e deixar “Novo insumo”, “Cadastrar embalagem” e “Criar etiqueta” usarem a variante primária padrão. RECORRÊNCIA/CORREÇÃO DA USUÁRIA: após a edição local e lint/typecheck, ela informou que os ajustes não constaram. A causa observada foi que o preview/produção ainda servia bundles anteriores; somente o fonte tinha mudado. O PWA local foi reconstruído e o commit `f0b08e9` publicado; o Railway ficou Online e `app.lucrocaseiro.com.br` passou ao bundle `entry-c5ada8f400338e20c4c7e6f98a3ebd43.js`, sem o estado antigo e com os três CTAs compilados sem `variant:"outline"`. COMO EVITAR: não declarar ajuste visual concluído apenas por diff, lint ou typecheck; confirmar build/publicação e inspecionar o bundle servido pela URL usada pela usuária.
