---
id: 3daeefc1-d460-468c-8e99-800282e710c3
slug: ui
type: decision
title: Primeiros passos conduz produto, venda e resultado na Home
tags: onboarding, ativacao, home, primeira-venda, pwa
provenance: observado
evidence: apps/mobile/src/app/tabs/index.tsx; apps/mobile/src/shared/utils/getting-started.ts; apps/mobile/src/shared/hooks/use-onboarding.ts; typecheck, lint, 6 testes direcionados e build:pwa:caseiro aprovados em 2026-08-15; preview HTTP 200 em http://127.0.0.1:8093
decay: stable
created: 2026-08-15T17:14:11.143161700+00:00
updated: 2026-08-15T22:58:37.932132800+00:00
validated: 2026-08-15T22:58:37.932132800+00:00
links:
---

O Lucro Caseiro mantém o onboarding de perfil separado e usa na Home um guia persistente de ativação em três etapas: cadastrar o primeiro produto, registrar a primeira venda e conferir o resultado em Financeiro. A Home abre automaticamente uma tela guiada focada em uma etapa por vez; se a pessoa fechar, um card compacto permite reabrir. Produto e venda avançam automaticamente a partir dos dados reais, e o retorno à Home apresenta a etapa seguinte. Início e confirmação do resultado são persistidos por userId no aparelho. Os CTAs abrem diretamente o formulário de produto, a Nova Venda guiada e Financeiro; contas que já possuem produto e venda sem ter iniciado o guia não recebem um tutorial retroativo.
