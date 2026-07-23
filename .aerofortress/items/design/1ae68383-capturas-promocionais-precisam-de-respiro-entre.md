---
id: 1ae68383-598d-417e-b1cc-9420e083265f
slug: design
type: scar
title: Capturas promocionais precisam de respiro entre a interface e a moldura
tags: play-store, screenshots, device-frame, padding, tablet
provenance: dito
evidence: Feedback visual da usuária sobre as artes `imagens/play-store-customizadas-2026-07-23/tablet-10/01-precificacao-simples.png` e `02-precificacao-completa.png`; implementação em apps/promo-video/src/StoreScreenshots.tsx
decay: stable
created: 2026-07-23T15:35:01.545468200+00:00
updated: 2026-07-23T15:35:01.545468200+00:00
validated: 2026-07-23T15:35:01.545468200+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-23): nas artes promocionais da Play Store, a captura do app não pode ficar grudada no aro preto do celular/tablet. SINTOMA: pouco padding interno faz a interface parecer apertada e colada à moldura, especialmente nas artes de precificação em tablet. COMO EVITAR: usar bezel interno visível e calcular a altura externa a partir da proporção real da captura mais o padding, evitando que aumentar o respiro provoque recorte por `object-fit: cover`.
