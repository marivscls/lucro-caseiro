---
id: 5c6b65b2-a886-4f8c-bb22-d1f0d7524268
slug: ui
type: scar
title: Não confundir onboarding de perfil com checklist de ativação da Home
tags: onboarding, home, ativacao, ux
provenance: dito
evidence: apps/mobile/src/app/onboarding.tsx; apps/mobile/src/app/index.tsx; apps/mobile/src/app/tabs/index.tsx
decay: stable
created: 2026-08-13T23:44:56.094101100+00:00
updated: 2026-08-13T23:44:56.094101100+00:00
validated: 2026-08-13T23:44:56.094101100+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-13): ao pedir um mock do onboarding na tela inicial, foi criado e chamado de onboarding um checklist de ativação com primeiro produto e primeira venda. O aplicativo já possui o onboarding inicial após o cadastro, que pergunta o tipo de negócio e o nome do negócio antes de liberar a Home. REGRA: preservar essa separação conceitual e de fluxo — onboarding de conta nova coleta o perfil; checklist da Home apenas orienta ações posteriores e não deve substituir nem duplicar o onboarding.
