---
id: a3f0d6f4-6321-4e65-ae2b-457ad7d60cef
slug: ui
type: scar
title: Catálogo: salvar deve confirmar resposta da API, sem refetch sobrescrever o retorno
tags: catalogo, persistencia, react-query, cache, validacao-ponta-a-ponta
provenance: observado
evidence: apps/mobile/src/app/catalog.tsx; apps/mobile/src/features/catalog/hooks.ts; relato da usuária em 2026-07-12; lint/typecheck e 276 testes mobile aprovados
decay: stable
created: 2026-07-13T02:30:37.440557300+00:00
updated: 2026-07-13T02:37:01.756180+00:00
validated: 2026-07-13T02:37:01.756180+00:00
links: 
---

SINTOMA (2026-07-12): ao tocar Salvar, o botão ficava em “Salvando...” e no fim nenhuma configuração permanecia — inclusive slug e WhatsApp, não só aparência. A primeira correção focou concorrência/gate e foi insuficiente sem validação ponta a ponta. CORREÇÃO NO CLIENTE: (1) salvar slug/WhatsApp separadamente da personalização para uma rejeição de feature não cancelar campos básicos; (2) conferir os valores retornados pela API antes de exibir sucesso; (3) salvar aparência em uma segunda operação confirmada; (4) usar a resposta da mutation como cache autoritativo, sem invalidar/refetch imediato que possa recolocar estado anterior; (5) desfazer preview de capa/logo se a persistência falhar; (6) serializar mutations. LIÇÃO: “request terminou” não significa “persistiu”; fluxos de configuração devem validar o eco da API e só então confirmar sucesso. Quando campos básicos e premium falham juntos, não concluir pela causa de um único controle.
