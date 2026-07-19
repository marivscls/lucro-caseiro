---
id: 2bd6e0e7-5dbc-443c-81bd-5ce037cc8104
slug: scripts
type: scar
title: Detecção de Expo não pode procurar apenas texto contíguo `expo start`
tags: powershell, expo, metro, porta, processos, diagnostico
provenance: observado
evidence: PID 19832 em 2026-07-18: node C:\Users\maria\Documents\projects\lucro-caseiro\apps\mobile\node_modules\.bin\..\expo\bin\cli start --dev-client --port 8083 --lan --clear; Get-NetTCPConnection confirmou LISTEN em 8083
decay: stable
created: 2026-07-18T20:51:09.540336500+00:00
updated: 2026-07-18T20:51:09.540336500+00:00
validated: 2026-07-18T20:51:09.540336500+00:00
links:
---

SINTOMA (2026-07-18): a checagem declarou `NO_WORKSPACE_SERVERS`, mas a porta 8083 estava ocupada por um Metro do próprio workspace. CAUSA: o filtro exigia a regex contígua `expo\s+start`; a CommandLine real era `node ...\expo\bin\cli start --dev-client --port 8083`, com o caminho `bin\cli` entre `expo` e `start`. CORREÇÃO: primeiro resolver listeners com `Get-NetTCPConnection`, depois inspecionar exatamente os PIDs via `Win32_Process`; para Expo, reconhecer o executável/CLI e o argumento `start` separadamente. Nunca concluir que uma porta está livre apenas por uma regex textual sobre CommandLine.
