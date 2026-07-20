---
id: 85ed4d34-6a53-4088-9b96-9878eeabae8e
slug: scripts
type: scar
title: PowerShell reserva HOME sem diferenciar maiúsculas
tags: powershell, variaveis, home, scripts, validacao
provenance: observado
evidence: Falha e correção observadas ao validar https://app.lucrocaseiro.com.br em 2026-07-19
decay: stable
created: 2026-07-20T01:25:16.317185700+00:00
updated: 2026-07-20T01:25:16.317185700+00:00
validated: 2026-07-20T01:25:16.317185700+00:00
links:
---

SINTOMA (2026-07-19): a validação HTTP do novo domínio falhou antes das requisições com `Cannot overwrite variable HOME because it is read-only or constant` ao usar `$home` para guardar a resposta da página inicial. CAUSA: nomes de variáveis do PowerShell não diferenciam maiúsculas de minúsculas, então `$home` colide com a variável automática `$HOME`. CORREÇÃO: usar nomes específicos como `$homeResponse`, `$pwaBaseUrl` e `$cacheStamp`. COMO EVITAR: nunca reutilizar `$HOME`, `$home` ou `$CODEX_HOME` como variável de tarefa, mesmo com casing diferente.
