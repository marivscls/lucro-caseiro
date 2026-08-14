---
id: ab891d2d-0a8d-47b7-a6cd-e428818bd0a5
slug: design
type: scar
title: Logo precisa de respiro em qualquer recipiente
tags: logo, launcher, android, pwa, play-store, video, safe-area
provenance: dito
evidence: Correções da usuária em 2026-08-11 e captura do launcher Android em 2026-08-13; apps/mobile/assets/icon.png; apps/mobile/assets/adaptive-icon.png; apps/mobile/public/icon-192.png; apps/mobile/public/icon-512.png
decay: stable
created: 2026-08-11T16:34:46.351182100+00:00
updated: 2026-08-13T18:52:42.567965200+00:00
validated: 2026-08-13T18:52:42.567965200+00:00
links:
---

CORREÇÕES DA USUÁRIA: em 2026-08-11, o monograma “L” ficou apertado dentro do quadrado nas peças promocionais; em 2026-08-13, o mesmo problema apareceu no ícone instalado no launcher Android. CAUSA: cada recipiente recorta/mascara a arte de modo diferente, e usar a mesma ocupação visual em todos faz o símbolo quase encostar nas bordas. CORREÇÃO CANÔNICA: nas composições promocionais, manter `scale: 1.18`; para os ícones de instalação do app e da PWA, derivar a arte com escala interna de 88%, acrescentando 6% de respiro em cada lado, sem reduzir o arquivo-fonte nem as cópias usadas dentro do app/marketing. COMO EVITAR: tratar a safe area por destino, validar o espaço negativo no launcher e também em 192×192 antes de publicar.
