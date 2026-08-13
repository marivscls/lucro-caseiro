---
id: ea68ade2-a7d9-43e9-9bdc-10c7b31ea862
slug: geral
type: contract
title: Estúdio de Posts expõe categoria de enredos de vídeo por campanha
tags: marketing, posts, campanhas, vídeo, video_recording, ui
provenance: observado
evidence: apps/desktop/src/PostCampaignSources.tsx; apps/desktop/src/PostsLibraryPage.test.tsx; captura real .tmp/selenita-category-final.png; 17 testes focados, lint, typecheck, design doctor e Vite build aprovados em 2026-08-12
decay: stable
created: 2026-08-12T18:11:25.294254900+00:00
updated: 2026-08-12T18:11:25.294254900+00:00
validated: 2026-08-12T18:11:25.294254900+00:00
links:
---

Na tela Posts > Campanhas para criar posts, o controle visível “Categoria do próximo post” oferece “Posts gerais” e “Enredos para gravação de vídeos”. Ao escolher enredos, cada campanha oferece “Gerar enredo de vídeo”; o draft e o recurso persistido recebem category="Enredos para gravação de vídeos" e format="video_recording", prevalecendo sobre formato divergente devolvido pela IA. A produção normaliza tecnicamente para vídeo curto e aplica o contrato de roteiro falado, cenas, texto na tela e direção de captação.
