---
id: 811992be-ac92-4d75-b387-b7dc5d176831
slug: ui
type: scar
title: Correção visual do PWA não pode mudar o app mobile sem pedido explícito
tags: clientes, pwa, web, mobile, react-native, plataforma
provenance: dito
evidence: Relato da usuária em 2026-07-31; apps/mobile/src/app/tabs/clients.tsx
decay: stable
created: 2026-07-31T17:01:51.036000700+00:00
updated: 2026-07-31T17:01:51.036000700+00:00
validated: 2026-07-31T17:01:51.036000700+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-31): ao ajustar a sobreposição da “Dica rápida” em Clientes vista no navegador/PWA, a primeira implementação também recalculava o posicionamento no Android nativo. A usuária pediu cuidado para não mexer no mobile. CORREÇÃO: condicionar o novo afastamento da barra flutuante a `Platform.OS === "web"` e preservar no branch nativo os valores anteriores de `bottom` e padding. COMO EVITAR: quando o defeito for apresentado em captura do navegador/PWA e não houver pedido de mudança nativa, manter a alteração isolada ao web e conferir o diff por plataforma.
