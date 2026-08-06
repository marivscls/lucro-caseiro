---
id: 51c0d415-5ac0-46fa-8a5b-d05f6b671d6e
slug: scripts
type: scar
title: SQL inline via Railway no PowerShell pode virar redirecionamento e criar arquivo
tags: powershell, railway, sql, shell, arquivos-temporarios
provenance: observado
evidence: Falha observada em 2026-08-06; arquivo NOW() removido; apps/api/.tmp-list-new-users.mjs executou a consulta com sucesso e foi removido
decay: stable
created: 2026-08-06T13:05:49.518586700+00:00
updated: 2026-08-06T13:05:49.518586700+00:00
validated: 2026-08-06T13:05:49.518586700+00:00
links: 
---

SINTOMA (2026-08-06): uma consulta Node/SQL passada inline por `railway run ... tsx -e` falhou antes de acessar o banco e criou no root um arquivo `NOW()` contendo a linha de comando mutilada. CAUSA: o encadeamento Windows/PowerShell/cmd perdeu as aspas do SQL e interpretou operadores como redirecionamento. CORREÇÃO: remover o arquivo acidental e executar consultas complexas por um script temporário versionável/criado com apply_patch, nunca por SQL inline atravessando várias camadas de shell. PREVENÇÃO: para Railway no Windows, manter o comando-filho simples e colocar SQL/TypeScript em arquivo; depois remover o temporário e conferir `git status`.
