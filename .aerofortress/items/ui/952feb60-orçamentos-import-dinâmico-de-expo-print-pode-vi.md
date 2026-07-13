---
id: 952feb60-059d-4de8-a2ec-c12a99ebe85d
slug: ui
type: scar
title: Orçamentos: import() dinâmico de expo-print pode virar módulo desconhecido no Metro
tags: orcamentos, pdf, expo-print, expo-sharing, metro, android, dev-client
provenance: observado
evidence: apps/mobile/src/features/quotes/quote-pdf.ts; logcat de 2026-07-13 com unknown module 2089 antes e compartilhamento Android sem erros depois; pnpm mobile typecheck/lint/test
decay: stable
created: 2026-07-13T20:38:56.982495600+00:00
updated: 2026-07-13T20:38:56.982495600+00:00
validated: 2026-07-13T20:38:56.982495600+00:00
links:
---

SINTOMA (2026-07-13, Android Dev Client): tocar em “Orçamento em PDF” aparentava reiniciar o app. CAUSA OBSERVADA no logcat/overlay: `Requiring unknown module "2089"` ao resolver `expo-print/build/Print.js` pelo `import("expo-print")` dinâmico; o erro escapava do fluxo assíncrono e o overlay/reload parecia um reinício. CORREÇÃO: importar `expo-print` e `expo-sharing` estaticamente em `quote-pdf.ts`, mantendo apenas as operações nativas assíncronas. COMO EVITAR: em handlers de exportação usados por rotas React Native/Expo, não carregar módulos nativos por import() dinâmico quando o Metro/HMR pode não ter materializado o módulo; após alterar resolução de dependências, reiniciar o Metro com cache limpo. VALIDAÇÃO: no emulador Android, o PDF fictício abriu a folha de compartilhamento (Quick Share/Print/Drive), o PID do app permaneceu igual e o logcat não mostrou erro; typecheck, lint e 294 testes passaram.
