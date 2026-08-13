---
id: a1334f5d-24d2-4120-b3fd-ea7288e15b68
slug: scripts
type: scar
title: Limpeza por CommandLine deve filtrar também o executável alvo
tags: powershell, processos, stop-process, commandline, chrome, node, preview, limpeza, recorrencia
provenance: observado
evidence: Sessões de 2026-07-18 e 2026-08-11: comandos de limpeza terminaram com exit -1 ao casar o PowerShell atual; repetição segura deve restringir Name/executável ou PIDs exatos.
decay: stable
created: 2026-07-17T01:38:06.251647200+00:00
updated: 2026-08-11T17:44:32.804813100+00:00
validated: 2026-08-11T17:44:32.804813100+00:00
links: 
---

SINTOMA (2026-07-16; recorreu em 2026-07-18 e 2026-08-11): ao encerrar processos temporários, o filtro buscou apenas uma substring em `Win32_Process.CommandLine`; o próprio PowerShell continha essa substring no comando em execução e foi encerrado junto, retornando exit -1. Em 2026-08-11 isso ocorreu ao reiniciar `preview:pwa:caseiro`: a regex `@lucro-caseiro/mobile preview:pwa:caseiro|serve-pwa...` também casou o shell que carregava o texto do comando. CAUSA: correspondência textual ampla sem restringir o nome do processo. REGRA: antes de `Stop-Process` por CommandLine, filtrar também `Name`/executável esperado (por exemplo, `Name -eq 'node.exe'`) ou usar PIDs exatos previamente observados; nunca matar toda ocorrência de uma substring que aparece no script atual. A proteção precisa estar no filtro do executável, não só no nome da variável.
