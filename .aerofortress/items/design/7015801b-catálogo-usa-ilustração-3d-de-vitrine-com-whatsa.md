---
id: 7015801b-c51e-40c4-a6b3-10365d9a718c
slug: design
type: decision
title: Catálogo usa ilustração 3D de vitrine com WhatsApp no hero
tags: catalogo, ui, asset, png, status, cta
provenance: dito
evidence: apps/mobile/src/app/catalog.tsx; apps/mobile/src/assets/catalog-hero.png
decay: stable
created: 2026-07-25T19:16:02.583918200+00:00
updated: 2026-07-25T19:24:38.390020900+00:00
validated: 2026-07-25T19:24:38.390020900+00:00
links:
---

A usuária escolheu a ilustração 3D de uma vitrine online com preço, carrinho e WhatsApp para substituir a antiga casinha no topo da tela Catálogo e pediu destaque maior após a primeira aplicação. O asset canônico é `apps/mobile/src/assets/catalog-hero.png`; ele é exclusivo do Catálogo para que `auth-house.png`, compartilhado pelo logo da marca, permaneça inalterado. A renderização usa `contain` em 300×200. No mesmo hero, o selo `Catálogo desativado` usa a variante semântica vermelha `danger` e fica centralizado; o estado ativo continua `success`. No estado desativado, o card contém somente a lista de benefícios. O CTA `Ativar meu catálogo` fica fora e abaixo do card, separado por `spacing["5xl"]` (48 px) para aproveitar o espaço livre, em largura total, tamanho `lg` e altura mínima de 56 px; a frase de gratuidade acompanha o CTA fora do card.
