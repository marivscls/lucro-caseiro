---
id: 4fd56452-4a7b-4410-ad72-6fd41fa90115
slug: ui
type: scar
title: Compartilhar vitrine precisa de ação direta para WhatsApp
tags: catalogo, vitrine, compartilhamento, whatsapp, pwa, email
provenance: dito
evidence: Relato da usuária em 2026-07-31; apps/mobile/src/app/catalog.tsx; lint, typecheck, 419 testes, context lint e build PWA aprovados
decay: stable
created: 2026-07-31T21:33:35.380421700+00:00
updated: 2026-07-31T21:33:35.380421700+00:00
validated: 2026-07-31T21:33:35.380421700+00:00
links:
---

SINTOMA (2026-07-31): na tela Catálogo, “Compartilhar com clientes” delegava apenas ao compartilhamento nativo; no PWA ele podia oferecer somente e-mail, apesar de a vitrine ser distribuída principalmente pelo WhatsApp. CORREÇÃO: oferecer um botão explícito “Compartilhar no WhatsApp” que reutiliza `openWhatsAppShare` com a mensagem e a URL prontas, mantendo “Outras opções” como compartilhamento nativo. COMO EVITAR: canais centrais do produto não devem depender exclusivamente das opções disponibilizadas pelo share sheet da plataforma.
