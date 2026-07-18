---
id: 321f8aa0-3037-4095-8879-9445dbc529b8
slug: auth
type: scar
title: OAuth Google no PWA: popup intermediário pode deixar o login preso
tags: oauth, google, pwa, supabase, redirect, expo-web-browser
provenance: observado
evidence: apps/mobile/src/shared/hooks/use-auth.ts; apps/mobile/src/shared/hooks/use-auth.test.ts; apps/mobile/src/test/setup.ts; 333 testes, typecheck, lint e build web aprovados em 2026-07-16
decay: stable
created: 2026-07-17T01:32:17.127844600+00:00
updated: 2026-07-17T02:17:00.217456400+00:00
validated: 2026-07-17T02:17:00.217456400+00:00
links: 
---

SINTOMA (2026-07-16): na tela web de login, o botão Google ficava em loading enquanto uma janela separada permanecia no seletor de contas ou não devolvia a sessão ao PWA. A primeira correção tentou adaptar `expo-web-browser` ao navegador com `window.location.origin`, `maybeCompleteAuthSession()` e loaders separados, mas o login real continuou preso. CAUSA: o web usava `skipBrowserRedirect: true` e adicionava um handshake de popup do Expo sobre o fluxo OAuth que o próprio Supabase já sabe redirecionar no navegador; o app ficava dependente de `postMessage`, estado em localStorage e fechamento da janela. CORREÇÃO: em `Platform.OS === "web"`, chamar `signInWithOAuth` com `skipBrowserRedirect: false`, deixando o Supabase redirecionar a própria aba e retornar à raiz; manter `openAuthSessionAsync` apenas no nativo. A raiz aplica code/tokens da URL com `applySessionFromUrl`. COMO EVITAR: no PWA, preferir o redirecionamento OAuth nativo do SDK web; não reutilizar automaticamente o mecanismo de sessão browser-in-app do Android/iOS. Cada origem publicada ainda precisa estar na allowlist de Redirect URLs do Supabase. A validação final continua exigindo um login humano completo até o app autenticado.
