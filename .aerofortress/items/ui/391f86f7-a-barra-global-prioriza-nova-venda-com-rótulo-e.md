---
id: 391f86f7-c431-4432-bef3-affc540c11e8
slug: ui
type: scar
title: A barra global prioriza Nova venda com rótulo e segue a referência Lucide
tags: tab-bar, navegacao, nova-venda, lucide, referencia-visual, mobile
provenance: dito
evidence: Referência visual e especificação da usuária em 2026-07-25; apps/mobile/src/app/tabs/_layout.tsx
decay: stable
created: 2026-07-25T19:46:43.978520300+00:00
updated: 2026-07-25T20:53:40.281825300+00:00
validated: 2026-07-25T20:53:40.281825300+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-07-25): a navegação exclusiva do Financeiro foi removida em favor da barra padrão; a substituição do `+` por Financeiro foi reavaliada porque Financeiro tende a ser consulta menos frequente que registrar uma venda; por fim, a usuária pediu reprodução fiel da referência visual com Lucide. CORREÇÃO CANÔNICA MAIS RECENTE: a barra global é uma superfície branca flutuante, arredondada e com sombra suave; usa `Início`, `Vendas`, `Nova venda`, `Agenda` (ou `Clientes` quando a feature não está disponível) e `Mais`. `Nova venda` aparece rotulada com `ShoppingBag` e badge rosa de `Plus`, sem botão flutuante. O item selecionado recebe fundo rosa suave envolvendo ícone e rótulo. Ícones canônicos: House/ShoppingBag/CalendarDays/Ellipsis em `lucide-react-native`, 23 px (Ellipsis 25), traços 1.9 (Ellipsis/Plus 2.2), ativo `#B96870`, inativo `#5D5853`, badge `#C9787E` 18×18. Financeiro fica na Home/Mais e continua acessível pela rota oculta. COMO EVITAR: não usar ação global ambígua (`+` sem rótulo), não voltar a Ionicons/AppIcon nessa barra, não limitar o fundo ativo somente ao ícone e não ocupar o centro com uma tela de consulta menos frequente.
