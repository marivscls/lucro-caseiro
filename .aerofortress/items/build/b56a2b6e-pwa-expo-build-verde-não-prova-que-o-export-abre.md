---
id: b56a2b6e-218b-4b7c-b4a0-7ed426e9ff74
slug: build
type: scar
title: PWA Expo: build verde não prova que o export abre nem instala offline
tags: pwa, expo, service-worker, web, zustand, offline, preview
provenance: observado
evidence: apps/mobile/scripts/generate-pwa-service-worker.mjs; apps/mobile/package.json; Chrome CDP em 2026-07-16: root renderizado com “Lucro Caseiro — Gestão para crescer”, zero exceções e service worker controlador ativo em http://localhost:8083
decay: stable
created: 2026-07-17T00:40:54.540450500+00:00
updated: 2026-07-17T01:14:16.860084100+00:00
validated: 2026-07-17T01:14:16.860084100+00:00
links: 
---

SINTOMA (2026-07-16): `expo export --platform web` concluía com sucesso, mas o artefato abria em branco no Chrome (`Cannot use 'import.meta' outside a module`) e o service worker não chegava a `ready` porque `cache.addAll` abortava toda a instalação quando um asset opcional retornava 404. CAUSA: o Expo injetou o bundle web como script clássico embora o Zustand empacotado preserve `import.meta`; o precache era transacional demais para assets opcionais. CORREÇÃO: o pós-build em `apps/mobile/scripts/generate-pwa-service-worker.mjs` marca o bundle como `type="module"`, faz cache individual tolerante a falhas opcionais e exige explicitamente `/index.html`. PARA PREVIEW LOCAL: usar `pnpm build` seguido de `pnpm preview:web` em `apps/mobile`; `expo start --web` inicia Metro/HMR e não representa o PWA exportado, podendo expor tanto o script clássico quanto incompatibilidades do HMR. COMO EVITAR: PWA Expo só está validado depois de abrir o artefato num navegador real, aguardar `navigator.serviceWorker.ready`, desligar o servidor e recarregar; build/lint ou HTTP 200 isolados não bastam.
