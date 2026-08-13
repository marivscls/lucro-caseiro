---
id: e3feebb4-5649-4e8e-9f84-1d4fccf7b03f
slug: auth
type: scar
title: Login por e-mail deve mapear códigos do Supabase e capturar falhas de transporte
tags: login, supabase, error-handling, network, mobile, pwa
provenance: observado
evidence: apps/mobile/src/shared/hooks/use-auth.ts; apps/mobile/src/shared/hooks/use-auth.test.ts; fonte @supabase/auth-js 2.110.2; 11 testes de auth, typecheck e lint aprovados em 2026-08-11
decay: stable
created: 2026-08-11T17:35:59.828195800+00:00
updated: 2026-08-11T17:35:59.828195800+00:00
validated: 2026-08-11T17:35:59.828195800+00:00
links:
---

SINTOMA (2026-08-11): o login exibia apenas “Ops! Erro ao entrar. Tente novamente.” para qualquer falha que não contivesse duas frases inglesas específicas. CAUSA: `signInWithEmail` comparava apenas `error.message` e não tratava exceções; o Auth JS 2.110.2 fornece códigos estáveis como `invalid_credentials` e `email_not_confirmed`, enquanto falhas de rede podem chegar como `AuthRetryableFetchError`, status 0 ou exceção sem mensagem. CORREÇÃO: mapear primeiro `error.code`, usar mensagem só como compatibilidade, distinguir credenciais, confirmação, rate limit e conexão, manter fallback amigável e capturar rejeições. PREVENÇÃO: testes de login devem cobrir código com mensagem inesperada, erro de transporte `{}` e promise rejeitada; detalhes técnicos ficam apenas no log de desenvolvimento.
