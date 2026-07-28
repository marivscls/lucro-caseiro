---
id: 920db46a-ada2-4b07-95f4-e4393d0429e7
slug: design
type: decision
title: Receitas usa composição ilustrada completa no estado vazio
tags: receitas, empty-state, ilustracao, beneficios, saiba-como-funciona, referencia-visual
provenance: dito
evidence: Referências visuais e PNGs enviados pela usuária em 2026-07-25; apps/mobile/src/assets/recipes-empty.png; apps/mobile/src/assets/recipes-how-it-works.png; apps/mobile/src/features/recipes/components/recipe-list.tsx
decay: stable
created: 2026-07-25T21:25:40.926654200+00:00
updated: 2026-07-25T21:56:10.849844+00:00
validated: 2026-07-25T21:56:10.849844+00:00
links:
---

O estado vazio canônico de Receitas começa com `recipes-empty.png` em `contain`, 220 px de altura e largura responsiva até 340 px. Abaixo ficam título, descrição, CTA rosa de pelo menos 188 px, o card branco de três benefícios com quebras de linha explícitas e, por último, o card clicável `Saiba como funciona`. Esse card usa `apps/mobile/src/assets/recipes-how-it-works.png` como miniatura à esquerda, título e descrição no centro e play circular rosa à direita; tocar nele abre a explicação do fluxo.
