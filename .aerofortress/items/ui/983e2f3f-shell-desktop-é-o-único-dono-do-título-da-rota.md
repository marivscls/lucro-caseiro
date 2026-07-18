---
id: 983e2f3f-796c-499f-b770-6bcb1dd58319
slug: ui
type: scar
title: Shell desktop é o único dono do título da rota
tags: desktop, header, hierarquia, responsividade, todas-as-rotas, correcao
provenance: dito
evidence: Correção explícita da usuária após o ajuste do Financeiro; apps/mobile/src/shared/components/desktop-shell.tsx e 20 telas em apps/mobile/src/app; typecheck, lint, 333 testes e export PWA aprovados em 2026-07-17
decay: stable
created: 2026-07-17T03:49:25.982713100+00:00
updated: 2026-07-17T13:09:23.018100200+00:00
validated: 2026-07-17T13:09:23.018100200+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-17): a repetição de título não era isolada do Financeiro; permanecia nas demais telas autenticadas. A correção de apenas uma tela foi incompleta. CORREÇÃO CANÔNICA CONFIRMADA: a partir de 1024 px, o DesktopShell é o único dono do título da rota e cada página oculta seu cabeçalho/título mobile; abaixo do breakpoint, os cabeçalhos mobile permanecem intactos. Quando o cabeçalho interno também contém ações (busca, filtros, histórico, criação ou ajuda), esconder somente título/voltar e preservar as ações numa toolbar desktop. COMO EVITAR: ao alterar a hierarquia do shell, inventariar todas as rotas autenticadas e validar títulos e ações em conjunto, não apenas a tela usada como exemplo.
