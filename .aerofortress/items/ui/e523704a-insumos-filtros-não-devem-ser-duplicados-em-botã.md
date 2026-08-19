---
id: e523704a-87e5-47ee-800e-3fabd982a1ea
slug: ui
type: scar
title: Insumos: filtros não devem ser duplicados em botão e chips
tags: insumos, filtros, redundancia, hierarquia, mobile, pwa
provenance: dito
evidence: Correção da usuária em 2026-08-18; apps/mobile/src/app/materials.tsx; bundle entry-68e8ecca4c3e20945a33fec3d9098f8f.js; .aerofortress/materials-spacing-390.png validada em 390x844 sem overflow horizontal e sem erros de console
decay: stable
created: 2026-08-19T01:22:57.919002800+00:00
updated: 2026-08-19T02:14:51.415623700+00:00
validated: 2026-08-19T02:14:51.415623700+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-18): depois de tornar visível a rolagem da faixa Todos / Estoque baixo / Atenção / Categorias, ficou evidente que a faixa inteira era redundante porque a tela já possui o botão de filtros no cabeçalho. TENTATIVAS ANTERIORES INSUFICIENTES: manter chips em carrossel invisível, adicionar trilho de rolagem e cogitar quebra de linha trataram apenas o sintoma de overflow, não a duplicação de controles. CORREÇÃO CANÔNICA: remover a faixa de chips e o segundo botão ao lado da busca; manter somente o botão do cabeçalho, que abre o modal completo e usa fundo `softRose` quando há filtro ativo. A busca passa a ocupar a largura inteira. COMO EVITAR: antes de corrigir overflow em uma faixa de filtros, verificar se ela repete outro controle já presente na mesma hierarquia; neste caso, simplificar a interface em vez de acomodar a duplicação.
