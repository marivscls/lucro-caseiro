---
id: ebf30ae5-0758-4328-8231-0648da1b5928
slug: ui
type: scar
title: Abertura de marca deve centralizar no contêiner, não na imagem
tags: brand-intro, splash, centralizacao, white-label, react-native-web
provenance: observado
evidence: apps/mobile/src/shared/components/brand-intro.tsx; PWA lucro-revenda recompilado e captura .aerofortress/tmp/brand-intro-audit/lucro-revenda.png em 2026-08-14
decay: stable
created: 2026-08-14T15:29:56.348989300+00:00
updated: 2026-08-14T15:29:56.348989300+00:00
validated: 2026-08-14T15:29:56.348989300+00:00
links:
---

SINTOMA (2026-08-14): a abertura do Lucro na Revenda exibiu a logo no canto superior esquerdo e o nome separado no centro, divergindo do Lucro Caseiro. CAUSA: `alignItems` e `justifyContent` foram removidos da raiz de `BrandIntro` e colocados em `Animated.Image`, onde não posicionam o conjunto logo + wordmark. CORREÇÃO CANÔNICA: manter `alignItems: "center"` e `justifyContent: "center"` em `styles.root`; `styles.logo` deve cuidar somente de tamanho e margem. Todas as marcas reutilizam essa mesma composição e variam o asset/nome da marca. COMO EVITAR: depois de mudar branding, validar a abertura renderizada da marca específica em vez de conferir apenas o asset.
