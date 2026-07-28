---
id: a0adf924-c72e-43ea-b3ce-86ca431c90b7
slug: ui
type: scar
title: Financeiro: ação de novo lançamento deve seguir a referência visual vigente
tags: financeiro, cta, diagnostico, acessibilidade, correcao, referencia-visual
provenance: dito
evidence: Referência completa enviada pela usuária em 2026-07-25; apps/mobile/src/features/finance/components/finance-dashboard.tsx; apps/mobile/src/app/finance.tsx
decay: stable
created: 2026-07-25T18:06:21.027441300+00:00
updated: 2026-07-25T19:11:11.907613700+00:00
validated: 2026-07-25T19:11:11.907613700+00:00
links:
---

HISTÓRICO: uma captura recortada levou à correção de remover os textos separados `Novo` e `lançamento` do antigo botão flutuante do Financeiro e manter apenas o círculo com `+`. NOVA CORREÇÃO DA USUÁRIA (2026-07-25): a referência completa e mais recente da tela Financeiro mostra explicitamente a ação `+ Novo lançamento` como botão contornado ao lado da busca no cabeçalho de `Lançamentos`, sem botão flutuante no rodapé. Esta referência supersede a regra antiga do círculo isolado. CORREÇÃO CANÔNICA: usar o CTA rotulado no cabeçalho, preservar `accessibilityLabel="Novo lançamento"` e não duplicar a ação em um FAB inferior. REGRA: quando uma referência completa mais recente contradiz uma captura recortada anterior, seguir a composição completa vigente e atualizar a memória, sem editar telas visualmente semelhantes por suposição.
