---
id: ca932dc6-9c63-4a46-9af6-ce7b1f277c91
slug: release
type: scar
title: Central de Marketing: UI e rotas de IA devem ser publicadas juntas
tags: deploy, web, api, marketing, ia, version-skew, railway
provenance: observado
evidence: commit 2cec51a; apps/web/src/features/marketing/resource-board.tsx; apps/api/src/features/marketing/marketing.routes.ts; health e bundle de produção verificados em 2026-07-17
decay: stable
created: 2026-07-17T14:13:23.534830600+00:00
updated: 2026-07-17T14:20:39.080455200+00:00
validated: 2026-07-17T14:20:39.080455200+00:00
links:
---

SINTOMA (2026-07-17): o botão “Gerar Ideias” apareceu na web local, mas a API de produção usada por essa tela ainda estava no commit anterior e não continha `POST /ai/content/ideas`; a chamada não podia funcionar. CAUSA: alteração multiapp permaneceu apenas no worktree enquanto `NEXT_PUBLIC_API_URL` apontava para Railway. CORREÇÃO: web, contrato e API foram publicados juntos no commit `2cec51a`; o bundle público passou a conter “Gerar Ideias”, a API nova expôs `marketingAi: true` no health e ambos os remotos apontaram para o mesmo commit. COMO EVITAR: funcionalidades que adicionam botões, contratos e endpoints devem ser validadas e publicadas como um único corte compatível; após o deploy, confirmar health da API e o bundle/endpoint, sem aceitar GET cacheado como prova de disponibilidade.
