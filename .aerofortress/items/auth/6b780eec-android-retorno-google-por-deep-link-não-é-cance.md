---
id: 6b780eec-06a2-450e-95c1-5de6899519a3
slug: auth
type: scar
title: Android: retorno Google por deep link não é cancelamento do login
tags: android, google, oauth, deep-link, expo-web-browser, login
provenance: dito
evidence: Captura enviada pela usuária em 2026-08-13; apps/mobile/src/shared/hooks/use-auth.ts; apps/mobile/src/shared/hooks/use-auth.test.ts; fonte expo-web-browser 15.0.11; 27 testes auth/onboarding, lint, typecheck e bundle Android Metro HTTP 200
decay: stable
created: 2026-08-14T00:58:22.193440100+00:00
updated: 2026-08-14T00:58:22.193440100+00:00
validated: 2026-08-14T00:58:22.193440100+00:00
links:
---

SINTOMA (2026-08-13): a usuária escolheu/criou uma conta no Google pelo development build Android, o Supabase criou a identidade, mas ao voltar ao app apareceu `Ops! Login cancelado.` CAUSA: no Android, `expo-web-browser` implementa `openAuthSessionAsync` como corrida entre o retorno do app ao estado ativo e o evento de deep link. O estado ativo pode vencer e produzir `dismiss/cancel` antes de a URL chegar; o código aguardava apenas polling da sessão e transformava esse fechamento técnico em cancelamento humano. CORREÇÃO: registrar um listener próprio de callback antes de abrir o navegador, aguardar e aplicar explicitamente a URL `lucrocaseiro://auth/callback`, consultar a sessão como fallback e só então reportar falha; remover a mensagem falsa de cancelamento. COMO EVITAR: em OAuth nativo, o callback/deep link e a sessão são as fontes de verdade; nunca inferir cancelamento somente de `dismiss/cancel` do navegador. A validação automatizada deve reproduzir `dismiss` seguido do callback.
