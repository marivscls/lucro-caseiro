---
id: 2be64826-1488-4759-8265-8d58b218bcb3
slug: dev
type: scar
title: Não confundir projetos, produtos, apps e portas ao abrir previews
tags: preview, portas, catalogo, pwa, ssr
provenance: dito
evidence: 2026-08-16: PID 19584 na porta 3101 iniciou antes da última gravação de apps/api/src/features/catalog/catalog.domain.ts; após reinício, /c/mariana passou a servir o CSS novo. Fixture completa confirmada em http://127.0.0.1:4018/c/mariana-vasconcelos-demo.
decay: stable
created: 2026-07-17T00:59:22.368951300+00:00
updated: 2026-08-17T03:04:42.463225+00:00
validated: 2026-08-17T03:04:42.463225+00:00
links:
---

SINTOMA ORIGINAL: após trabalhar no site público, uma resposta destacou qualquer servidor ativo do workspace em vez da rota/produto solicitado. REGRA: identificar primeiro o produto em foco e provar a URL exata por HTTP e por processo.

RECORRÊNCIA / CORREÇÃO DA USUÁRIA (2026-07-24): o preview do Lucro Caseiro foi mantido e reaberto em `8084`, embora essa seja a porta canônica do Lucro Papelaria. A inspeção mostrou ainda que `8083`, porta canônica do PWA Caseiro, estava ocupada por outro projeto, portanto não poderia ser tomada nem apresentada como Lucro Caseiro.

RECORRÊNCIA / CORREÇÃO DA USUÁRIA (2026-08-14): ao pedir para rodar “o app da Obra”, foi iniciado `apps/web` na porta 3001 apenas com `BRAND=lucro-obra`. Isso não é o app operacional da Obra. O alvo correto é o PWA compartilhado de `apps/mobile`, compilado e servido pela porta canônica do produto.

RECORRÊNCIA / CORREÇÃO DA USUÁRIA (2026-08-16): alterações no renderer SSR `catalog.domain.ts` foram dadas como disponíveis, mas a API local em `3101` havia iniciado antes da última edição e continuava com o módulo antigo em memória. A fixture visual completa estava em outra porta (`4018`) e a URL não havia sido entregue/aberta de forma clara. CORREÇÃO: comparar StartTime do PID com LastWriteTime do renderer, reiniciar somente o processo dono da porta, provar marcadores do HTML e abrir a URL exata. Separar explicitamente a rota real (`3101/c/mariana`, que pode estar vazia conforme o banco) da fixture visual (`4018/c/mariana-vasconcelos-demo`).

COMO EVITAR: antes de iniciar ou abrir um preview, confirmar pacote, script e produto; conferir comando e horário do PID dono da porta; após editar renderer carregado sem watch, reiniciar o processo; validar a URL exata por HTTP e captura real. Nunca apresentar uma fixture em outra porta como se fosse a rota real com dados do banco.
