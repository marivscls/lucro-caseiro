---
id: e601fa5c-e004-4fb5-9cce-60aa65c9c17a
slug: auth
type: scar
title: Excluir conta e recriar com o mesmo e-mail travava o signup: linha órfã em public.users + UNIQUE(email)
tags: signup, exclusao-conta, orfao, unique-email, trigger, supabase
provenance: observado
evidence: Relato + screenshot da usuária 2026-07-08 ("Exclui e tentei criar a mesma conta novamente" → Ops! do trigger). Fix: packages/database/src/migrations/030_signup_selfheal_orphan.sql, commit 0e560be. Contexto: account.usecases.ts:19-22 (ordem auth→dados).
decay: stable
created: 2026-07-08T22:39:19.135848100+00:00
updated: 2026-07-08T22:39:19.135848100+00:00
validated: 2026-07-08T22:39:19.135848100+00:00
links: 
---

SINTOMA (2026-07-08): usuária excluiu a conta no app e tentou recriar com o MESMO e-mail → "Ops! Não consegui preparar sua conta no banco" (trigger abortando o signup). O primeiro cadastro do dia tinha funcionado — o erro só voltou após excluir+recriar.

CAUSA: `deleteAccount` (apps/api/src/features/account/account.usecases.ts) apaga o Auth user PRIMEIRO e a linha de `public.users` depois (ordem proposital — Auth é a operação mais frágil). Se falhar no meio, sobra linha ÓRFÃ em public.users. Como `email` é UNIQUE, o novo signup (novo uuid, mesmo e-mail) colide no INSERT do `handle_new_user` → Auth aborta com "Database error saving new user". O e-mail fica preso PRA SEMPRE.

CORREÇÃO (migration `packages/database/src/migrations/030_signup_selfheal_orphan.sql`): o trigger se AUTO-CURA — antes do INSERT, deleta qualquer linha de public.users com o mesmo e-mail cujo id não existe mais em auth.users (órfã = inalcançável = seguro remover, cascateia os dados restantes). Cobre qualquer causa de órfão, sem SQL manual.

LIÇÕES: (1) fluxo de exclusão multi-etapa SEMPRE deixa órfão em alguma ordem — a defesa robusta é auto-cura no ponto de recriação, não a ordem das etapas; (2) teste de exclusão de conta deve incluir "excluir → recriar com o mesmo e-mail"; (3) esse erro de signup tem DUAS causas conhecidas: trigger ausente/desatualizado (ver [[cadastro-por-e-mail-depende-do-trigger-handle-new]]) e órfã por exclusão (esta) — diagnosticar com SELECT em auth.users + public.users pelo e-mail.
