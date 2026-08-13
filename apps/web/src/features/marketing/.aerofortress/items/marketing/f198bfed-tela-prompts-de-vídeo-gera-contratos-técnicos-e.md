---
id: f198bfed-bb9d-4946-a879-f43d14bed9d0
slug: marketing
type: fact
title: Tela Prompts de vídeo gera contratos técnicos e mantém histórico local
tags: marketing, vídeo, prompt, histórico, frontend
provenance: observado
evidence: apps/web/src/app/(dashboard)/video-prompts/page.tsx; apps/web/src/features/marketing/video-prompt-generator.ts; apps/web/src/features/marketing/video-prompt-studio.tsx
decay: seasonal
created: 2026-08-12T15:51:45.950431900+00:00
updated: 2026-08-12T15:51:45.950431900+00:00
validated: 2026-08-12T15:51:45.950431900+00:00
links:
---

A rota /video-prompts monta prompts profissionais sem gerar ou editar vídeo. O gerador puro valida somente dados essenciais, reconstrói a linguagem entre modalidades com e sem personagem, produz cinco blocos temporais, prompt negativo e materiais, e alterna três estruturas narrativas; a interface guarda até 50 versões no localStorage com editar, duplicar, favoritar e reutilizar.
