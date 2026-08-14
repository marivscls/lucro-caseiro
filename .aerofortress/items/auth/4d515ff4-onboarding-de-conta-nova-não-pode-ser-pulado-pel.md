---
id: 4d515ff4-e995-4d5d-9146-8467623f3b8f
slug: auth
type: scar
title: Onboarding de conta nova não pode ser pulado pelo login, pelo perfil nem pela confirmação de e-mail
tags: auth, onboarding, signup, email-confirmation, google, routing, metadata
provenance: observado
evidence: apps/mobile/src/app/index.tsx; apps/mobile/src/shared/hooks/use-auth.ts; apps/mobile/src/shared/hooks/use-onboarding.ts; apps/mobile/src/shared/utils/new-account.ts; apps/mobile/src/shared/utils/new-account.test.ts; 26 testes auth/onboarding, lint, typecheck e bundle Android Metro HTTP 200 em 2026-08-13
decay: stable
created: 2026-06-26T13:45:19.696663200+00:00
updated: 2026-08-14T00:27:37.966682+00:00
validated: 2026-08-14T00:27:37.966682+00:00
links:
---

Três bugs irmãos no controle de quando mostrar o onboarding. (1) Login não pode marcar onboarding como concluído. (2) Campo opcional de perfil não pode servir como prova de primeiro acesso. (3) Janela de tempo e estado local não sobrevivem com segurança à confirmação por e-mail nem à troca de aparelho. CORREÇÃO CANÔNICA: cadastro por e-mail grava `user_metadata.onboarding_completed=false`; a função pura `onboardingDestination` dá precedência a essa marca persistente sobre qualquer conclusão local deixada por outra sessão, usa `pendingUserIds` e `created_at` como fallback para confirmação de e-mail, Google ou contas legadas, e a última etapa atualiza a metadata para `true` antes de liberar o app. Regra: conta explicitamente pendente sempre vê onboarding, conta explicitamente concluída nunca o repete, login não altera esse estado e conta Google recém-criada sem metadata entra pelo fallback de `created_at`. Em 2026-08-13 foram adicionadas regressões específicas para esses quatro cenários.
