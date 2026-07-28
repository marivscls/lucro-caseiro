---
id: adf7515e-fae8-4394-be7b-ea09824869cc
slug: ui
type: scar
title: Adicionar pedido: duração do serviço não pode estourar a linha no desktop
tags: pedidos, servicos, desktop, modal, formulario, input, flexbox, overflow
provenance: dito
evidence: Captura e pedido da usuária em 2026-07-26; apps/mobile/src/features/orders/components/order-form.tsx; ESLint direcionado, pnpm --filter @lucro-caseiro/mobile typecheck e build:pwa:caseiro aprovados
decay: stable
created: 2026-07-26T03:54:05.501939500+00:00
updated: 2026-07-26T03:54:05.501939500+00:00
validated: 2026-07-26T03:54:05.501939500+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-26): na tela grande, a linha de cadastro rápido de serviço deixava os campos “Novo serviço” e “Minutos” com larguras intrínsecas equivalentes; somados ao botão “Cadastrar serviço”, eles ultrapassavam o modal de 560 px e cortavam o conteúdo à direita. IMPLEMENTAÇÃO CANDIDATA: somente no desktop, envolver o nome em um contêiner `flex: 1` com `minWidth: 0` e limitar a duração a 144 px; no layout compacto, preservar o empilhamento original. REGRA: em linhas de modal com campo textual, campo numérico e ação, o campo textual absorve o espaço restante e o campo numérico recebe largura compacta explícita. STATUS: ESLint direcionado, typecheck mobile e build PWA verdes; aguarda validação visual da usuária.
