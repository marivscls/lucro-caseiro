---
id: 0f6ea7c4-31fa-40f1-80f1-92328b929d02
slug: build
type: scar
title: React 19 no web usa SyntheticEvent em submit handlers
tags: react, typescript, formulário, lint, web
provenance: observado
evidence: apps/web/src/features/marketing/video-prompt-studio.tsx; pnpm run lint em 2026-08-12
decay: stable
created: 2026-08-12T15:51:45.894703400+00:00
updated: 2026-08-12T15:51:45.894703400+00:00
validated: 2026-08-12T15:51:45.894703400+00:00
links:
---

FALHA REAL (2026-08-12): a primeira implementação da tela Prompts de vídeo tipou o submit com FormEvent; o lint do projeto bloqueou a build porque esse tipo está depreciado nas definições atuais de React. CORREÇÃO: tipar o evento como SyntheticEvent<HTMLFormElement> e manter o handler compatível com onSubmit. COMO EVITAR: em novos formulários React deste app, não importar FormEvent; confirmar com lint e typecheck.
