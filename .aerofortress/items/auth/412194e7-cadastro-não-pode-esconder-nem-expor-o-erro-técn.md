---
id: 412194e7-ee62-416d-82ec-6199a22e1739
slug: auth
type: scar
title: Cadastro não pode esconder nem expor o erro técnico do Supabase
tags: signup, supabase, mobile, pwa, error-handling, network, debug
provenance: observado
evidence: Screenshot/correção da usuária em 2026-07-25; apps/mobile/src/shared/hooks/use-auth.ts; apps/mobile/src/shared/hooks/use-auth.test.ts; fonte @supabase/auth-js 2.110.2 src/lib/fetch.ts; 8 testes de auth e typecheck passaram
decay: stable
created: 2026-06-30T01:06:22.442195+00:00
updated: 2026-07-25T15:43:38.049992400+00:00
validated: 2026-07-25T15:43:38.049992400+00:00
links:
---

SINTOMAS OBSERVADOS: (1) em 2026-06-29, o cadastro convertia quase qualquer falha do Supabase em erro genérico, impedindo distinguir e-mail existente, senha, rate limit, SMTP ou trigger; (2) em 2026-07-25, o fallback oposto expôs `Não foi possível criar a conta: {}` para a usuária. A origem do `{}` foi confirmada no fonte do `@supabase/auth-js` 2.110.2: falhas de fetch sem `message` viram `AuthRetryableFetchError` cuja mensagem é `JSON.stringify(error)`, podendo resultar em `{}`.

CORREÇÃO CANÔNICA: mapear primeiro `code`, depois mensagem/status/nome; tratar `AuthRetryableFetchError`, status 0, mensagem vazia ou `{}` como falha de conexão; nunca concatenar mensagem desconhecida no alerta; capturar também exceções lançadas por `signUp`; manter `code/message/name/status` apenas no log de desenvolvimento. E-mail existente, senha fraca, e-mail inválido, rate limit e indisponibilidade continuam com mensagens próprias.

PREVENÇÃO: toda mudança em signup precisa de testes para código conhecido, erro de transporte vazio e exceção sem mensagem. O usuário recebe uma ação clara; detalhes técnicos ficam no diagnóstico, nunca no modal.
