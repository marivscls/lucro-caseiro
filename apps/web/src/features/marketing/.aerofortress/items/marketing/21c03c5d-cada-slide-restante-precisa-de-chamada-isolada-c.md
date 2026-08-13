---
id: 21c03c5d-8c8b-43b9-bdcd-55d8f7c4ee76
slug: marketing
type: scar
title: Cada slide restante precisa de chamada isolada com cursor explícito
tags: marketing, carrossel, geracao-de-imagem, slides, ancora, prompt, orquestracao, migracao, correcao-recorrente
provenance: observado
evidence: apps/api/src/features/marketing/campaign-ai.ts; apps/api/src/features/marketing/marketing.repo.pg.ts; apps/api/src/features/marketing/marketing.system-prompt.ts; apps/web/src/features/marketing/campaign-strategy.ts; 36 testes focados da API, 7 testes web, typechecks, lints e Prettier aprovados em 2026-08-11
decay: stable
created: 2026-08-11T14:09:43.348040300+00:00
updated: 2026-08-11T17:34:00.184549900+00:00
validated: 2026-08-11T17:34:00.184549900+00:00
links:
---

FALHA REAL RECORRENTE (2026-08-11): depois da primeira correção para continuar automaticamente, o gerador passou a produzir novas variações da capa 1/N em vez dos slides 2..N. CAUSA CONFIRMADA NO CONTRATO: productionNotes concatenava literalmente o contrato e todos os blocos SLIDE 1..N, mas apenas pedia chamadas individuais; não proibia o orquestrador de reenviar o prompt total em cada chamada. A ferramenta de imagem voltava então ao primeiro bloco e recriava a capa. CORREÇÃO CANÔNICA: o prompt total é roteiro exclusivo do orquestrador. Sem âncora aprovada, enviar somente o bloco SLIDE 1 e pausar. Com âncora aprovada, iniciar cursor em 2 e, para cada X, chamar a ferramenta uma vez com uma instrução curta `GERE SOMENTE X/N; NÃO GERE 1/N`, somente o bloco literal SLIDE X e a imagem real da capa como referência — nunca o prompt total, o bloco SLIDE 1 ou outro slide. Avançar o cursor apenas quando a saída tiver marcador, copy e cena de X/N; saída que repita 1/N ou a capa é falha a descartar e refazer no mesmo X. Encerrar somente em N/N. RETROCOMPATIBILIDADE OBRIGATÓRIA: campanhas já persistidas devem ter apenas productionNotes recomposto a partir do contrato canônico atual + slidePrompts existentes, preservando literalmente as copies. A normalização acontece ao listar campanhas e antes de publicar uma variante; registros alterados são persistidos sem mexer em updatedAt. COMO EVITAR: instrução de lote não basta; isole deterministicamente o payload de cada chamada, valide o cursor antes de avançar e migre contratos persistidos quando sua versão mudar.
