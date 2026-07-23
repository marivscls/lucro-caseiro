---
id: 40bee2dd-f21a-44a8-9cf4-c972b2ed8a9b
slug: video
type: fact
title: Vídeo Play Store canônico do Lucro Caseiro
tags: play-store, remotion, marketing, screenshots, android, icone
provenance: observado
evidence: apps/promo-video/src/PlayStoreVideo.tsx; apps/promo-video/public/play-store/icon.png; apps/promo-video/package.json; render e análise de mídia executados em 2026-07-23
decay: seasonal
created: 2026-07-23T12:26:59.038543+00:00
updated: 2026-07-23T12:44:41.429454100+00:00
validated: 2026-07-23T12:44:41.429454100+00:00
links:
---

O vídeo promocional horizontal para a ficha do Lucro Caseiro na Google Play é a composição Remotion `LucroCaseiroPlayStore`, em `apps/promo-video/src/PlayStoreVideo.tsx`. Usa a identidade rosa oficial, Fraunces/Nunito Sans e sete screenshots Android atuais de `imagens/screenshots-lucro-caseiro-2026-07-20/melhores-8`; a captura da Home foi excluída porque continha um atalho truncado, e todas as telas restantes aparecem em molduras completas. O encerramento usa uma cópia do ícone canônico simplificado de casa, coração e moeda (`apps/mobile/assets/icon.png`) em `apps/promo-video/public/play-store/icon.png`, nunca a antiga arte detalhada de confeitaria.

O comando canônico é `npm run render:play-store` em `apps/promo-video`, que gera `out/lucro-caseiro-play-store.mp4` (1920×1080, H.264, 30 fps, 810 frames, 27,051 s). O material não usa trilha externa para evitar direitos autorais e mantém a experiência real do app como visual principal.
