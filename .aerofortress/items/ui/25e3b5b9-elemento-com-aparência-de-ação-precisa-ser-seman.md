---
id: 25e3b5b9-f809-4d67-9ed2-e24e2ab84193
slug: ui
type: scar
title: Elemento com aparência de ação precisa ser semanticamente clicável
tags: ui, interacao, acessibilidade, button, onboarding, mobile
provenance: observado
evidence: apps/web/src/features/marketing/resource-board.tsx; apps/mobile/src/app/tabs/index.tsx; lint e typecheck mobile aprovados; bundle Android Metro HTTP 200 em 2026-08-13
decay: stable
created: 2026-07-16T19:18:04.292350500+00:00
updated: 2026-08-14T00:13:54.986631400+00:00
validated: 2026-08-14T00:13:54.986631400+00:00
links:
---

SINTOMA ORIGINAL (2026-07-16): os cards de recursos da Central de Marketing exibiam hover e ArrowUpRight, mas eram apenas `article`, sem link nem `onClick`. CORREÇÃO: botão sobreposto acessível ligado ao editor canônico, preservando ações independentes e foco visível. RECORRÊNCIA (2026-08-13): o mock de onboarding na Home desenhou “Próximo” com uma `View` e `accessibilityRole="button"`, mas sem `onPress`; no Android, a usuária não conseguia avançar. CORREÇÃO: reutilizar o `Button` canônico e implementar as três etapas locais do mock. COMO EVITAR: affordance visual, role e texto de ação não bastam — todo controle precisa de primitiva interativa e handler real; validar a interação no fluxo, não apenas a renderização.
