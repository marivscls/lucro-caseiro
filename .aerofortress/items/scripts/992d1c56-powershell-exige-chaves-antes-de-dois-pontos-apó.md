---
id: 992d1c56-fa41-4590-a9a1-46f196a9cfcb
slug: scripts
type: scar
title: PowerShell exige chaves antes de dois-pontos após variável interpolada
tags: powershell, scripts, maestro, interpolacao
provenance: observado
evidence: C:\Users\maria\AppData\Local\Temp\lucro-mobile-retest-20260803-163311.err.log; C:\Users\maria\AppData\Local\Temp\lucro-mobile-retest-20260803-163343.out.log
decay: stable
created: 2026-08-03T19:39:27.666681900+00:00
updated: 2026-08-03T19:39:27.666681900+00:00
validated: 2026-08-03T19:39:27.666681900+00:00
links:
---

SINTOMA (2026-08-03): um runner temporário de três fluxos Maestro falhou no parse antes de tocar no app ao imprimir `"$flow:$code"`. CAUSA: em string interpolada do PowerShell, `:` logo após o nome é interpretado como parte de uma referência com escopo/drive. CORREÇÃO: delimitar a variável como `"${flow}:$code"`. O runner corrigido executou os fluxos 21, 03 e 04 sequencialmente, todos com saída 0.
