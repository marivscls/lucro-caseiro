---
id: 368b615e-5720-454c-8ef2-5202429f1761
slug: design
type: decision
title: Financeiro usa uma única página com recebimentos ampliados após atenção
tags: financeiro, ui, composição, asset
provenance: dito
evidence: apps/mobile/src/features/finance/components/finance-dashboard.tsx; apps/mobile/src/assets/finance-summary-illustration.png
decay: stable
created: 2026-08-16T17:46:12.820815800+00:00
updated: 2026-08-16T17:46:12.820815800+00:00
validated: 2026-08-16T17:46:12.820815800+00:00
links:
---

A tela Financeiro é uma única página vertical e rolável. A ordem canônica é resumo financeiro → alertas/Precisa de atenção → card ampliado de Recebimentos de encomendas → Exportar relatório → Lançamentos agrupados por data. O antigo card compacto de recebimentos não deve coexistir com a versão ampliada, e o cabeçalho aparece apenas uma vez. O hero vinho usa o asset transparente `finance-summary-illustration.png`, nunca a arte antiga com textos no caderno/embalagem.
