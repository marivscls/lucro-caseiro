---
id: 97eec77b-4bd7-4ac9-9719-96859f9774e8
slug: dev
type: scar
title: Servidor de preview PWA deve sobreviver à troca atômica do export
tags: pwa, preview, rebuild, servidor, enoent
provenance: observado
evidence: apps/mobile/scripts/serve-pwa.mjs; preview validado em http://localhost:8083 e http://localhost:8084
decay: stable
created: 2026-07-19T04:10:20.497016400+00:00
updated: 2026-07-19T04:10:20.497016400+00:00
validated: 2026-07-19T04:10:20.497016400+00:00
links:
---

SINTOMA (2026-07-19): durante uma recompilação, o Expo removeu temporariamente `dist/lucro-papelaria/index.html`; uma requisição simultânea fez o ReadStream emitir ENOENT sem handler e derrubou o servidor da porta 8084. CORREÇÃO: o preview lê o arquivo antes de enviar headers, captura falhas e responde 503/Retry-After sem encerrar o processo. COMO EVITAR: servidor local que aponta para diretório regenerado deve tratar arquivos temporariamente ausentes como atualização em curso, nunca como exceção fatal.
