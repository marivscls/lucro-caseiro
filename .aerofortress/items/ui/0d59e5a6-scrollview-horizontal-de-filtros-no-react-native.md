---
id: 0d59e5a6-0731-4a94-a91a-4481cc7cbb84
slug: ui
type: scar
title: ScrollView horizontal de filtros no React Native Web precisa neutralizar crescimento vertical
tags: react-native-web, scrollview, responsividade, vendas, validacao-visual
provenance: observado
evidence: apps/mobile/src/app/tabs/sales.tsx; capturas PWA autenticadas geradas e inspecionadas nesta sessão em 320/390/768 px
decay: stable
created: 2026-08-16T17:14:41.134557700+00:00
updated: 2026-08-16T17:14:41.134557700+00:00
validated: 2026-08-16T17:14:41.134557700+00:00
links:
---

FALHA DETECTADA NA VALIDAÇÃO VISUAL DA NOVA TELA DE VENDAS (2026-08-16): o `ScrollView` horizontal das abas cresceu verticalmente e ocupou quase toda a viewport no PWA, embora typecheck, lint e testes estivessem verdes. CORREÇÃO: aplicar `style={{ flexGrow: 0 }}` ao `ScrollView` e alinhar o conteúdo; validar novamente em runtime nas larguras 320, 390 e 768 px. COMO EVITAR: todo `ScrollView horizontal` inserido dentro de uma coluna flexível deve ser conferido no React Native Web, pois a direção horizontal não impede o crescimento no eixo vertical.
