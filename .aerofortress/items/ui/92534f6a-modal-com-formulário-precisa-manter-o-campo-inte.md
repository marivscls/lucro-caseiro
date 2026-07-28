---
id: 92534f6a-9817-4d3e-b69e-4463b4539627
slug: ui
type: scar
title: Modal com formulário precisa manter o campo inteiro acima do rodapé
tags: modal, keyboard, android, textinput, scrollview, focus, footer, measureInWindow, scrollTo, recorrencia, correcao-insuficiente
provenance: dito
evidence: Seis capturas da usuária em 2026-07-26; apps/mobile/src/shared/components/keyboard-aware-scroll-view.tsx; standard-modal.tsx; keyboard-aware-scroll-view.test.ts; 5 testes direcionados, lint, typecheck e 404 testes mobile aprovados
decay: stable
created: 2026-07-26T02:56:55.321783200+00:00
updated: 2026-07-26T03:31:06.425493900+00:00
validated: 2026-07-26T03:31:06.425493900+00:00
links:
---

SINTOMA ORIGINAL (2026-07-25): campos de formulários em modais ficavam escondidos pelo teclado Android. PRIMEIRA CORREÇÃO INSUFICIENTE: rolar no `onFocus` e usar `KeyboardAvoidingView`; o foco ocorria antes de o teclado terminar de abrir. SEGUNDA CORREÇÃO INSUFICIENTE: ouvir `keyboardDidShow`/`keyboardWillShow` e chamar `scrollResponderScrollNativeHandleToKeyboard` após o layout. TERCEIRA CORREÇÃO DA USUÁRIA (2026-07-26): seis capturas do modal Adicionar pedido provaram que todos os campos abaixo de Data de entrega continuavam ruins; em Valor combinado, Sinal recebido, Observações e Personalização, o conteúdo se deslocava, mas deixava o campo ou a área digitável atrás do rodapé Salvar pedido. CAUSA: `scrollResponderScrollNativeHandleToKeyboard` decide contra o teclado e não contra o viewport rolável efetivo; mesmo compensar a distância até o teclado não garante o retângulo do input dentro da área visível. NOVA IMPLEMENTAÇÃO CANDIDATA: abandonar esse responder para este fluxo; após o resize do teclado, medir em coordenadas de janela tanto o `ScrollView` nativo quanto o `TextInput` focado, comparar o retângulo inteiro do input com `scrollViewTop + clearance` e `scrollViewBottom - clearance`, e chamar `scrollTo` pelo delta real somado ao offset atual rastreado pelo `onScroll`. A mesma medição roda no foco quando o teclado já está aberto. REGRA: o critério é o retângulo inteiro do input dentro do viewport real, acima do rodapé; posicionar apenas o rótulo/início ou calcular contra o topo do teclado é insuficiente. STATUS: implementação, lint, typecheck e testes determinísticos estão verdes, mas só promover esta candidata a correção canônica após validação visual da usuária no Android real.
