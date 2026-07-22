---
id: 4d515ff4-e995-4d5d-9146-8467623f3b8f
slug: auth
type: scar
title: Onboarding de conta nova não pode ser pulado pelo login, pelo perfil nem pela confirmação de e-mail
tags: auth, onboarding, signup, email-confirmation, routing
provenance: observado
evidence: apps/mobile/src/app/index.tsx; apps/mobile/src/shared/hooks/use-auth.ts; apps/mobile/src/shared/hooks/use-onboarding.ts; apps/mobile/src/shared/utils/new-account.ts; 354 testes, typecheck, lint e build PWA aprovados em 2026-07-22
decay: stable
created: 2026-06-26T13:45:19.696663200+00:00
updated: 2026-07-22T21:03:00.040340100+00:00
validated: 2026-07-22T21:03:00.040340100+00:00
links:
---

Três bugs irmãos no controle de quando mostrar o onboarding. (1) `signInWithEmail`/Google marcavam o onboarding como concluído em todo login, pulando-o para conta nova; corrigido removendo esse efeito colateral da autenticação. (2) quem concluía pulando o nome podia rever o fluxo depois, porque `completed` era só de sessão; corrigido com `completedUserIds`, persistido por conta/aparelho. (3) em 2026-07-22, uma conta realmente nova podia não ver o onboarding porque `index.tsx` testava `profile.businessName` antes de `user.created_at`; além disso, se o Supabase exigisse confirmação por e-mail, o cadastro levava ao login e a janela de 10 minutos podia expirar. Correção: dar precedência ao sinal de conta nova antes do perfil e registrar `pendingUserIds` no momento exato do signup real (`identities` não vazio), mantendo-o até `completeOnboarding(userId)`. Regra: a decisão de mostrar/pular onboarding mora no roteamento; login não conclui onboarding; campo opcional/preenchido de perfil não anula uma intenção explícita de primeiro acesso; confirmação por e-mail não pode apagar essa intenção.
