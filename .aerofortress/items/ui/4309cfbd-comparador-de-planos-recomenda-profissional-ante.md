---
id: 4309cfbd-e071-487e-a4ca-05797fc791d0
slug: ui
type: rule
title: Comparador de planos recomenda Profissional antes do Essencial
tags: planos, comparador, recomendado, profissional, conversao, mobile
provenance: dito
evidence: Decisão da usuária em 2026-07-25; apps/mobile/src/app/plans.tsx; ESLint direcionado e typecheck mobile aprovados
decay: stable
created: 2026-07-26T01:48:15.592417900+00:00
updated: 2026-07-26T01:48:15.592417900+00:00
validated: 2026-07-26T01:48:15.592417900+00:00
links:
---

Na tela canônica `/plans`, quando a conta Gratuita está comparando os planos, o Profissional aparece antes do Essencial para orientar a escolha do plano prioritário. O Profissional usa o destaque visual já existente com padding um pouco maior e selo “RECOMENDADO”. Para contas Essencial/Profissional, a ordem continua orientada ao gerenciamento da assinatura, sem alterar paywalls contextuais.
