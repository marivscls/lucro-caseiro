---
id: adf7515e-fae8-4394-be7b-ea09824869cc
slug: ui
type: scar
title: Adicionar pedido: duração do serviço não pode estourar a linha no desktop
tags: pedidos, servicos, desktop, modal, formulario, input, flexbox, overflow, responsivo
provenance: dito
evidence: Captura da usuária em 2026-07-29 (35df506d-cee7-48ae-8ebb-bf8f8d5158c3.png); apps/mobile/src/features/orders/components/order-form.tsx; ESLint mobile, typecheck, 414 testes e build PWA aprovados
decay: stable
created: 2026-07-26T03:54:05.501939500+00:00
updated: 2026-07-29T11:44:07.646980100+00:00
validated: 2026-07-29T11:44:07.646980100+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-07-26 e 2026-07-29): na tela grande, a linha de cadastro rápido de serviço ultrapassava o modal e cortava o botão à direita. PRIMEIRA CORREÇÃO INSUFICIENTE: limitar apenas o campo de minutos não resolveu a causa, porque o formulário completo continuou dentro da superfície padrão de 560 px e manteve uma composição de coluna mobile. CORREÇÃO CANÔNICA: `OrderForm` deve usar o `StandardModal` largo (1040 px) no desktop; separar imagem e serviço em zonas lado a lado; manter o nome do serviço com `flex: 1` e `minWidth: 0`, duração com largura explícita de 152 px e ação com largura mínima contida; identificar a duração do atendimento para não confundi-la com o cadastro rápido; e usar rodapé desktop com Cancelar + Salvar alinhados à direita. No mobile/PWA compacto, preservar o empilhamento e a proteção de teclado. REGRA: corrigir o contêiner e a composição inteira antes de ajustar somente um filho que estoura.
