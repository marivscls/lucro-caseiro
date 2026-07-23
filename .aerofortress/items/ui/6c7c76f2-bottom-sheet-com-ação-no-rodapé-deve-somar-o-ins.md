---
id: 6c7c76f2-a614-49fa-8635-9786991c1b2d
slug: ui
type: scar
title: Bottom sheet com ação no rodapé deve somar o inset inferior do Android
tags: android, modal, bottom-sheet, safe-area, rodape, standard-modal, regressao, componente-compartilhado
provenance: observado
evidence: apps/mobile/src/shared/components/responsive-modal-surface.tsx; apps/mobile/src/shared/components/responsive-modal-surface.test.ts; captura original C:\Users\maria\AppData\Roaming\AeroFortress\constellation\tmp\d0538d87-13d0-43b9-a09e-8c0b9c8f5026.png; validação em emulator-5554 com Detalhes do produto em 2026-07-20; 342 testes, lint, typecheck e build:pwa:caseiro aprovados
decay: stable
created: 2026-07-13T12:50:22.724625500+00:00
updated: 2026-07-20T20:07:46.385852400+00:00
validated: 2026-07-20T20:07:46.385852400+00:00
links:
---

SINTOMA ORIGINAL (2026-07-13, Android): no modal “Selecionar cliente” de Nova encomenda, o botão “Fechar” terminava atrás da barra de navegação do sistema. RECORRÊNCIA (2026-07-20): após a criação do StandardModal/ResponsiveModalSurface compartilhado, todos os modais padrão voltaram a encostar na borda física inferior; em Detalhes do produto, “Excluir produto” ficava parcialmente coberto pela navegação Android. CAUSA: o painel `size="hug"` era ancorado com `justifyContent: "flex-end"` e padding inferior zero; `maxHeight: "92%"` não reserva a safe area. CORREÇÃO CANÔNICA: `ResponsiveModalSurface` obtém `useSafeAreaInsets()` e aplica o inset inferior no contêiner externo de todo modal `hug`, mantendo 24px no desktop. Assim a superfície inteira termina acima da navegação e a correção alcança todas as instâncias de StandardModal, inclusive conteúdo rolável e rodapés. COMO EVITAR: toda base compartilhada de bottom sheet deve incorporar a safe area no próprio componente; limite percentual, padding fixo ou correção isolada em um consumidor não substituem essa garantia. Ao refatorar modais, checar esta scar e validar no Android com uma ação na última linha.
