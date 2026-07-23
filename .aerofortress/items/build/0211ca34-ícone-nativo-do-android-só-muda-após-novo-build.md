---
id: 0211ca34-6828-415e-9636-03bb150d8c74
slug: build
type: scar
title: Ícone nativo do Android só muda após novo build e reinstalação
tags: android, expo, eas, icon, development-build
provenance: dito
evidence: apps/mobile/assets/icon.png; apps/mobile/assets/adaptive-icon.png; EAS build 478cef14-0696-43a5-b7ae-36af45262730; confirmação visual da usuária em 2026-07-20
decay: stable
created: 2026-07-20T19:22:48.169441500+00:00
updated: 2026-07-20T19:22:48.169441500+00:00
validated: 2026-07-20T19:22:48.169441500+00:00
links:
---

SINTOMA (2026-07-20): os PNGs do ícone foram substituídos no repositório, mas a usuária confirmou pela tela de apps recentes que o ícone continuava antigo. CAUSA: o APK de desenvolvimento instalado havia sido gerado antes da alteração; o Metro atualiza o bundle JavaScript, não os recursos nativos de launcher/recents incorporados ao APK. CORREÇÃO: gerar um novo development build depois da alteração dos ícones e instalar esse APK; se o launcher mantiver cache, desinstalar o development build antigo antes de instalar o novo. PREVENÇÃO: toda alteração em icon/adaptive-icon precisa de aceite baseado em novo APK instalado, nunca apenas em reload do Metro.
