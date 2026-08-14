---
id: 7b6eb766-9d5b-464c-8af2-95a625fe9f18
slug: ui
type: scar
title: Cabeçalho do seletor de componentes do kit deve empilhar no mobile
tags: mobile, produto-composto, kit, responsividade, sobreposição, formulário
provenance: observado
evidence: apps/mobile/src/features/products/components/component-picker.tsx; captura enviada pela usuária em 2026-08-13; auditoria Playwright em viewport 390×844 gerou .aerofortress/tmp/design-audit/mobile-products-kit.png com os textos em linhas separadas e sem erros no cenário do kit
decay: stable
created: 2026-08-13T21:29:13.101001500+00:00
updated: 2026-08-13T21:29:13.101001500+00:00
validated: 2026-08-13T21:29:13.101001500+00:00
links:
---

SINTOMA (2026-08-13): no modal “Novo produto”, ao selecionar “Produto composto (kit)”, o título “Produtos que compõem o kit” e a ação “Adicionar produto” disputavam a mesma linha no celular; o título ficava cortado e a ação se sobrepunha, tornando o texto ilegível. CORREÇÃO CANÔNICA: em `ComponentPicker`, manter título e ação lado a lado somente no desktop; no mobile, empilhar em coluna, alinhar ao início e preservar ambos os rótulos completos. COMO EVITAR: cabeçalhos formados por título longo + ação textual não devem depender de uma única linha em viewport compacta; validar a composição renderizada em largura móvel.
