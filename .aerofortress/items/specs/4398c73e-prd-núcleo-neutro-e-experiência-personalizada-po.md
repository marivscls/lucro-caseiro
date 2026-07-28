---
id: 4398c73e-ad8f-4e51-8b88-fb394594b758
slug: specs
type: doc
title: PRD — Núcleo neutro e experiência personalizada por tipo de negócio
tags: prd, design, onboarding, personalizacao, business-type, ui, implementado
provenance: observado
evidence: .aerofortress/specs/prd-nucleo-neutro-personalizacao.md; apps/mobile/src/features/subscription/business-copy.ts; validações locais em 2026-07-25
decay: stable
created: 2026-07-25T14:46:00.234048400+00:00
updated: 2026-07-25T15:30:51.186284600+00:00
validated: 2026-07-25T15:30:51.186284600+00:00
links:
---

PRD canônico para reduzir a aparência de app exclusivo de confeitaria sem remover a identidade rosa nem os recursos de alimentação. Define dicionário contextual por `businessType`, onboarding por modo de operação, proporção visual neutra/funcional/rosa, matriz tela por tela e isolamento explícito das mudanças locais anteriores ainda não aprovadas. Implementado em 2026-07-25 nas ondas de fundação, onboarding, navegação, cadastros, precificação, finanças, planos e suporte; typecheck, lint, 387 testes e build PWA passaram, e o onboarding foi capturado em mobile/desktop sem erros de console; a auditoria visual autenticada e Android permanecem não executadas por credencial E2E inválida.
