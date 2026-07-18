---
id: 136b653b-abc5-436e-a6df-878d84103ced
slug: ui
type: scar
title: PWA: trocar o conteúdo de /favicon.ico não vence o cache persistente do navegador
tags: pwa, expo, favicon, cache, browser, branding, single-output
provenance: observado
evidence: Correção e captura da usuária em 2026-07-16; apps/mobile/app.json; apps/mobile/public/index.html; export web aprovado; HTML de localhost:8083 contém apenas /icon-192.png?favicon=20260716; asset responde HTTP 200 em 192x192
decay: stable
created: 2026-07-17T01:56:21.985729700+00:00
updated: 2026-07-17T02:05:37.797281200+00:00
validated: 2026-07-17T02:05:37.797281200+00:00
links: 
---

SINTOMA (2026-07-16): a aba do navegador continuou mostrando o quadrado verde mesmo depois de `expo.web.favicon` apontar para o ícone oficial, o export gerar um favicon.ico rosa/bege e `/favicon.ico?verify=...` responder com o novo conteúdo. CORREÇÃO DA USUÁRIA: a captura após a primeira mudança comprovou que o favicon verde permaneceu. CAUSAS: (1) navegadores mantêm cache agressivo de favicon pela URL estável `/favicon.ico`; (2) esta PWA com `web.output: single` usa `apps/mobile/public/index.html` como documento canônico, portanto `src/app/+html.tsx` não altera o HTML exportado. CORREÇÃO CANÔNICA: remover `expo.web.favicon` para impedir a injeção automática de `/favicon.ico` e declarar em `public/index.html` um único `<link rel="icon">` apontando para `/icon-192.png` com query versionada. COMO EVITAR: verificar o `dist/index.html` e o HTML efetivamente servido, confirmar que não sobra referência ao endereço antigo e validar a resposta do novo asset; build ou amostragem isolada do ICO não bastam.
