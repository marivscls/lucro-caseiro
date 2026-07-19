---
id: 32a2aa5c-3314-4b62-b8e9-da7733811fd2
slug: scripts
type: scar
title: PowerShell pode corromper acentos em script enviado ao Node por stdin
tags: powershell, utf8, node, stdin, validacao
provenance: observado
evidence: execução de validação do seed-labels-mariana.sql em 2026-07-19
decay: stable
created: 2026-07-19T20:03:02.916205400+00:00
updated: 2026-07-19T20:03:02.916205400+00:00
validated: 2026-07-19T20:03:02.916205400+00:00
links:
---

SINTOMA (2026-07-19): uma validação de rótulos acusou todas as advertências acentuadas como inválidas, embora o banco mostrasse os textos corretos. CAUSA: literais Unicode embutidos no here-string enviado pelo pipeline do Windows PowerShell chegaram ao Node como `?` (code point 63); os valores lidos pelo Node diretamente do arquivo UTF-8 e armazenados no PostgreSQL estavam corretos (`É`=201, `Ú`=218). PREVENÇÃO: em verificadores Node enviados por stdin no PowerShell, construir caracteres não ASCII com `String.fromCodePoint(...)` ou executar um arquivo UTF-8, e comparar code points antes de alterar dados.
