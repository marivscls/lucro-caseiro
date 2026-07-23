---
id: 4d515ff4-e995-4d5d-9146-8467623f3b8f
slug: auth
type: scar
title: Onboarding de conta nova não pode ser pulado pelo login, pelo perfil nem pela confirmação de e-mail
tags: auth, onboarding, signup, email-confirmation, routing, metadata
provenance: observado
evidence: apps/mobile/src/app/index.tsx; apps/mobile/src/shared/hooks/use-auth.ts; apps/mobile/src/shared/hooks/use-onboarding.ts; apps/mobile/src/shared/utils/new-account.ts; correção reafirmada pela usuária em 2026-07-22
decay: stable
created: 2026-06-26T13:45:19.696663200+00:00
updated: 2026-07-23T00:05:00.861972400+00:00
validated: 2026-07-23T00:05:00.861972400+00:00
links:
---

Três bugs irmãos no controle de quando mostrar o onboarding. (1) Login não pode marcar onboarding como concluído. (2) Campo opcional de perfil não pode servir como prova de primeiro acesso. (3) Janela de tempo e estado local não sobrevivem com segurança à confirmação por e-mail nem à troca de aparelho. CORREÇÃO CANÔNICA (2026-07-22): cadastro por e-mail grava `user_metadata.onboarding_completed=false`; o roteamento dá precedência a essa marca persistente e usa `pendingUserIds`/`created_at` apenas como fallback para contas Google ou legadas; a última etapa atualiza a metadata para `true` antes de liberar o app. Regra: conta explicitamente pendente sempre vê onboarding, conta explicitamente concluída nunca o repete, e login não altera esse estado.
