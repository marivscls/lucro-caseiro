---
id: 2be64826-1488-4759-8265-8d58b218bcb3
slug: dev
type: scar
title: Não confundir site público, PWA principal e Central de Marketing ao informar portas
tags: site-publico, pwa, expo, nextjs, porta, apps-mobile, apps-web
provenance: dito
evidence: Correção explícita da usuária em 2026-07-16; HTTP de `/landing` falhou em 3002 antes de o servidor ser iniciado e respondeu 200 depois
decay: stable
created: 2026-07-17T00:59:22.368951300+00:00
updated: 2026-07-17T01:20:52.344550400+00:00
validated: 2026-07-17T01:20:52.344550400+00:00
links:
---

SINTOMA: após trabalhar no site público, a usuária perguntou “qual a porta?” e a resposta destacou um processo Expo em 8083 que respondia HTTP 200, embora o alvo da conversa — o site público em `/landing` — não estivesse rodando na porta 3002. CAUSA: a checagem tratou qualquer servidor do workspace como resposta e não preservou o referente imediato da conversa. REGRA: em perguntas ambíguas sobre porta/estado, identificar primeiro o produto em foco e provar a URL exata por HTTP. O site público vive em `apps/web` na rota `/landing` e usa 3002 em desenvolvimento; a Central de Marketing compartilha esse Next.js em `/`; o PWA principal para quem não usa Android é o Expo em `apps/mobile`, normalmente 8083. Não listar um servidor alheio como se resolvesse o alvo perguntado.
