---
id: 4d515ff4-e995-4d5d-9146-8467623f3b8f
slug: auth
type: scar
title: Onboarding: sumia em conta nova E podia revoltar depois de concluído
tags: auth, onboarding, mobile
provenance: observado
evidence: commits bbaf8ce, 0bb5aff; apps/mobile/src/shared/hooks/use-onboarding.ts, apps/mobile/src/app/index.tsx, apps/mobile/src/app/onboarding.tsx, apps/mobile/src/shared/hooks/use-auth.ts
decay: stable
created: 2026-06-26T13:45:19.696663200+00:00
updated: 2026-06-26T13:52:35.873819300+00:00
validated: 2026-06-26T13:52:35.873819300+00:00
links: 
---

Dois bugs irmãos no controle de quando mostrar o onboarding (`apps/mobile/src/app/index.tsx` é a fonte da verdade: mostra se `!completed && !completedUserIds.includes(userId) && !profile.businessName`).

**Bug 1 — não aparecia em conta nova:** `signInWithEmail` chamava `completeOnboarding()` em TODO login, e `signInWithGoogle` tinha flag `completeOnboardingForExistingAccount` (login passava `true`). Marcava `completed=true` → pulava o onboarding de conta nova que entrava por "Entrar". CORRIGIDO removendo esses efeitos colaterais da camada de auth (commit bbaf8ce).

**Bug 2 — podia voltar depois de concluído:** o passo do nome do negócio tem "Pular por enquanto" (`onNext("")` → businessName NÃO salvo) e `persistProfile` é fire-and-forget (`.catch(()=>{})`, tolera offline). Como `signOut` faz `reset()` (zera `completed`), quem concluía pulando o nome via o onboarding DE NOVO no relogin. CORRIGIDO (commit 0bb5aff) com `completedUserIds: string[]` no use-onboarding (persistido em SecureStore, NÃO apagado no signOut): `completeOnboarding(userId)` registra a conta; index.tsx pula se a conta está na lista. `businessName` do servidor continua como proxy cross-device.

**Regra:** decisão de mostrar/pular onboarding mora no roteamento (index.tsx), NUNCA como side-effect de signIn. A garantia "concluiu → nunca mais vê" precisa de memória por-conta que sobreviva ao signOut (completedUserIds), porque `completed` é de sessão e businessName pode não ter sido salvo (passo pulável/offline).
