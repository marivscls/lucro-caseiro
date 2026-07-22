---
id: f5011f86-0e7b-4888-ab72-83d6201eb23c
slug: pricing
type: rule
title: Campos monetários da precificação exibem R$ antes do valor
tags: pricing, ui, currency, brl
provenance: dito
evidence: Pedido da usuária em 2026-07-22; apps/mobile/src/shared/components/form-field.tsx; apps/mobile/src/features/pricing/components/simple-pricing-calculator.tsx; apps/mobile/src/features/pricing/components/pricing-calculator.tsx
decay: stable
created: 2026-07-22T23:24:04.686608200+00:00
updated: 2026-07-22T23:24:04.686608200+00:00
validated: 2026-07-22T23:24:04.686608200+00:00
links:
---

A usuária definiu que todos os campos de preço/valor monetário nas telas de precificação Simples e Completa devem mostrar o prefixo `R$` antes do número enquanto a pessoa digita. Quantidades, minutos e percentuais não recebem o prefixo. Resultados e resumos continuam usando a formatação monetária brasileira completa.
