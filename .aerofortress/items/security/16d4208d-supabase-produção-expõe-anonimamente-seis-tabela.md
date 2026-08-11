---
id: 16d4208d-44b4-4243-8b9e-f5b29f2306d4
slug: security
type: fact
title: Supabase produção expõe anonimamente seis tabelas da migration 045
tags: supabase, rls, postgrest, security, privacy, migration-045
provenance: observado
evidence: packages/database/src/migrations/045_service_business_suite.sql:21-165; packages/database/src/schema/operations.ts:83-236; probes HTTPS contra ujwxvpceqigvyxcqolch.supabase.co em 2026-08-08; `pnpm security:secrets`
decay: volatile
created: 2026-08-08T21:33:27.667998+00:00
updated: 2026-08-08T21:33:27.667998+00:00
validated: 2026-08-08T21:33:27.667998+00:00
links:
---

Auditoria read-only em 2026-08-08 usando a chave publicável do app confirmou que `service_variations`, `service_add_ons`, `service_packages`, `service_package_purchases`, `service_package_session_usages` e `public_service_booking_requests` estão acessíveis pelo PostgREST como `anon`. Nas seis, POST com corpo inválido alcançou a validação (400), e PATCH/DELETE contra UUID inexistente retornaram 204, confirmando privilégios anônimos de INSERT/UPDATE/DELETE sem alterar linhas. `public_service_booking_requests` também devolveu linhas anonimamente e contém nome, telefone, data, horário e observações do cliente, tornando o achado crítico. A migration 045 cria as tabelas sem habilitar RLS/revogar grants. Em contraste, probe autenticado em 47 tabelas encontrou zero linhas de outras contas em 44; as únicas visíveis foram booking requests, service add-ons e variations. O scanner de segredos passou e nenhuma service-role key está no frontend.
