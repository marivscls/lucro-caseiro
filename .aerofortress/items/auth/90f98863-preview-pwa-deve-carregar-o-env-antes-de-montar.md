---
id: 90f98863-9a1c-494b-b063-f93f2765b89d
slug: auth
type: scar
title: Preview PWA deve carregar o .env antes de montar a CSP
tags: pwa, preview, csp, env, supabase, api, login
provenance: observado
evidence: apps/mobile/scripts/serve-pwa.mjs; antes da correção header CSP de http://localhost:8083 mostrou apiAllowed=False/supabaseAllowed=False; depois da correção e reinício mostrou ambos True e HTTP 200
decay: stable
created: 2026-08-11T17:43:30.845438700+00:00
updated: 2026-08-11T17:45:29.906279500+00:00
validated: 2026-08-11T17:45:29.906279500+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-11): após reiniciar `preview:pwa:caseiro` para atualizar a tela de login, o app passou a mostrar “Ops! Não foi possível conectar. Verifique sua internet e tente novamente.” CAUSA CONFIRMADA: `apps/mobile/scripts/serve-pwa.mjs` montava `connect-src` com `process.env.EXPO_PUBLIC_API_URL` e `EXPO_PUBLIC_SUPABASE_URL`, mas o processo reiniciado via pnpm não carregava `apps/mobile/.env`; a resposta HTTP tinha `connect-src 'self'` sem API/Supabase, bloqueando autenticação no navegador. CORREÇÃO CANÔNICA: o servidor carrega `.env` pela stdlib `loadEnvFile` antes de construir a CSP, sem sobrescrever variáveis já injetadas; ausência de `.env` continua aceita em ambientes com configuração externa. Após reinício, o header HTTP confirmou os origins da API e do Supabase. REGRA: validar esses dois origins no `Content-Security-Policy` e um fluxo real de autenticação após reiniciar o preview.
