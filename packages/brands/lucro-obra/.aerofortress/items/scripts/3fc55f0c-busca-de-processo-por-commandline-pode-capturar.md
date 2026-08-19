---
id: 3fc55f0c-c011-4308-9021-2a8c7b200bf0
slug: scripts
type: scar
title: Busca de processo por CommandLine pode capturar o próprio diagnóstico
tags: powershell, processos, dev-server, falso-positivo
provenance: observado
evidence: Sessão de 2026-08-14: a busca por `turbo run dev` retornou somente o PowerShell do próprio comando, PID 6796.
decay: stable
created: 2026-08-14T18:15:17.079611200+00:00
updated: 2026-08-14T18:15:17.079611200+00:00
validated: 2026-08-14T18:15:17.079611200+00:00
links:
---

Ao procurar um processo com `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match '<termo>' }`, o PowerShell que executa a própria busca pode conter o termo na linha de comando e gerar falso positivo. Exclua `ProcessId -eq $PID` (e, quando necessário, valide o executável/porta real) antes de concluir que um serviço já está ativo.
