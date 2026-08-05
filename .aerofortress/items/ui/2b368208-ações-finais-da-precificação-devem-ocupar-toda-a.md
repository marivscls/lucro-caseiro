---
id: 2b368208-0d9c-4adf-89cb-e03a17924d9e
slug: ui
type: scar
title: Ações finais da Precificação devem ocupar toda a largura no mobile
tags: mobile, pricing, precificacao, button, cta, layout, android
provenance: dito
evidence: Captura enviada pela usuária em 2026-08-04; apps/mobile/src/features/pricing/components/simple-pricing-calculator.tsx; ESLint direcionado, typecheck mobile e git diff --check aprovados
decay: stable
created: 2026-08-05T01:09:09.063965100+00:00
updated: 2026-08-05T01:09:09.063965100+00:00
validated: 2026-08-05T01:09:09.063965100+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-04, captura Android): os botões `Salvar e criar produto` e `Salvar cálculo` apareciam estreitos e desalinhados com o card de estimativa, assumindo visualmente a largura do conteúdo. CORREÇÃO CANÔNICA: no layout mobile, o agrupador e os dois `Button` usam `width: "100%"`, altura mínima de 52 px e gap de 8 px; no desktop permanecem lado a lado com larguras mínimas próprias. COMO EVITAR: CTAs finais empilhados em formulários mobile devem preencher a coluna útil e compartilhar largura/altura, mantendo a ação secundária em variante outline.
