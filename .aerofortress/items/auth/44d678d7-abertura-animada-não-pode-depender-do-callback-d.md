---
id: 44d678d7-d7c2-461a-b27f-fa6afaf6aa7f
slug: auth
type: scar
title: Abertura animada não pode depender do callback do Animated para liberar o login
tags: pwa, login, brand-intro, animated, boot, tela-vazia
provenance: observado
evidence: apps/mobile/src/shared/components/brand-intro.tsx; reprodução em Chrome headless: .aerofortress/tmp/login-probe.png (vazio) e .aerofortress/tmp/login-fixed-2.png (formulário visível); mobile typecheck, lint e 338 testes aprovados em 2026-07-18
decay: stable
created: 2026-07-18T21:50:24.828051300+00:00
updated: 2026-07-18T21:50:24.828051300+00:00
validated: 2026-07-18T21:50:24.828051300+00:00
links:
---

SINTOMA (2026-07-18, PWA): o BrandIntro aparecia e depois a tela ficava totalmente vazia; o formulário de login nunca era montado. API publicada e Supabase estavam saudáveis, e uma captura real do Chrome após 15 s mostrou apenas o fundo escuro. CAUSA: `BrandIntro` tornava a raiz transparente e dependia exclusivamente do callback de conclusão de `Animated.parallel(...).start()` para chamar `onFinish`; no web a animação podia concluir visualmente sem esse callback liberar o app. CORREÇÃO: iniciar a animação de saída e concluir a troca de tela por timer determinístico com a mesma duração, usando ref para o callback atual e guard contra conclusão duplicada. COMO EVITAR: telas de boot/splash nunca devem usar callback de animação como único caminho para montar autenticação ou navegação; sempre manter uma saída determinística e validar no navegador até o formulário real aparecer.
