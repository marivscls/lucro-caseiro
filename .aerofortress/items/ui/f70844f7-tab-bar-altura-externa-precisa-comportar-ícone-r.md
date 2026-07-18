---
id: f70844f7-1562-4ed3-b1c3-9272eba14364
slug: ui
type: scar
title: Tab bar: altura externa precisa comportar ícone, rótulo e paddings internos
tags: mobile, pwa, tab-bar, responsividade, react-navigation, layout
provenance: observado
evidence: apps/mobile/src/app/tabs/_layout.tsx; captura fornecida pela usuária em 2026-07-16; lint, typecheck, 331 testes e export web aprovados
decay: stable
created: 2026-07-17T01:53:08.623245900+00:00
updated: 2026-07-17T01:53:08.623245900+00:00
validated: 2026-07-17T01:53:08.623245900+00:00
links: 
---

SINTOMA (2026-07-16): na barra inferior compacta, os rótulos das abas ficavam parcialmente cortados no limite inferior, sobretudo em telas menores. CAUSA: a barra de 66px reservava 19px em padding externo (9 superior + 10 inferior), deixando 47px úteis; o item vertical do React Navigation precisa de cerca de 52px (wrapper do ícone de 28px + rótulo de 14px + padding interno de 10px). CORREÇÃO: reduzir o padding externo para 7px superior e 5px inferior no Android/web (18px inferior no iOS) e permitir que os cinco itens encolham com flex:1, minWidth:0 e padding horizontal zero. COMO EVITAR: ao alterar a tab bar, calcular a soma completa das camadas internas do React Navigation e validar também a largura estreita; altura total isolada não garante que o conteúdo caiba.
