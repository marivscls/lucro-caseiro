---
id: d790581a-359b-4aea-bf1b-b7b880211519
slug: ui
type: scar
title: Abrir o WhatsApp não significa que o orçamento foi enviado
tags: orcamentos, whatsapp, status, pending, enviado, ux, correcao
provenance: dito
evidence: Correção da usuária nesta conversa em 2026-07-25; apps/mobile/src/app/quotes.tsx; apps/mobile/src/features/quotes/components/quote-form.tsx; apps/api/src/features/quotes/quotes.usecases.ts; packages/database/src/migrations/042_quote_lifecycle.sql
decay: stable
created: 2026-07-26T01:00:16.855506500+00:00
updated: 2026-07-26T01:00:16.855506500+00:00
validated: 2026-07-26T01:00:16.855506500+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): abrir o WhatsApp com a mensagem do orçamento não comprova que a pessoa tocou em Enviar; portanto essa ação nunca deve mudar automaticamente o status do orçamento. COMPORTAMENTO CANÔNICO RESTAURADO: o orçamento é salvo diretamente como `pending` (rótulo “Aguardando”), abrir WhatsApp apenas abre/compartilha a mensagem e o status só muda quando há uma ação confirmada de aprovação ou recusa. Não reintroduzir os estados automáticos `draft`/`sent` baseados na abertura do app externo.
