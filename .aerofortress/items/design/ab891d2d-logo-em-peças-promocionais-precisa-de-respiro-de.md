---
id: ab891d2d-0a8d-47b7-a6cd-e428818bd0a5
slug: design
type: scar
title: Logo em peças promocionais precisa de respiro dentro do quadrado
tags: logo, play-store, video, feature-graphic, remotion
provenance: dito
evidence: Correção da usuária e imagens anexadas em 2026-08-11; apps/promo-video/src/FeatureGraphics.tsx; apps/promo-video/src/PlayStoreVideo.tsx
decay: stable
created: 2026-08-11T16:34:46.351182100+00:00
updated: 2026-08-11T16:34:46.351182100+00:00
validated: 2026-08-11T16:34:46.351182100+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-11): o monograma “L” ficou apertado dentro do quadrado arredondado tanto no recurso gráfico quanto no encerramento do vídeo da Play Store. A ampliação anterior (`scale` 1.42 no banner e 1.65 no vídeo) fazia a marca quase encostar nas bordas. CORREÇÃO: usar `scale: 1.18` nas duas composições. COMO EVITAR: ao inserir a logo raster em cards promocionais, validar o espaço negativo interno; o recipiente pode manter o tamanho, mas o desenho deve respirar em todos os lados.
