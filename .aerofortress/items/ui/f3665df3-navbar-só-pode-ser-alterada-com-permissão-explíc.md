---
id: f3665df3-b632-4ea9-834a-a212cd2323af
slug: ui
type: scar
title: Navbar só pode ser alterada com permissão explícita da usuária
tags: navbar, navegacao-inferior, permissao, ui, mobile, regra
provenance: dito
evidence: Pedido explícito da usuária em 2026-08-16; componente apps/mobile/src/app/tabs/_layout.tsx
decay: stable
created: 2026-08-16T18:32:28.981513800+00:00
updated: 2026-08-16T18:32:28.981513800+00:00
validated: 2026-08-16T18:32:28.981513800+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-16): depois de ajustes de largura na tela de Vendas, a navegação inferior passou a cortar o item `Mais`. REGRA CANÔNICA: não alterar estrutura, dimensões, distribuição, estilos ou comportamento da navbar compartilhada sem permissão explícita da usuária. Quando uma tela apresentar problema de largura, corrigir os containers da própria tela e preservar a navbar. Se a usuária autorizar uma correção na navbar, limitar a mudança exatamente ao defeito solicitado e validar os cinco itens em viewport estreita.
