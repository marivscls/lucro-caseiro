---
id: a1334f5d-24d2-4120-b3fd-ea7288e15b68
slug: scripts
type: scar
title: Limpeza por CommandLine deve filtrar também o executável alvo
tags: powershell, processos, stop-process, commandline, chrome, limpeza, recorrencia
provenance: observado
evidence: Sessão de 2026-07-18: primeira limpeza de .aerofortress/tmp/chrome-ai-debug-20260718 terminou com exit -1; repetição restringindo Name -eq 'chrome.exe' removeu o perfil e confirmou a porta 9333 fechada.
decay: stable
created: 2026-07-17T01:38:06.251647200+00:00
updated: 2026-07-18T04:22:51.223612+00:00
validated: 2026-07-18T04:22:51.223612+00:00
links: 
---

SINTOMA (2026-07-16; recorreu em 2026-07-18): ao encerrar um Chrome headless temporário, o filtro buscou apenas a substring do perfil em `Win32_Process.CommandLine`; o próprio PowerShell continha essa substring no comando em execução e foi encerrado junto, retornando exit -1. CAUSA: correspondência textual ampla sem restringir o nome do processo. REGRA: antes de `Stop-Process` por CommandLine, filtrar também `Name`/executável esperado (por exemplo, `Name -eq 'chrome.exe'`) e nunca matar toda ocorrência de uma substring que aparece no script atual. RECORRÊNCIA: mesmo evitando `$PID`, o erro voltou porque a proteção precisa estar no filtro do executável, não só no nome da variável de iteração.
