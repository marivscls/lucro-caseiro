---
id: ba2f830a-ecb2-44a7-9928-1126f8d2c055
slug: design
type: scar
title: Tela principal do encerramento não pode receber opacidade de fundo
tags: video, play-store, remotion, opacidade, interface-real
provenance: dito
evidence: Correção da usuária e captura anexada em 2026-08-11; apps/promo-video/src/PlayStoreVideo.tsx
decay: stable
created: 2026-08-11T17:22:01.665426+00:00
updated: 2026-08-11T17:22:01.665426+00:00
validated: 2026-08-11T17:22:01.665426+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-11): no encerramento do vídeo da Play Store, o único celular exibido ficou esmaecido porque a composição aplicava `opacity: 0.5`, herdada da ideia anterior de usá-lo como elemento de fundo. Como ele é a interface real e o foco visual da cena, deve permanecer com opacidade total. COMO EVITAR: só reduzir opacidade de screenshots realmente secundários; quando houver uma única tela, preservar contraste e legibilidade completos e validar o quadro final renderizado.
