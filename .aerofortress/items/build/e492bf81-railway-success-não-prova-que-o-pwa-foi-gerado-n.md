---
id: e492bf81-96ff-48da-b3e3-d7c9da8b4e33
slug: build
type: scar
title: Railway SUCCESS não prova que o PWA foi gerado nem exposto
tags: railway, pwa, deploy, mobile, domain, env, port
provenance: observado
evidence: scripts/railway-service.mjs; apps/mobile/package.json; apps/mobile/scripts/serve-pwa.mjs; Railway @lucro-caseiro/mobile e domínio público em 2026-07-19
decay: stable
created: 2026-07-20T00:07:17.915344200+00:00
updated: 2026-07-20T00:15:02.219054500+00:00
validated: 2026-07-20T00:15:02.219054500+00:00
links:
---

SINTOMA (2026-07-19): após push, o Railway marcou `@lucro-caseiro/mobile` como SUCCESS, mas o serviço não tinha domínio, não possuía `EXPO_PUBLIC_API_URL`/Supabase e o dispatcher tratava todo serviço diferente de `web` como `api`; portanto o PWA não era gerado nem publicado de verdade. Depois da primeira correção, o deploy voltou a ficar SUCCESS, mas o domínio respondeu 502 porque apontava para 8083 enquanto o Railway injetou `PORT=8080`. CORREÇÃO: reconhecer explicitamente `@lucro-caseiro/mobile` no dispatcher, executar seu build PWA, iniciar o servidor estático com `PORT`, configurar as variáveis públicas, criar o domínio e apontar `targetPort` para a porta efetivamente anunciada no log. COMO EVITAR: validar deploy do PWA pelo domínio HTTP real (rota SPA + `sw.js`) e conferir envs públicas e porta; status SUCCESS isolado só prova que o container subiu.
