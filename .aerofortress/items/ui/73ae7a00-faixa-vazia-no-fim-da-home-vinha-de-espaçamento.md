---
id: 73ae7a00-d0fb-41be-a8ff-8d8a42359804
slug: ui
type: scar
title: Faixa vazia no fim da Home vinha de espaçamento e safe area, não do AdMob
tags:
provenance: dito
evidence: apps/mobile/src/app/tabs/index.tsx; screenshot da usuária em 2026-07-10
decay: stable
created: 2026-07-10T15:24:33.054848700+00:00
updated: 2026-07-10T15:30:27.929417500+00:00
validated: 2026-07-10T15:30:27.929417500+00:00
links:
---

A usuária confirmou com screenshot completo que a faixa branca sob os atalhos Receitas/Precificação/Embalagens continuava mesmo após mover e ocultar o banner sem fill. A causa visual era o paddingBottom de 48px no ScrollView somado ao inset inferior do SafeAreaView, embora a Tabs já reserve a área inferior. Correção: paddingBottom 0 e edges apenas top/left/right na SafeAreaView raiz da Home. Os atalhos também não devem herdar cardStyle, pois isso adicionava sombra/elevation indesejada. Lição: antes de atribuir espaço vazio ao AdMob, conferir padding, safe-area duplicada e elevação do contêiner com a imagem completa.
