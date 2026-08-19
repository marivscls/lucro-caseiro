---
id: 6a5132ee-81ac-4fca-91aa-85cdc512193b
slug: ui
type: scar
title: Fiado: FAB deve flutuar acima da safe area sem reservar uma faixa vazia
tags: fiado, fab, mobile, web, android, safe-area, inset, rolagem
provenance: dito
evidence: apps/mobile/src/app/fiado.tsx; em 2026-08-16 ESLint do arquivo, typecheck mobile e build PWA lucro-caseiro aprovados
decay: stable
created: 2026-08-16T19:06:47.103550+00:00
updated: 2026-08-16T19:15:12.318903200+00:00
validated: 2026-08-16T19:15:12.318903200+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-08-16): (1) colocar o botão `+` da tela Fiado em um `fabDock` com altura fixa somada ao safe-area inset criou uma grande faixa branca entre o conteúdo e a navegação do Android; (2) deixá-lo absoluto com `bottom` fixo fez o FAB ficar parcialmente escondido atrás da barra de navegação do Android. CORREÇÃO CANÔNICA: o FAB permanece sobreposto ao conteúdo com `position: absolute`, alinhado à direita, fundo transparente e visual inalterado. A `SafeAreaView` raiz não reserva a edge inferior; `useSafeAreaInsets().bottom` é aplicado exatamente uma vez na posição (`bottom = inset + 20 px`). O `ScrollView` recebe padding inferior independente igual a inset + margem do FAB + altura do FAB + folga final, permitindo que o último card role completamente acima do botão e da área do sistema. COMO EVITAR: nunca usar posição fixa baseada em aparelho, nunca somar o mesmo inset no dock e na SafeAreaView, e nunca voltar a inserir um dock no fluxo que reserve uma faixa vazia.
