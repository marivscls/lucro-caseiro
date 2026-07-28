---
id: 45ac63bc-6be0-47f1-bbea-b588068ea88e
slug: ui
type: scar
title: Aviso de limite gratuito é um card de progresso discreto, não um alerta
tags: limit-banner, freemium, progress, cta, saas, ui, essential, professional, clientes
provenance: dito
evidence: Correção e referência visual da usuária em 2026-07-25; apps/mobile/src/features/subscription/components/limit-banner.tsx; apps/mobile/src/features/subscription/limit-copy.ts; 12 testes direcionados, ESLint e typecheck aprovados
decay: stable
created: 2026-07-26T01:43:55.502763600+00:00
updated: 2026-07-26T01:43:55.502763600+00:00
validated: 2026-07-26T01:43:55.502763600+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): o `LimitBanner` do plano Gratuito parecia um alerta chamativo por usar fundo amarelo, emoji e a mesma cor forte no título, corpo e barra. CORREÇÃO CANÔNICA: usar uma superfície creme muito suave (`#FFF9F1` no tema claro), cantos de 20 px, sombra `sm`, padding horizontal de 24 px, diamante pequeno, hierarquia centrada em “atual de máximo recurso” (ex.: “18 de 20 clientes”), barra de 6 px totalmente arredondada preenchida com a cor primária e CTA de texto no canto inferior direito. O CTA deve respeitar o tier real: Essencial para limites de volume e Profissional para fornecedores. O estado atingido mantém o mesmo tratamento discreto, sem virar alerta vermelho/amarelo. COMO EVITAR: não reintroduzir emoji, fundo semântico intenso ou texto informativo sem ação no card compartilhado.
