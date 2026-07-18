---
id: 363df71b-b9f2-4f9f-8264-d826c2fa506f
slug: scripts
type: scar
title: PowerShell: não usar $pid como variável de iteração
tags: powershell, pid, servidor-dev, porta, reinicio, eaddrinuse
provenance: observado
evidence: Reinício local da Central de Marketing na porta 3002 em 2026-07-17; primeira tentativa deixou PID 34804 ativo e nova instância registrou EADDRINUSE; segunda tentativa com `$processId` iniciou o servidor PID 15540 e HTTP 200.
decay: stable
created: 2026-07-18T00:34:52.842013800+00:00
updated: 2026-07-18T00:34:52.842013800+00:00
validated: 2026-07-18T00:34:52.842013800+00:00
links: 
---

SINTOMA (2026-07-17): a primeira tentativa de reiniciar o servidor web não encerrou nenhum processo e iniciou uma segunda instância que falhou com `EADDRINUSE`. CAUSA: o loop usou `$pid`; nomes de variáveis do PowerShell são case-insensitive e `$PID` é uma variável automática somente leitura, então a atribuição do `foreach` falhou. CORREÇÃO: usar um nome específico como `$processId`, confirmar as linhas de comando da árvore antes de encerrá-la, aguardar a porta ficar livre e só considerar o novo servidor pronto quando a porta tiver um novo processo e responder HTTP 200. COMO EVITAR: nunca declarar `$pid`/`$PID` em scripts PowerShell; reservar nomes automáticos do shell.
