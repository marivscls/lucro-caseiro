---
id: a014ffda-1e3c-4012-83f7-9863f5451224
slug: dev
type: fact
title: App principal do Lucro Caseiro é PWA para usuários sem Android
tags:
provenance: observado
evidence: apps/mobile/src/app/settings.tsx; apps/mobile/src/shared/hooks/use-notifications.ts; apps/mobile/src/features/*/*notifier.ts; apps/mobile/src/app/plans.tsx:71
decay: seasonal
created: 2026-07-17T00:41:13.755356600+00:00
updated: 2026-07-18T19:04:32.954635800+00:00
validated: 2026-07-18T19:04:32.954635800+00:00
links:
---

O app principal em `apps/mobile` preserva a base Expo/React Native compartilhada com Android/iOS e exporta um PWA instalável pensado como canal completo para pessoas sem Android. Login e onboarding persistem no navegador; cadastros, precificação, vendas, agenda, clientes, catálogo, financeiro, fotos/câmera e checkout Stripe usam a mesma API; recibos, orçamentos, receitas e rótulos abrem impressão/salvamento em PDF no navegador; relatórios baixam por Blob. O pós-build gera manifesto, ícones, atalhos, normaliza o bundle/Ionicons e cria service worker versionado com fallback offline.

Gaps observados no worktree de 2026-07-18: todos os notificadores locais/agendados retornam cedo no web e Configurações substitui seus toggles por aviso; lembretes com PWA fechado exigem web push/VAPID e backend. Além disso, a assinatura nasce via Stripe no web, mas `openStoreSubscriptionManagement()` em `plans.tsx` envia todo não-Android à página de assinaturas da Apple, então o PWA não oferece gerenciamento/cancelamento funcional da assinatura Stripe. A Central de Marketing em `apps/web` continua separada.
