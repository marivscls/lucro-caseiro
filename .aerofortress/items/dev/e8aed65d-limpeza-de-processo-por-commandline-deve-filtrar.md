---
id: e8aed65d-325e-4533-8529-cd77dbd4b98c
slug: dev
type: scar
title: Limpeza de processo por CommandLine deve filtrar o executável antes do texto
tags: powershell, processos, chrome, cdp, seguranca
provenance: observado
evidence: Sessão de validação visual de apps/mobile em 2026-08-18; encerramento seguro posterior pelo listener 9230
decay: stable
created: 2026-08-19T02:02:02.466350300+00:00
updated: 2026-08-19T02:02:02.466350300+00:00
validated: 2026-08-19T02:02:02.466350300+00:00
links:
---

FALHA CORRIGIDA (2026-08-18): ao encerrar um Chrome headless temporário, um comando filtrou todos os `Win32_Process` apenas por um trecho do perfil presente em `CommandLine`. O próprio PowerShell que executava o comando continha esse trecho no texto da linha e foi encerrado, interrompendo a checagem. CORREÇÃO: resolver o PID pelo listener dedicado (neste caso a porta CDP 9230), confirmar que o processo é `chrome.exe`/`msedge.exe` e só então encerrar o PID exato. COMO EVITAR: nunca usar busca textual global em `CommandLine` como único critério de `Stop-Process`; sempre restringir primeiro por nome/executável ou por PID previamente resolvido.
