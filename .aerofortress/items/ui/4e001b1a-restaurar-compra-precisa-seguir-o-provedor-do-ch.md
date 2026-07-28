---
id: 4e001b1a-db27-460f-8012-9ca7976603cc
slug: ui
type: scar
title: Restaurar compra precisa seguir o provedor do checkout, não assumir Google Play
tags: assinatura, restore, stripe, google-play, ios, web, pwa, checkout, ui
provenance: observado
evidence: Relato e captura da usuária em 2026-07-25; apps/mobile/src/features/subscription/use-subscription.ts; apps/mobile/src/features/subscription/use-subscription.test.ts; 2 testes direcionados, ESLint e typecheck aprovados
decay: stable
created: 2026-07-26T02:03:22.356045500+00:00
updated: 2026-07-26T02:03:22.356045500+00:00
validated: 2026-07-26T02:03:22.356045500+00:00
links:
---

SINTOMA (2026-07-25): ao tocar “Restaurar compra” no checkout/Configurações fora do Android, o app mostrava “Em breve — Restauração iOS será disponibilizada depois”. CAUSA: o checkout já roteava Android para Google Play e iOS/web para Stripe, mas a restauração sempre chamava o hook de Google Play e bloqueava todo `Platform.OS !== "android"`. CORREÇÃO: Android continua buscando e validando compras da Play Store; iOS/web reconsultam o perfil de assinatura vinculado à conta, atualizam o cache do plano e invalidam limites, mostrando sucesso ou “Nenhuma assinatura encontrada”. COMO EVITAR: qualquer ação de assinatura compartilhada deve usar o mesmo roteamento por provedor do checkout e nunca rotular todo ambiente não Android como iOS.
