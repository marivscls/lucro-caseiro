---
id: 270ab4ef-2315-463e-99be-1e7b6cb321e2
slug: security
type: scar
title: Nunca listar variáveis Railway em modo JSON durante diagnóstico
tags: railway, secrets, cli, diagnostico, incident
provenance: observado
evidence: Comando diagnóstico executado nesta sessão em 2026-08-04; ajuda da Railway CLI: JSON e KV incluem valores brutos
decay: stable
created: 2026-08-05T00:54:10.699802700+00:00
updated: 2026-08-05T00:54:10.699802700+00:00
validated: 2026-08-05T00:54:10.699802700+00:00
links: 
---

SINTOMA (2026-08-04): durante o diagnóstico de CORS, `railway variables --service ... --json` imprimiu no log da ferramenta todas as variáveis brutas do serviço, incluindo credenciais de produção. CAUSA: a CLI avisa que JSON/KV contém valores crus, mas o comando foi usado para descobrir apenas nomes e domínios. PREVENÇÃO: nunca executar `railway variables --json` ou `--kv` em uma sessão visível; quando precisar de metadados não sensíveis, consultar `railway status` ou capturar a saída localmente e emitir somente uma allowlist de chaves não secretas sem deixar o resultado bruto atravessar a ferramenta. Se ocorrer, informar a proprietária e rotacionar as credenciais expostas.
