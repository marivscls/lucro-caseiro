---
id: 2e9e53ee-c488-4570-a38b-1a75c3dc24d1
slug: build
type: scar
title: Build PWA no Windows pode falhar com EPERM no cache global do Metro
tags: expo, metro, windows, pwa, eperm, cache, build
provenance: observado
evidence: Falha e recuperação observadas em 2026-08-17 e 2026-08-18; build:pwa:caseiro; bundle entry-68e8ecca4c3e20945a33fec3d9098f8f.js
decay: stable
created: 2026-08-17T03:22:02.831361600+00:00
updated: 2026-08-19T02:14:51.284864100+00:00
validated: 2026-08-19T02:14:51.284864100+00:00
links:
---

FALHA CORRIGIDA (2026-08-17): `build:pwa:caseiro` falhou com `EPERM` ao limpar `%LOCALAPPDATA%\Temp\metro-cache\00`, e os processos `generate-pwa-service-worker.mjs`, `pnpm exec expo export` e `expo export` permaneceram ativos mesmo depois de o comando pai reportar erro. Repetir o build sem tratar a árvore presa mantém a disputa do cache. CORREÇÃO: identificar os PIDs pela linha de comando, encerrar somente a árvore exata do export falho e repetir o script canônico.

RECORRÊNCIA (2026-08-18): o mesmo `EPERM` ocorreu sem deixar árvore de export ativa. A exportação concluiu ao definir `TEMP` e `TMP` para um diretório temporário isolado dentro de `.aerofortress/`, executar o mesmo `build:pwa:caseiro` e remover o diretório depois. O bundle `entry-68e8ecca4c3e20945a33fec3d9098f8f.js` foi gerado e servido com HTTP 200.

COMO EVITAR: após EPERM do Metro no Windows, primeiro verificar se há processos filhos do export ainda vivos. Se houver, encerrar apenas a árvore exata; se não houver, usar `TEMP`/`TMP` isolados para a tentativa seguinte. Nunca matar todos os processos Node nem apagar o cache compartilhado às cegas.
