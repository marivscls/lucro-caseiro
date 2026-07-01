---
id: ae73e445-9b0d-4ed7-8a47-202473362f11
slug: ui
type: scar
title: Android adaptive icon: não usar a arte cheia como foreground
tags: android, adaptive-icon, icon, mobile
provenance: dito
evidence: Correção do usuário em 2026-06-29: "voce cortou demais o icone, deve ficar como esta na loja"; ajuste em apps/mobile/app.json e apps/mobile/assets/adaptive-icon.png.
decay: stable
created: 2026-06-29T18:49:39.208935+00:00
updated: 2026-06-29T18:49:39.208935+00:00
validated: 2026-06-29T18:49:39.208935+00:00
links: 
---

Erro corrigido: usar a arte final cheia (`assets/icon.png`) diretamente como `android.adaptiveIcon.foregroundImage` faz launchers Android com máscara circular cortarem telhado/conteúdo do ícone. Para Lucro Caseiro, manter o ícone principal/loja em `assets/icon.png`, mas criar um foreground separado com margem segura (`assets/adaptive-icon.png`) e fundo no tom do ícone (`#F7DFD6`). Antes de trocar ícone Android novamente, conferir a área segura do adaptive icon, não só a aparência do PNG quadrado.
