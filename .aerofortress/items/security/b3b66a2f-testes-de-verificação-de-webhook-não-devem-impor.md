---
id: b3b66a2f-ef24-4233-ba94-ff0e83f9b704
slug: security
type: scar
title: Testes de verificação de webhook não devem importar o bootstrap/config da API
tags: security, tests, stripe
provenance: observado
evidence: apps/api/src/features/payments/stripe.webhook.ts; apps/api/src/features/payments/stripe.routes.test.ts; vitest em 2026-08-04
decay: stable
created: 2026-08-04T12:31:08.077621700+00:00
updated: 2026-08-04T12:31:08.077621700+00:00
validated: 2026-08-04T12:31:08.077621700+00:00
links:
---

SINTOMA: o novo teste de assinatura Stripe importou `stripe.routes.ts`; a cadeia de imports chegou a `auth.ts`/`config.ts`, que executou validação de ambiente e encerrou o processo por falta de DATABASE_URL/Supabase, deixando 678 testes aprovados mas uma suíte falha. CORREÇÃO: extrair `buildStripeEvent` e o contrato mínimo para `stripe.webhook.ts`, módulo puro sem bootstrap, e testar esse limite diretamente. COMO EVITAR: testes de primitivas de segurança importam módulos puros; rotas/bootstrap só entram em testes que controlam explicitamente o ambiente e dependências.
