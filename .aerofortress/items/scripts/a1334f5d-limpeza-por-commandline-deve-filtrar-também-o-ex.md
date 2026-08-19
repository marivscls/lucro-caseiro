---
id: a1334f5d-24d2-4120-b3fd-ea7288e15b68
slug: scripts
type: scar
title: Limpeza por CommandLine deve filtrar também o executável alvo
tags: windows, powershell, processos, preview, commandline, stop-process
provenance: observado
evidence: Recorrência em 2026-08-16 ao reiniciar previews 8083/8093; o filtro de Win32_Process por CommandLine encerrou o próprio PowerShell (exit -1). Recuperação: confirmar portas sem listener e iniciar node serve-pwa.mjs com PIDs 30368/17476.
decay: stable
created: 2026-07-17T01:38:06.251647200+00:00
updated: 2026-08-16T18:00:26.135566300+00:00
validated: 2026-08-16T18:00:26.135566300+00:00
links:
---

SINTOMA (2026-07-16; recorreu em 2026-07-18, 2026-08-11 e 2026-08-16): ao encerrar processos temporários, o filtro buscou apenas uma substring em `Win32_Process.CommandLine`; o próprio PowerShell continha essa substring no comando em execução e foi encerrado junto, retornando exit -1. Na recorrência de 2026-08-16, o filtro por `scripts/serve-pwa.mjs lucro-caseiro` encerrou o shell de inspeção e derrubou os previews 8083/8093; ambos foram recuperados em seguida com novos processos Node. CAUSA: correspondência textual ampla sem restringir o nome do processo. REGRA: antes de `Stop-Process` por CommandLine, filtrar também `Name -eq "node.exe"`/executável esperado ou, preferencialmente, resolver os PIDs exatos pelos listeners das portas e conferir suas linhas de comando em uma etapa somente leitura; nunca matar toda ocorrência de uma substring que aparece no script atual. A proteção precisa estar no filtro do executável e no PID confirmado, não só no texto da variável.
