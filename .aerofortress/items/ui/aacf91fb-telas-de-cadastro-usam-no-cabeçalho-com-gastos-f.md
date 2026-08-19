---
id: aacf91fb-0fc2-4ff0-82a1-32ca424b00d0
slug: ui
type: scar
title: Telas de cadastro usam + no cabeçalho, com Gastos fixos como exceção
tags: gastos-fixos, empty-state, mobile, desktop, cta, layout
provenance: dito
evidence: Captura da usuária em 2026-08-14; apps/mobile/src/app/recurring-expenses.tsx; typecheck, lint e build:pwa:revenda aprovados
decay: stable
created: 2026-08-05T01:44:08.795932100+00:00
updated: 2026-08-14T17:12:13.558409700+00:00
validated: 2026-08-14T17:12:13.558409700+00:00
links:
---

CORREÇÕES DA USUÁRIA: (1) Fornecedores e Receitas exibiam CTAs textuais pequenos junto ao início da lista, divergindo do padrão global; (2) depois da padronização, Serviços mostrou o CTA inferior estreito, fora da rolagem e visualmente sobreposto ao último card; (3) em 2026-08-05, Gastos fixos recebeu indevidamente um `+` no cabeçalho embora já tenha o CTA largo `Adicionar gasto fixo`, e Embalagens escondia o `+` quando a lista estava vazia; (4) em 2026-08-14, no PWA desktop de Gastos fixos, título e descrição do estado vazio começaram por trás do CTA largo; a primeira margem de 32 px removeu a sobreposição, mas ainda ficou visualmente grudada; (5) em 2026-08-14, no layout mobile de Gastos fixos, os textos voltaram a aparecer por cima do CTA porque `EmptyRecurringState` usava `flex: 0`, colapsando a altura do contêiner no React Native Web.

CORREÇÃO CANÔNICA: telas que criam registros normalmente oferecem um botão circular `+` na ação direita do cabeçalho e mantêm o CTA textual `Adicionar ...` no conteúdo rolável; Embalagens mostra o `+` inclusive no estado vazio. Gastos fixos é exceção: não usa `+` no cabeçalho, preserva somente o CTA largo; seu estado vazio não usa o ícone de recibo/cifrão e mantém título e descrição centralizados. `EmptyRecurringState` deve neutralizar o `flex: 1` padrão do componente compartilhado com `flex: undefined`, preservando a altura natural; no desktop mantém margem superior explícita de 48 px, enquanto no mobile o `gap` do contêiner fornece a separação. No mobile, CTAs finais ocupam 100% da largura útil, têm altura mínima de 52 px e espaço inferior seguro; no desktop podem permanecer compactos. O `FAB` compartilhado possui variante `header` de 44 px.

COMO EVITAR: aplicar o padrão conforme a hierarquia da própria tela, sem duplicar a ação primária; nunca usar `flex: 0` em um estado vazio com conteúdo intrínseco no React Native Web; validar a separação visual, não apenas a presença dos elementos.
