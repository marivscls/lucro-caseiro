---
id: 06fc8642-c1cb-4c7b-9f52-6545d13e51a6
slug: ui
type: scar
title: Logo transparente precisa ocupar a área útil do canvas no modo claro
tags:
provenance: dito
evidence: apps/mobile/src/assets/auth-house-light.png; relato da usuária em 2026-08-01; build PWA lucro-caseiro aprovado
decay: stable
created: 2026-08-01T23:25:10.313292+00:00
updated: 2026-08-01T23:25:10.313292+00:00
validated: 2026-08-01T23:25:10.313292+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-01): a primeira variante transparente usada no modo claro tinha arquivo 512×512, mas a arte ocupava apenas uma pequena região central e por isso aparecia minúscula no BrandIntro. CORREÇÃO CANÔNICA: usar a imagem fornecida `Sem título - 01 August 2026 at 20.21.23.png` em `apps/mobile/src/assets/auth-house-light.png`; ela mantém alpha transparente e faz a casa com seta rosa e moeda dourada ocupar quase todo o canvas. COMO EVITAR: ao trocar logos transparentes, validar a caixa visual/área útil, não apenas as dimensões nominais do PNG.
