---
id: 51ba7a15-2521-49ba-b70d-d0efed302509
slug: product
type: scar
title: PWA do Lucro Caseiro é canal completo para quem não usa Android
tags: pwa, paridade, produto, web, android
provenance: dito
evidence: Mensagem da usuária em 2026-07-16: "o intuito seria quem nao tem android poder usar"; implementação em apps/mobile/src e teste Chrome online/offline
decay: stable
created: 2026-07-17T00:55:48.848316800+00:00
updated: 2026-07-17T00:55:48.848316800+00:00
validated: 2026-07-17T00:55:48.848316800+00:00
links: 
---

CORREÇÃO DA USUÁRIA (2026-07-16): o objetivo do PWA não é apenas tornar o export Expo instalável; ele deve permitir que pessoas sem Android usem o Lucro Caseiro como produto principal. SINTOMA DO ERRO: a primeira entrega tinha manifesto/service worker, mas ainda preservava dependências nativas que quebrariam onboarding, PDFs e relatórios no navegador. CORREÇÃO IMPLEMENTADA: persistência web, impressão/exports pelo navegador, download de relatórios, Stripe, guards de notificações e fonte de ícones web; a única exceção explícita é lembrete com o PWA fechado, que exige web push no backend. COMO EVITAR: toda mudança PWA deve ser revisada por paridade funcional do fluxo de negócio, não apenas por critérios de instalação/Lighthouse.
