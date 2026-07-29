---
id: 38978e25-64dc-4d7f-a107-008fa80c1d21
slug: backend
type: scar
title: Encomendas duplicadas: cada salvamento precisa de chave idempotente
tags: agenda, encomendas, idempotência, duplo-submit
provenance: dito
evidence: apps/mobile/src/features/orders/components/order-form.tsx; apps/mobile/src/features/orders/request-id.ts; apps/api/src/features/orders/orders.repo.pg.ts; apps/api/src/features/orders/orders.repo.pg.test.ts; validação local em 2026-07-29: typecheck, lint, build PWA e 1.089 testes aprovados
decay: stable
created: 2026-07-29T12:32:57.568588900+00:00
updated: 2026-07-29T12:32:57.568588900+00:00
validated: 2026-07-29T12:32:57.568588900+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-29): ao salvar um atendimento, itens repetidos apareceram na Agenda.

CAUSA: o estado assíncrono `isPending` só desabilita o botão após um novo render; dois acionamentos rápidos podiam disparar dois POSTs, e a criação de encomenda não tinha chave idempotente.

CORREÇÃO: o `OrderForm` usa uma trava síncrona com `useRef` e gera um UUID por tentativa. O contrato aceita `requestId`, usado pela API como `orders.id`; o Postgres executa `ON CONFLICT DO NOTHING` e a API recupera/devolve a encomenda já criada. Assim, duplo toque e reenvio da mesma requisição retornam o mesmo registro.

Não deduplicar por título, data ou serviço, pois dois atendimentos legítimos podem ter conteúdo igual.

REGRA: toda criação acionada pela UI precisa de bloqueio imediato e idempotência no backend/banco, com teste explícito do caminho de conflito.
