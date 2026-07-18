---
id: 9985e011-ba0e-4fe1-b5fb-37a65f0f7da5
slug: ui
type: scar
title: Desktop: formulários e ações não podem ser o mobile esticado
tags: desktop, responsividade, formularios, modais, validacao-visual
provenance: dito
evidence: Capturas da usuária em 2026-07-17: detalhe/edição de encomenda, novo/editar cliente e editar insumo continuam ocupando quase 1.900 px após a alegada implementação.
decay: stable
created: 2026-07-17T13:15:15.936254900+00:00
updated: 2026-07-17T15:38:09.836455200+00:00
validated: 2026-07-17T15:38:09.836455200+00:00
links: 
---

CORREÇÕES DA USUÁRIA (2026-07-17): CTAs de Precificação/Produtos e o formulário Novo produto revelaram que controles mobile eram ampliados no desktop. Depois de uma implementação baseada em helpers de `maxWidth`, a usuária mostrou capturas de detalhe/edição de encomenda, Novo cliente, Editar cliente e Editar insumo ainda esticados por toda a viewport. FALHA: typecheck, lint, testes unitários e build não comprovam efeito visual; afirmar que todas as telas foram ajustadas sem screenshots reais foi incorreto. COMO EVITAR: cada família de modal/tela precisa de contenção observável no elemento DOM/superfície correta, e a entrega só pode ser declarada após auditoria visual em viewport desktop representativa. A regra deve limitar a superfície/modal e o conteúdo, não depender apenas de `contentContainerStyle` em ScrollView.
