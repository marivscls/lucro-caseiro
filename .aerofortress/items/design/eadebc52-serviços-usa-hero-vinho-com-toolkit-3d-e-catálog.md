---
id: eadebc52-397f-4aa0-94ef-201c840583d3
slug: design
type: decision
title: Serviços usa hero vinho com toolkit 3D e catálogo operacional responsivo
tags: serviços, design, mobile, pwa, png, responsividade, margem
provenance: observado
evidence: apps/mobile/src/app/services.tsx; apps/mobile/src/assets/services-hero-toolkit.png; apps/mobile/src/features/services/domain.ts; validação CDP em 320, 360, 390, 430, 480 e 1280 px em 2026-08-16
decay: stable
created: 2026-08-16T23:18:14.276229200+00:00
updated: 2026-08-16T23:18:14.276229200+00:00
validated: 2026-08-16T23:18:14.276229200+00:00
links:
---

A tela canônica de Serviços em `apps/mobile/src/app/services.tsx` preserva o cadastro, filtros, estados, modal de detalhe e agendamento existentes, mas apresenta hero vinho `#4A2332` com o PNG transparente oficial `services-hero-toolkit.png`, três métricas derivadas dos serviços ativos, revisão acionável, busca por nome/descrição/classificação e cards sem faixa lateral. O rodapé dos cards mantém apenas Custo e Sugerido; a margem é `round(((preço atual - custo total) / preço atual) * 100)` e some sem preço válido ou custos. No mobile a navbar fixa mantém Mais ativo e a lista reserva safe area; em 320–430 px métricas se reorganizam internamente e filtros rolam sem overflow da página.
