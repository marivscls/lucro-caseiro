---
id: 6a57a129-1fe5-4f38-ba84-90d5bbb2081f
slug: scripts
type: scar
title: Metadados de vídeo no projeto Remotion usam remotion ffprobe
tags: remotion, ffprobe, windows, vídeo, metadados
provenance: observado
evidence: apps/promo-video/public/avatar-demo-presenter.mp4; execução em 2026-08-12
decay: stable
created: 2026-08-12T15:37:40.941648800+00:00
updated: 2026-08-12T15:37:40.941648800+00:00
validated: 2026-08-12T15:37:40.941648800+00:00
links:
---

FALHA REAL (2026-08-12): chamar `ffprobe` diretamente falhou no Windows porque o binário não estava instalado globalmente, embora o projeto Remotion já trouxesse uma versão empacotada. CORREÇÃO: executar `npx remotion ffprobe <arquivo>` dentro do app Remotion. COMO EVITAR: em projetos Remotion, preferir a CLI do projeto para ffprobe/FFmpeg antes de exigir instalação global.
