---
id: 23379028-245d-4416-a03c-4697a8784542
slug: ui
type: scar
title: Adicionar pedido mantém respiro entre grupos apenas no PWA compacto
tags: pedidos, encomendas, formulario, pwa, react-native-web, flexbox, flex-basis, mobile-nativo, espacamento, data, horario, recorrencia, correcao-insuficiente
provenance: dito
evidence: Capturas e correções da usuária em 2026-07-25 e 2026-07-26; apps/mobile/src/features/orders/components/order-form.tsx; a captura de 2026-07-26 rejeitou a correção baseada apenas em gap; nova candidata passou em ESLint, typecheck e build PWA
decay: stable
created: 2026-07-26T00:50:14.316639100+00:00
updated: 2026-07-26T03:51:24.881839900+00:00
validated: 2026-07-26T03:51:24.881839900+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): no formulário “Adicionar encomenda”, o rótulo “Horário (opcional)” aparecia colado ao campo de data. PRIMEIRA CORREÇÃO INSUFICIENTE: aplicar 24 px a toda composição mobile atingiu também Android/iOS. SEGUNDA CORREÇÃO INSUFICIENTE (2026-07-26): restringir somente o `gap` a `Platform.OS === "web" && !isDesktop` passou em ESLint, typecheck e build, mas nova captura da usuária provou que visualmente “Horário (opcional)” continuava colado ao input de data. CAUSA IDENTIFICADA: os filhos do contêiner empilhado ainda mantinham `flex: 1`, regra própria da disposição horizontal; no React Native Web, o grupo de Data (mais alto) era comprimido e seu conteúdo transbordava sobre o gap, enquanto pares de mesma altura pareciam corretos. NOVA IMPLEMENTAÇÃO CANDIDATA: definir `isCompactPwa`, manter 24 px no contêiner e omitir `flex: 1` de cada grupo somente nessa composição; desktop e Android/iOS preservam 16 px e flex horizontal. REGRA: ao converter uma linha com filhos `flex: 1` em coluna no PWA, remover esse flex antes de confiar no `gap`; build verde não prova espaço visível. STATUS: lint direcionado, typecheck e build PWA verdes; aguarda validação visual da usuária no PWA.
