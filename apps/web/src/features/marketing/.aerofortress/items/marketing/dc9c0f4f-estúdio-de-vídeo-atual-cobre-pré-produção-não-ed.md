---
id: dc9c0f4f-67d4-4f08-abf5-e3195b955ccf
slug: marketing
type: fact
title: Estúdio de Vídeo atual cobre pré-produção, não edição de footage
tags: video, selenita, pos-producao
provenance: observado
evidence: apps/web/src/features/marketing/video-prompt-studio.tsx:130; apps/api/src/features/marketing/video-prompt.routes.ts:17; packages/contracts/src/schemas/video-prompts.ts:304; apps/api/src/features/marketing/video-prompt-ai.ts:16
decay: seasonal
created: 2026-08-12T18:43:50.622968900+00:00
updated: 2026-08-12T18:43:50.622968900+00:00
validated: 2026-08-12T18:43:50.622968900+00:00
links:
---

Observado em 2026-08-12: a tela `/video-prompts` salva projetos, gera versões de prompts audiovisuais e coreografias, mantém personagens/referências de imagem e publica o prompt aprovado como recurso de conteúdo. Não há upload de vídeo bruto, transcrição, EDL, aprovação de cortes nem renderização; as únicas ferramentas-alvo atuais são Sora, Veo e HeyGen. A integração de edição por fala deve entrar como etapa separada de pós-produção, sem sobrecarregar o contrato existente de geração.
