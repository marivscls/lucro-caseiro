---
id: 035efe95-ff91-4e65-936f-570634f66c3f
slug: ui
type: scar
title: Preview PWA precisa ser reconstruído e reiniciado após mudança visual
tags: login, runtime, pwa, preview, validacao-visual, cache, build
provenance: observado
evidence: apps/mobile/src/app/(auth)/login.tsx; apps/mobile/scripts/serve-pwa.mjs; build PWA e reinício da porta 8083 em 2026-08-11; bundle HTTP entry-edc2e5447550c387c3718164a2590c3a.js sem o subtítulo; DOM headless mostra “Que bom te ver!” sem a frase
decay: stable
created: 2026-08-11T17:33:36.749964900+00:00
updated: 2026-08-11T17:37:24.301808600+00:00
validated: 2026-08-11T17:37:24.301808600+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-11): após remover o subtítulo “Seu negócio organizado, do orçamento ao lucro.” de `apps/mobile/src/app/(auth)/login.tsx` e validar lint/typecheck, a tela exibida continuou mostrando o texto. CAUSA CONFIRMADA: a usuária estava vendo o preview PWA estático da porta 8083; `serve-pwa.mjs` serve `dist/lucro-caseiro` e mantém o `index.html` lido no startup, portanto editar o fonte não atualiza a tela nem reiniciar apenas o bundle basta. CORREÇÃO: executar `pnpm --filter @lucro-caseiro/mobile build:pwa:caseiro` e reiniciar o processo `preview:pwa:caseiro`; validar a página realmente servida em navegador/DOM e o bundle HTTP. REGRA: para mudanças visuais nesse preview, não declarar conclusão só por busca no fonte, lint ou typecheck.
