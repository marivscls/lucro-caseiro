---
id: f088abff-d45c-4598-8f74-c578965f3e91
slug: ui
type: scar
title: Mock de onboarding precisa aparecer para a conta usada no teste
tags: onboarding, mock, home, preview, visibilidade, teste
provenance: dito
evidence: Correção da usuária em 2026-08-15; apps/mobile/src/app/tabs/index.tsx; typecheck, lint, 6 testes e build:pwa:caseiro aprovados; bundle entry-29f5652c922eec5c5fbc195d1609435f.js contém a prévia e http://127.0.0.1:8093 responde 200
decay: stable
created: 2026-08-15T23:17:02.753413300+00:00
updated: 2026-08-15T23:20:55.832615600+00:00
validated: 2026-08-15T23:20:55.832615600+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-15): o mock solicitado para visualizar e testar o onboarding na Home não apareceu. CAUSA CONFIRMADA: a prévia reutilizou a regra real de ativação (`shouldShowGettingStarted`), que oculta o guia para contas já ativas ou concluídas. CORREÇÃO: durante a aprovação visual, a Home usa um modo de prévia temporário que abre a primeira etapa para qualquer conta, mantém um card para reabrir e simula as três etapas sem alterar dados. COMO EVITAR: quando o pedido é explicitamente um mock para aprovação, oferecer um modo de prévia visível para a conta atual e independente dos dados reais; validar a presença no bundle/runtime autenticado antes de dizer que está disponível.
