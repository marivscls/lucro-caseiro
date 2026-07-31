---
id: 6eca7053-d3c8-41ea-a4c0-fbb304958a62
slug: ui
type: scar
title: Solicitações de serviço: ações precisam parecer botões
tags: servicos, solicitacoes, botoes, affordance, status, whatsapp, mobile
provenance: dito
evidence: Relato e captura da usuária em 2026-07-31; apps/mobile/src/features/services/components/service-dashboard-modal.tsx; Prettier, ESLint, typecheck, build PWA e 418 testes móveis aprovados
decay: stable
created: 2026-07-31T20:41:54.184949900+00:00
updated: 2026-07-31T20:41:54.184949900+00:00
validated: 2026-07-31T20:41:54.184949900+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-31): no painel de uma solicitação de horário, “Chamar no WhatsApp”, “Contato feito”, “Confirmar” e “Recusar” apareciam como textos soltos porque eram Chips sem borda sobre uma superfície da mesma cor. CORREÇÃO: tratar WhatsApp como CTA contornado com ícone; separar os estados sob “Atualizar status”; manter os Chips canônicos com borda permanente, largura responsiva e variantes semânticas info/success/danger no estado selecionado. COMO EVITAR: ações operacionais em cards não podem depender apenas de texto ou do estado selecionado para ter affordance; o estado não selecionado também precisa mostrar limite/área clicável.
