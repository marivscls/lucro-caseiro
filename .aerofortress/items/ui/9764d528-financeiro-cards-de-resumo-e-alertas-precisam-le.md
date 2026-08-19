---
id: 9764d528-df18-4a71-89e3-ab1e565b355f
slug: ui
type: scar
title: Financeiro: cards de resumo e alertas precisam levar aos lançamentos filtrados
tags: financeiro, ui, pressable, scroll, filtros, acessibilidade, react-native-web
provenance: observado
evidence: apps/mobile/src/features/finance/components/finance-dashboard.tsx; validação CDP em 2026-08-16: Entradas e Saídas clicaram, scrollTop=758 e os filtros correspondentes mudaram para o estado selecionado; ESLint, typecheck mobile e build PWA aprovados
decay: stable
created: 2026-08-16T19:28:46.245179300+00:00
updated: 2026-08-16T19:28:46.245179300+00:00
validated: 2026-08-16T19:28:46.245179300+00:00
links:
---

FALHA CORRIGIDA (2026-08-16): os cards `Entradas` e `Saídas` exibiam chevron, mas `SummaryCard` era uma `View` sem `onPress`. O alerta `Despesa acima do padrão` alterava filtro/busca em memória sem rolar até `Lançamentos`, então o toque parecia não funcionar. CORREÇÃO CANÔNICA: cards de resumo são `Pressable` acessíveis; todas essas ações usam o mesmo `showEntries`, que limpa ou preenche a busca, seleciona o tipo e rola o `ScrollView` até o cabeçalho de lançamentos medido por `onLayout`. Alertas de saldo negativo seguem o mesmo fluxo. COMO EVITAR: qualquer card com chevron deve ter semântica e handler reais; quando o efeito ocorre abaixo da dobra, levar a pessoa até o resultado visível.
