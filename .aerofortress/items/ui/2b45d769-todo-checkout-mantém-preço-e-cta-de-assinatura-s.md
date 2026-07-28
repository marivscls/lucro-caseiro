---
id: 2b45d769-22ea-45b6-83cf-1e298f46bc6c
slug: ui
type: scar
title: Todo checkout mantém preço e CTA de assinatura sempre visíveis
tags: checkout, paywall, preco, cta, sticky, monthly, annual, essential, professional, ui
provenance: dito
evidence: Correções da usuária em 2026-07-25; apps/mobile/src/features/subscription/components/paywall.tsx
decay: stable
created: 2026-07-26T00:29:00.748105400+00:00
updated: 2026-07-26T01:30:13.855262100+00:00
validated: 2026-07-26T01:30:13.855262100+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-07-25): primeiro, no checkout longo de `/plans`, o botão “Desbloquear Profissional” só aparecia depois de rolar até o fim no celular; depois, a regra foi ampliada explicitamente: **todos os checkouts, em qualquer largura e para qualquer tier, devem manter o preço e o botão de desbloqueio visíveis sem depender de rolagem**. CORREÇÃO CANÔNICA: Essencial e Profissional usam o mesmo `Paywall`; preço resumido e CTA ficam numa barra persistente fora do `ScrollView`, sem cobrir o conteúdo. O detalhamento completo do preço pode continuar no fluxo. CORREÇÃO DA USUÁRIA (2026-07-25): ao selecionar o período mensal, não exibir a legenda redundante “R$ X cobrados mensalmente”; a legenda de cobrança permanece apenas para o período anual. COMO EVITAR: não condicionar a barra persistente apenas ao breakpoint móvel, não criar variações de checkout fora do componente compartilhado e não reintroduzir a legenda no ramo mensal.
