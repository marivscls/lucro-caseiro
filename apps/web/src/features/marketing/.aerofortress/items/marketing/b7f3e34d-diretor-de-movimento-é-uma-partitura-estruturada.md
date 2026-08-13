---
id: b7f3e34d-6e5d-4a20-8411-c45d11133508
slug: marketing
type: contract
title: Diretor de Movimento é uma partitura estruturada por cena
tags: marketing, video, movimento, coreografia, continuidade, timeline, prompt
provenance: observado
evidence: packages/contracts/src/schemas/video-prompts.ts; apps/api/src/features/marketing/video-prompt-ai.ts; apps/api/src/features/marketing/video-prompt.usecases.ts; apps/web/src/features/marketing/video-prompt-studio.tsx; packages/database/src/migrations/054_video_scene_movement_plan.sql
decay: stable
created: 2026-08-12T18:10:15.110967200+00:00
updated: 2026-08-12T18:10:15.110967200+00:00
validated: 2026-08-12T18:10:15.110967200+00:00
links:
---

O Estúdio de Prompts de Vídeo persiste o Diretor de Movimento dentro de cada VideoScene como movementPlan estruturado: preset editável, intensidade/velocidade, ações temporais por oito categorias, estado físico de continuidade e prompts positivo/negativo. A geração de coreografia usa endpoint próprio por cena, recebe cena anterior e seguinte, faz uma tentativa de reparo, rejeita intervalos fora da duração e persiste somente a coreografia válida. A geração canônica inclui movementDirections copiáveis por cena, sem parâmetros de fornecedor.
