---
id: 2e9e53ee-c488-4570-a38b-1a75c3dc24d1
slug: build
type: scar
title: Build PWA no Windows pode falhar com EPERM no cache global do Metro
tags: expo, metro, windows, pwa, eperm, enotempty, eexist, enoent, cache, build
provenance: observado
evidence: Execuções observadas em 2026-08-17, 2026-08-18 e 2026-08-24; `pnpm --filter @lucro-caseiro/mobile build:pwa:caseiro`; apps/mobile/dist/lucro-caseiro; bundle final entry-58144bc5efb1e54272bcedf088848f53.js
decay: stable
created: 2026-08-17T03:22:02.831361600+00:00
updated: 2026-08-24T14:14:14.531075+00:00
validated: 2026-08-24T14:14:14.531075+00:00
links:
---

FALHA CORRIGIDA (2026-08-17): `build:pwa:caseiro` falhou com `EPERM` ao limpar `%LOCALAPPDATA%\Temp\metro-cache\00`, e processos do export permaneceram ativos. Repetir sem tratar a árvore presa manteve a disputa. CORREÇÃO: identificar PIDs pela linha de comando, encerrar somente a árvore exata do export falho e repetir o script canônico.

RECORRÊNCIA (2026-08-18): o mesmo `EPERM` ocorreu sem árvore de export ativa. A exportação concluiu ao definir `TEMP` e `TMP` para um diretório temporário isolado e executar o mesmo build.

RECORRÊNCIA (2026-08-24): a primeira exportação falhou com `EEXIST` ao copiar `images/embalagens`; a repetição falhou com `ENOTEMPTY` no cache global `metro-cache/00`. A saída parcial também continha caminhos longos que `Remove-Item -Recurse` não limpou. CORREÇÃO: validar que `apps/mobile/dist/lucro-caseiro` está dentro do workspace, remover somente essa saída gerada com `[IO.Directory]::Delete('\\?\<caminho>', $true)`, apontar `TEMP` e `TMP` para diretório exclusivo da tarefa e executar novamente.

NOVA RECORRÊNCIA (2026-08-24, onboarding etapa 3): o export falhou primeiro com `ENOENT` ao aplicar chmod em `dist/lucro-caseiro/icon-192.png`; a repetição sem limpeza encontrou `ENOTEMPTY` em `metro-cache/49`. Não havia processo de export ativo. Após validar o alvo absoluto, remover somente `apps/mobile/dist/lucro-caseiro`, isolar `TEMP`/`TMP` e repetir o script canônico, o PWA concluiu com o bundle `entry-58144bc5efb1e54272bcedf088848f53.js`.

COMO EVITAR: após falha de cache/saída do Metro no Windows, verificar primeiro processos filhos do export. Se houver, encerrar apenas a árvore exata; se não houver, usar `TEMP`/`TMP` isolados. Quando a saída parcial precisar ser recriada, validar o alvo absoluto antes de removê-lo e usar o prefixo de caminho longo do Windows. Nunca matar todos os processos Node nem apagar cache compartilhado às cegas.
