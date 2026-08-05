---
id: aacf91fb-0fc2-4ff0-82a1-32ca424b00d0
slug: ui
type: scar
title: Telas de cadastro usam + no cabeçalho, com Gastos fixos como exceção
tags: mobile, ui, cadastro, fab, header, cta, scroll, full-width, gastos-fixos, embalagens
provenance: dito
evidence: Capturas da usuária em 2026-08-04 e 2026-08-05; apps/mobile/src/app/recurring-expenses.tsx; apps/mobile/src/app/packaging.tsx; apps/mobile/src/app/services.tsx; apps/mobile/src/app/labels.tsx; apps/mobile/src/app/materials.tsx; apps/mobile/src/app/quotes.tsx
decay: stable
created: 2026-08-05T01:44:08.795932100+00:00
updated: 2026-08-05T15:22:34.184068300+00:00
validated: 2026-08-05T15:22:34.184068300+00:00
links:
---

CORREÇÕES DA USUÁRIA: (1) Fornecedores e Receitas exibiam CTAs textuais pequenos junto ao início da lista, divergindo do padrão global; (2) depois da padronização, Serviços mostrou o CTA inferior estreito, fora da rolagem e visualmente sobreposto ao último card; (3) em 2026-08-05, Gastos fixos recebeu indevidamente um `+` no cabeçalho embora já tenha o CTA largo `Adicionar gasto fixo`, e Embalagens escondia o `+` quando a lista estava vazia. CORREÇÃO CANÔNICA: telas que criam registros normalmente oferecem um botão circular `+` na ação direita do cabeçalho e mantêm o CTA textual `Adicionar ...` no conteúdo rolável; Embalagens mostra o `+` inclusive no estado vazio. Gastos fixos é exceção: não usa `+` no cabeçalho, preserva somente o CTA largo; seu estado vazio não usa o ícone de recibo/cifrão e mantém título e descrição centralizados. No mobile, CTAs finais ocupam 100% da largura útil, têm altura mínima de 52 px e espaço inferior seguro; no desktop podem permanecer compactos. O `FAB` compartilhado possui variante `header` de 44 px. COMO EVITAR: aplicar o padrão conforme a hierarquia da própria tela, sem duplicar a ação primária; não condicionar o `+` de Embalagens à existência de itens.
