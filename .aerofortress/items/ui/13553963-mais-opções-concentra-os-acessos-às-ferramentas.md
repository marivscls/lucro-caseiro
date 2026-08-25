---
id: 13553963-b53e-4104-8e66-bd4d9fefc7c5
slug: ui
type: decision
title: Mais opções concentra os acessos às ferramentas do negócio
tags: navegacao, mais-opcoes, relatorios, insights
provenance: observado
evidence: apps/mobile/src/app/tabs/index.tsx; apps/mobile/src/app/tabs/more.tsx:77-83
decay: stable
created: 2026-07-10T15:38:10.678656400+00:00
updated: 2026-08-24T23:53:19.803174500+00:00
validated: 2026-08-24T23:53:19.803174500+00:00
links:
---

A navegação atual não mantém a antiga grade de 16 atalhos na Home. A Home apresenta os resumos do período e encaminha para Mais opções; `tabs/more.tsx` organiza os destinos em “Do dia a dia” e “Gestão do negócio”. Relatórios é um card destacado de “Gestão do negócio”, com descrição “Gráficos e desempenho” e rota `/insights`, garantindo acesso visível à tela que renderiza o gráfico mensal.
