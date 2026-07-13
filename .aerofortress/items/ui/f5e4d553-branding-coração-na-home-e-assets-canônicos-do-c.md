---
id: f5e4d553-487c-4620-b7fa-e0f8da93f8de
slug: ui
type: decision
title: Branding: coração na Home e assets canônicos do Catálogo
tags: branding, catalogo, logo
provenance: dito
evidence: apps/api/src/features/catalog/catalog-logo.ts; apps/mobile/assets/icon.png
decay: stable
created: 2026-07-10T16:37:07.079120200+00:00
updated: 2026-07-11T18:52:08.526163700+00:00
validated: 2026-07-11T18:52:08.526163700+00:00
links: 
---

A saudação da Home usa um coração preenchido rosa do Ionicons após o nome, em vez do emoji de aceno. No Catálogo, o rodapé da página pública deve usar a logo atual do app, cuja fonte canônica é `apps/mobile/assets/icon.png`; o backend mantém uma versão 56x56 embutida em base64 em `apps/api/src/features/catalog/catalog-logo.ts`. O hero da tela mobile de gestão usa a casinha simples transparente quando esse asset estiver disponível.
