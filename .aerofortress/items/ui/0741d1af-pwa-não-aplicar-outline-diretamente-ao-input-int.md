---
id: 0741d1af-1f32-4be3-99da-304d97ebbc7a
slug: ui
type: scar
title: PWA: não aplicar outline diretamente ao input interno do React Native Web
tags: pwa, react-native-web, input, focus, outline, css, whitelabel, produção
provenance: observado
evidence: apps/mobile/public/index.html; apps/mobile/scripts/generate-pwa-service-worker.mjs; commit 88ad17d; build:pwa:caseiro aprovado; produção validada diretamente em https://app.lucrocaseiro.com.br/ em 2026-07-20
decay: stable
created: 2026-07-20T20:26:50.845700800+00:00
updated: 2026-07-20T20:33:40.331917300+00:00
validated: 2026-07-20T20:33:40.331917300+00:00
links: 
---

SINTOMA (2026-07-20, iPhone/PWA): ao focar um campo arredondado, aparecia um retângulo rosa quadrado dentro do contêiner. CAUSA: `apps/mobile/public/index.html` aplicava `outline: 2px solid` em `input:focus-visible` e `textarea:focus-visible`; o React Native Web renderiza o TextInput como elemento HTML interno sem o border-radius do cartão externo. CORREÇÃO: remover a regra de foco do HTML-base, mantendo o reset global `outline: 0`, e remover do gerador de PWA a substituição obrigatória da cor desse foco. COMO EVITAR: indicadores visuais de foco devem pertencer ao contêiner canônico arredondado, nunca ao input/textarea interno; qualquer regra global do HTML-base deve ser validada no export PWA e nas três marcas. A correção foi publicada no commit `88ad17d`; `https://app.lucrocaseiro.com.br/` respondeu HTTP 200 sem a regra de contorno e com o reset presente após o Railway trocar o HTML.
