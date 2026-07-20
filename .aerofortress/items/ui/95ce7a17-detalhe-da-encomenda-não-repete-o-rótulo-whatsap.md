---
id: 95ce7a17-b5b6-482e-812c-39db38ab6f85
slug: ui
type: scar
title: Detalhe da encomenda não repete o rótulo WhatsApp acima das ações
tags: agenda, encomendas, whatsapp, duplicacao-visual, mobile, pwa
provenance: dito
evidence: Captura da usuária em 2026-07-20; apps/mobile/src/app/tabs/agenda.tsx
decay: stable
created: 2026-07-20T22:04:14.621584700+00:00
updated: 2026-07-20T22:04:14.621584700+00:00
validated: 2026-07-20T22:04:14.621584700+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-20, PWA móvel): no detalhe da encomenda, o cabeçalho “WhatsApp” com ícone aparecia imediatamente acima dos cards “Confirmar pedido” e “Avisar que está pronto”, repetindo uma informação já evidente nas próprias ações. CORREÇÃO: remover o cabeçalho redundante e manter os dois cards lado a lado. COMO EVITAR: grupos de ações cujo conteúdo e ícones já deixam o canal explícito não devem ganhar um título intermediário que apenas repete esse canal.
