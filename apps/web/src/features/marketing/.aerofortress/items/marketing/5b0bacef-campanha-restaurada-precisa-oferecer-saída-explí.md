---
id: 5b0bacef-7985-4610-85ca-c889804ba023
slug: marketing
type: scar
title: Campanha restaurada precisa oferecer saída explícita para uma nova campanha
tags: marketing, campanhas, estado, restauracao, criacao
provenance: observado
evidence: apps/web/src/features/marketing/campaign-studio.tsx; relato da usuária em 2026-08-10; Vitest 6/6, typecheck, ESLint e Prettier aprovados
decay: stable
created: 2026-08-11T01:11:14.455926800+00:00
updated: 2026-08-11T01:11:14.455926800+00:00
validated: 2026-08-11T01:11:14.455926800+00:00
links:
---

FALHA REAL (2026-08-10): ao existir uma campanha aprovada, o CampaignStudio restaurava o último plano, marcava strategyApproved=true, desabilitava o briefing e escondia o botão de geração. Como não havia ação de nova campanha, a tela ficava presa ao recurso restaurado e novas campanhas deixavam de ser criadas. CORREÇÃO: oferecer a ação “Nova campanha”, limpar integralmente o estado e os erros do fluxo local, remover campaignResourceId e preservar restoredId para impedir restauração imediata; assim a próxima aprovação usa POST /resources e mantém a campanha anterior intacta. COMO EVITAR: todo fluxo que restaura uma entidade concluída deve ter uma transição explícita e testável para criar outra entidade, sem reutilizar seu id.
