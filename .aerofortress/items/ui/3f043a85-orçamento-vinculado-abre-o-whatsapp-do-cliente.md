---
id: 3f043a85-cf0a-4063-a094-e737a2fa215d
slug: ui
type: fact
title: Orçamento vinculado abre o WhatsApp do cliente
tags: orcamentos, whatsapp, clientes, mobile
provenance: observado
evidence: apps/mobile/src/app/quotes.tsx; apps/mobile/src/features/quotes/components/quote-form.tsx; apps/mobile/src/features/clients/components/client-picker-modal.tsx; apps/mobile/src/features/orders/components/order-form.tsx; ESLint e typecheck mobile aprovados; 294 testes mobile aprovados em 2026-07-13
decay: stable
created: 2026-07-13T20:37:13.993023400+00:00
updated: 2026-07-13T20:37:13.993023400+00:00
validated: 2026-07-13T20:37:13.993023400+00:00
links:
---

Nos detalhes do orçamento, “Enviar no WhatsApp” carrega o cliente por `quote.clientId` e abre `wa.me` diretamente no telefone válido com a mensagem do orçamento; sem cliente vinculado ou sem telefone válido, preserva o compartilhamento sem destinatário. O formulário de orçamento permite selecionar um cliente cadastrado e persiste `clientId`, mantendo o nome livre para clientes avulsos. O modal de seleção foi extraído de Encomendas para o componente canônico compartilhado de Clientes.
