---
id: 4480a0c0-6893-45ea-8083-1e74cd1446f7
slug: build
type: scar
title: Mocks e medições nativas de React Native precisam respeitar os tipos reais
tags: react-native, typescript, textinput, keyboard, typecheck, eslint, mock, emittersubscription, scrollview, measureInWindow
provenance: observado
evidence: apps/mobile/src/shared/components/keyboard-aware-scroll-view.tsx, keyboard-aware-scroll-view.test.ts e src/test/setup.ts; falhas TS2339/TS2344/TS18046 e sonarjs/no-nested-functions observadas; typecheck, lint e 403 testes aprovados após a correção
decay: stable
created: 2026-07-26T02:49:57.726316600+00:00
updated: 2026-07-26T03:20:51.110272300+00:00
validated: 2026-07-26T03:20:51.110272300+00:00
links:
---

SINTOMAS (2026-07-25/26): (1) o typecheck do helper `scrollInputAboveKeyboard` falhou porque a função verificava ausência de foco em runtime, mas o parâmetro não aceitava `null | undefined`; (2) o mock de `Keyboard.addListener` devolveu apenas `{ remove }`, enquanto o tipo real exige `EmitterSubscription`; (3) `vi.mocked(TextInput.State.currentlyFocusedInput)` acionou `@typescript-eslint/unbound-method`; (4) tentar chamar `measureInWindow` diretamente no tipo de instância `ScrollView` falhou porque a versão tipada expõe a medição pela referência retornada por `getNativeScrollRef()`; (5) manter o callback de `requestAnimationFrame` dentro do listener excedeu `sonarjs/no-nested-functions`. CORREÇÕES: modelar ausência na assinatura; converter o stub mínimo via `unknown` somente no limite do teste; usar `vi.spyOn(objeto, "metodo")`; obter a referência nativa com `getNativeScrollRef()` e tipar o callback como `MeasureInWindowOnSuccessCallback`; extrair o agendamento pós-layout para uma função de módulo. COMO EVITAR: consultar os tipos reais da versão instalada, manter casts só nos testes e extrair callbacks de integração nativa antes que a estrutura ultrapasse as regras de lint.
