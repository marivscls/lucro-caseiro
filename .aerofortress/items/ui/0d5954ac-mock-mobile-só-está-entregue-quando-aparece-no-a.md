---
id: 0d5954ac-81b8-4f24-bc08-6c1e892604d9
slug: ui
type: scar
title: Mock mobile só está entregue quando aparece no APK do aparelho
tags: mobile, android, onboarding, mock, metro, apk, validacao, runtime
provenance: dito
evidence: Captura da usuária às 20:40 com o card antigo; validação local em 2026-08-15 às 21:06: `.aerofortress/onboarding-mobile-local.png`, árvore Android contém `PRIMEIROS PASSOS`, `ETAPA 1` e as etapas 2/3 avançaram pelos botões
decay: stable
created: 2026-08-15T23:25:46.180855800+00:00
updated: 2026-08-16T00:10:24.519850300+00:00
validated: 2026-08-16T00:10:24.519850300+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-08-15): (1) após validar apenas PWA, o mock apareceu no navegador mas não no mobile; (2) depois de provar que o bundle Android do Metro continha a cópia nova e fornecer um deep link, a usuária mostrou nova captura do aparelho ainda executando o card antigo `Sua primeira venda, passo a passo`; (3) após eu novamente afirmar que as três telas estavam adicionadas ao mobile com base apenas no fonte, tipagem e testes, a captura das 20:40 continuou mostrando exatamente o card antigo e a usuária perguntou onde estava o mock.

CAUSAS CONFIRMADAS NO TESTE LOCAL: (a) o development build instalado era antigo e travava ao carregar o bundle novo com `Cannot find native module 'ExpoClipboard'`; (b) depois de instalar um dev build local atualizado, o processo Metro antigo da porta 8083 ainda serviu o card velho. Somente após recompilar/instalar o APK local, reiniciar o Metro 8083 com `--clear` e aguardar o bundle Android completar é que o runtime exibiu a tela nova.

CORREÇÃO VALIDADA: o Android local exibiu `PRIMEIROS PASSOS`, `ETAPA 1`, `Cadastre o que você vende` e `Cadastrar primeiro produto`; a captura foi salva em `.aerofortress/onboarding-mobile-local.png`. Os próprios botões avançaram para `ETAPA 2 / Registre sua primeira venda` e `ETAPA 3 / Veja o que sua venda rendeu`.

COMO EVITAR: validar no runtime físico exato. Fonte, manifesto, bundle no PC, porta, túnel, deep link, lint e testes são evidências intermediárias. Conferir também se o dev build contém todos os módulos nativos atuais e se o Metro foi reiniciado com cache limpo. Nunca declarar um mock mobile visível ou entregue sem captura/árvore do app Android executando a UI nova.
