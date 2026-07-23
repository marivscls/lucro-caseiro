---
id: 85ed4d34-6a53-4088-9b96-9878eeabae8e
slug: scripts
type: scar
title: PowerShell reserva HOME sem diferenciar maiúsculas
tags: powershell, variaveis, home, scripts, validacao, recorrencia
provenance: observado
evidence: Validação HTTP de https://app.lucrocaseiro.com.br em 2026-07-19 e preflight de https://lucrocaseiro.com.br em 2026-07-23
decay: stable
created: 2026-07-20T01:25:16.317185700+00:00
updated: 2026-07-23T17:37:45.804480100+00:00
validated: 2026-07-23T17:37:45.804480100+00:00
links:
---

SINTOMA (2026-07-19; recorreu em 2026-07-23): validações HTTP falharam parcialmente com `Cannot overwrite variable HOME because it is read-only or constant` ao usar `$home` para guardar a resposta da página inicial. CAUSA: nomes de variáveis do PowerShell não diferenciam maiúsculas de minúsculas, então `$home` colide com a variável automática `$HOME`. CORREÇÃO: usar nomes específicos como `$homeResponse`, `$landingResponse`, `$pwaBaseUrl` e `$cacheStamp`. COMO EVITAR: nunca reutilizar `$HOME`, `$home` ou `$CODEX_HOME` como variável de tarefa, mesmo com casing diferente; antes de executar scripts PowerShell de validação, puxar os scars de `scripts` e revisar nomes contra variáveis automáticas. RECORRÊNCIA: em 2026-07-23, o preflight SEO do domínio recém-migrado para Railway repetiu exatamente o erro apesar desta scar já existir; a prova foi refeita com `$landingResponse`.
