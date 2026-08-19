---
id: 99cb1c5a-4947-455a-8657-cc4eda75d9de
slug: ui
type: scar
title: React Native Web: Image.resolveAssetSource não existe no runtime
tags: react-native-web, expo-asset, imagem, runtime, catalogo, pwa
provenance: observado
evidence: apps/mobile/src/app/catalog.tsx; abertura local http://127.0.0.1:8094/catalog mostrou `Image.default.resolveAssetSource is not a function`; corrigido com expo-asset e rebuild PWA aprovado
decay: stable
created: 2026-08-17T03:23:51.962999800+00:00
updated: 2026-08-17T03:23:51.962999800+00:00
validated: 2026-08-17T03:23:51.962999800+00:00
links:
---

FALHA CORRIGIDA (2026-08-17): ao renderizar um `<img>` web real para a arte do hero do Catálogo, `Image.resolveAssetSource(illustration)` passou no typecheck, mas quebrou o PWA em runtime porque o export `Image` do react-native-web 0.21 não expõe `resolveAssetSource`. CORREÇÃO: resolver a URI do módulo estático com `Asset.fromModule(illustration).uri` de `expo-asset`, já dependência do app. COMO EVITAR: não inferir paridade runtime entre `Image` nativo e web apenas pelos tipos; validar a página construída no navegador sempre que acessar métodos estáticos do React Native.
