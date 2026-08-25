---
id: 0827c943-a4d0-4af5-b484-68805985bca0
slug: ui
type: fact
title: Primeiros Passos — etapa 3 usa ilustração neutra e conclui no Financeiro
tags: onboarding, ui, finance, i18n, pwa
provenance: observado
evidence: apps/mobile/src/shared/components/getting-started-overlay.tsx; apps/mobile/src/shared/utils/getting-started.ts; apps/mobile/src/app/tabs/index.tsx; validações de 2026-08-24: 563 testes, lint, typecheck e build PWA aprovados; CDP em 320/360/390/430/1024 px
decay: stable
created: 2026-08-24T14:25:40.752885600+00:00
updated: 2026-08-24T14:25:40.752885600+00:00
validated: 2026-08-24T14:25:40.752885600+00:00
links: 
---

A etapa 3 do Primeiros Passos é renderizada pelo `GettingStartedOverlay` compartilhado com `stage="result"`, usando o PNG transparente `getting-started-result.png`, textos centralizados no catálogo tipado de mensagens do recurso e o `StepProgressBar` reutilizado. No fluxo real, o CTA conclui o onboarding existente e navega para `/finance`; no modo de prévia, avança/dismiss sem persistir dados. As etapas reais retornam à Home após cadastrar produto e registrar venda para que as telas 2 e 3 sejam exibidas em sequência.
