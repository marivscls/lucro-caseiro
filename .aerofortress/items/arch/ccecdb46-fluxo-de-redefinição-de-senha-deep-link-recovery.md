---
id: ccecdb46-f439-44cc-99f2-b3e9fe79fb6a
slug: arch
type: decision
title: Fluxo de redefinição de senha: deep link recovery (lucrocaseiro://) + tela app/reset-password.tsx
tags: 
provenance: observado
evidence: apps/mobile/src/app/reset-password.tsx; use-auth.ts (passwordRecovery + getAuthRedirectUrl exportado + handleUrl detecta type=recovery); login.tsx (resetPasswordForEmail com redirectTo); _layout.tsx (Stack.Screen reset-password + effect router.replace); commit 259b87e
decay: stable
created: 2026-06-26T12:58:22.593340900+00:00
updated: 2026-06-26T12:58:22.593340900+00:00
validated: 2026-06-26T12:58:22.593340900+00:00
links: 
---

FLUXO COMPLETO (código pronto, commit 259b87e):

1. Login "Esqueci senha" → `resetPasswordForEmail(email, { redirectTo: getAuthRedirectUrl() })` (= `EXPO_PUBLIC_AUTH_REDIRECT_URL` = `lucrocaseiro://`, MESMA URL do OAuth Google, já allowlistada no Supabase).
2. E-mail "Reset Password" → link redireciona pra `lucrocaseiro://#access_token=...&type=recovery`. O `applySessionFromUrl` (use-auth) seta a sessão; `handleUrl` detecta `type=recovery` e seta `passwordRecovery=true` no store.
3. `_layout` (AppContent) tem effect: `passwordRecovery && introDone → router.replace("/reset-password")`. Rota top-level `app/reset-password.tsx` (registrada no Stack), fora do gating de auth.
4. Tela `reset-password.tsx`: 2 campos (nova senha + confirmar, min 8), `supabase.auth.updateUser({ password })` → on success: `clearPasswordRecovery()` + `signOut()` + volta pro login.
   PENDENTE NO PAINEL SUPABASE (usuária faz; MCP é de outra conta): (a) Authentication→Emails→template "Reset Password" (HTML PT-BR/marca já entregue no chat); (b) confirmar `lucrocaseiro://` em URL Configuration→Redirect URLs; (c) opcional/recomendado prod: SMTP próprio (lucrocaseiro.com.br) pra sair do remetente noreply@mail.app.supabase.io (limite ~3-4/h). PRECISA BUILD NOVO (ou dev client via Metro) pra a tela existir. Ver [[catalogo-dominio-proprio]] / build em [[dev-build-metro-8082]].
