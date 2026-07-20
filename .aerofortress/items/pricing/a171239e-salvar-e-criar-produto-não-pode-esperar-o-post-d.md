---
id: a171239e-a8ab-4d86-b77a-a3053f3551b3
slug: pricing
type: scar
title: Salvar e criar produto não pode esperar o POST da precificação para navegar
tags: pricing, pwa, navigation, mutation, error-handling, products
provenance: observado
evidence: Railway HTTP logs de produção em 2026-07-20T22:36:29Z e 22:36:49Z (201); apps/mobile/src/features/pricing/components/pricing-calculator.tsx; captura da usuária em 2026-07-20
decay: stable
created: 2026-07-20T22:43:10.557025700+00:00
updated: 2026-07-20T22:43:10.557025700+00:00
validated: 2026-07-20T22:43:10.557025700+00:00
links:
---

SINTOMA (2026-07-20, iPhone/PWA): ao tocar “Salvar e criar produto” no resultado da Precificação, a tela permanecia no resultado e parecia não responder. EVIDÊNCIA: os logs HTTP do Railway mostraram duas tentativas no horário da captura, ambas `POST /api/v1/pricing/calculate` com status 201; portanto o cálculo era salvo e a falha ocorria na transição posterior. CORREÇÃO: abrir imediatamente o formulário de produto com o preço calculado e persistir o cálculo em paralelo; erros de salvamento, antes engolidos por `catch` vazio, agora aparecem ao usuário. COMO EVITAR: ações compostas de persistência + navegação não devem bloquear a transição em uma chamada remota quando as etapas podem prosseguir independentemente, e nenhum erro de mutation pode ficar sem feedback visível.
