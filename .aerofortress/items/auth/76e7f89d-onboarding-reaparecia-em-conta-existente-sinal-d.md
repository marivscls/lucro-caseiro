---
id: 76e7f89d-53a4-4c12-8435-d924454c6b8c
slug: auth
type: scar
title: Onboarding reaparecia em conta existente: sinal de "conta nova" não pode ser campo opcional (businessName)
tags: 
provenance: observado
evidence: apps/mobile/src/app/index.tsx; apps/mobile/src/shared/utils/new-account.ts
decay: stable
created: 2026-07-12T02:43:35.755578600+00:00
updated: 2026-07-12T02:43:35.755578600+00:00
validated: 2026-07-12T02:43:35.755578600+00:00
links: 
---

SINTOMA (2026-07-11): conta JÁ CADASTRADA viu o onboarding de novo ao voltar (após recuperar a senha, em aparelho/sessão sem histórico local). Onboarding só deve aparecer em conta nova.

CAUSA: o roteamento em `apps/mobile/src/app/index.tsx` decidia onboarding vs. app baseado SÓ em `profile.businessName` estar vazio. Mas "Nome do negócio" é OPCIONAL no cadastro (register.tsx) → conta existente sem esse campo era tratada como nova. Os outros guards (`completed` da sessão, `completedUserIds` por aparelho) não cobrem quem loga num aparelho novo.

CORREÇÃO: usar sinal confiável de "conta nova" = `user.created_at` do Supabase Auth. Função pura `isNewAccount(createdAt, now)` (shared/utils/new-account.ts, janela de 10min) — conta criada há mais que a janela = usuário retornando → vai direto pro app. Na dúvida (sem data) retorna false (não reexibe onboarding). Bônus: cobre o cadastro via Google, onde signInWithGoogle não distingue signup de login.

LIÇÃO: nunca inferir "conta nova/primeiro acesso" de um campo de perfil OPCIONAL. O único sinal robusto é a data de criação da conta no Auth (ou marcar a intenção no momento exato do signup).
