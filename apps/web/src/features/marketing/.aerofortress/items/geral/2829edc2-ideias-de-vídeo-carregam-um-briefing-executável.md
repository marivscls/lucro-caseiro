---
id: 2829edc2-5a51-4fdb-9e6b-4d7faa88aaae
slug: geral
type: contract
title: Ideias de vídeo carregam um briefing executável de gravação
tags: video, ideias, briefing, marketing
provenance: observado
evidence: apps/desktop/src/ResourceBoardSupport.tsx; backends/Selenita.Api/Modules/Marketing/ContentIdeaQualityGate.cs; backends/Selenita.Api/Modules/Creative/PostProductionPrompt.cs; ResourceBoard.test.tsx 12/12 e testes backend focados 13/13 em 2026-08-12
decay: stable
created: 2026-08-12T18:50:39.129038700+00:00
updated: 2026-08-12T18:50:39.129038700+00:00
validated: 2026-08-12T18:50:39.129038700+00:00
links:
---

Desde 2026-08-12, o modal “Detalhes da ideia” trata `video_recording` (“Vídeo para gravação”) e `short_video` como formatos de vídeo e exibe a seção condicional “Direção do vídeo”. O contrato canônico `data.videoBrief` registra `approach` (`talking_head`, `screen_demo`, `situation_reaction`, `hybrid` ou `screen_only`), `presenterDirection`, `scenario`, `screenAction`, `durationSeconds`, `recordingDirection`, `editingDirection` e `audioDirection`. Para `video_recording`, o quality gate exige briefing completo e a produção injeta `VIDEO_BRIEF` no prompt final. A geração automática deve prever atuação/gestos e demonstração real do produto, fala natural sem pausas artificiais, cenário, tela quando aplicável, captação, edição e áudio, sem inventar interfaces.
