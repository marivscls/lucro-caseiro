---
id: 35942cda-0b6f-418d-b8ad-f2de1baf7445
slug: marketing
type: scar
title: Sugestão automática precisa provar novidade editorial
tags: marketing, conteudo, ia, geracao, novidade, validacao
provenance: observado
evidence: apps/api/src/features/marketing/marketing.usecases.ts; apps/api/src/features/marketing/marketing.usecases.test.ts; relato e captura enviados pela usuária em 2026-08-10
decay: stable
created: 2026-08-11T02:56:45.439904700+00:00
updated: 2026-08-11T02:56:45.439904700+00:00
validated: 2026-08-11T02:56:45.439904700+00:00
links:
---

FALHA REAL (2026-08-10): ao clicar em “Sugerir automaticamente” num post já preenchido, o fluxo enviava CAMPOS ATUAIS à IA sem exigir novidade e aceitava uma resposta que repetia o conteúdo, às vezes mudando apenas analysis ou metadados. CORREÇÃO: no modo generate de conteúdo, tratar os campos atuais somente como contexto, exigir alternativa materialmente diferente e comparar deterministicamente os valores editoriais da resposta com os atuais, ignorando analysis; quando 80% ou mais permanecer igual, rejeitar e fazer uma única tentativa automática de reparo. COMO EVITAR: ações de gerar alternativa não podem compartilhar a semântica de refinar/preencher nem confiar apenas no prompt; validar novidade na fronteira da resposta.
