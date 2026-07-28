---
id: 2be64826-1488-4759-8265-8d58b218bcb3
slug: dev
type: scar
title: Não confundir projetos, marcas e portas ao abrir previews
tags: porta, preview, pwa, marcas, lunoa, lucro-caseiro, processos, recorrencia
provenance: dito
evidence: Correção explícita da usuária em 2026-07-24; Get-NetTCPConnection/Get-CimInstance: 8083 PID 25868 Lunoa, 8084 PID 17696 Lucro Caseiro; apps/mobile/package.json
decay: stable
created: 2026-07-17T00:59:22.368951300+00:00
updated: 2026-07-25T02:54:03.608327500+00:00
validated: 2026-07-25T02:54:03.608327500+00:00
links:
---

SINTOMA ORIGINAL: após trabalhar no site público, uma resposta destacou qualquer servidor ativo do workspace em vez da rota/produto solicitado. REGRA: identificar primeiro o produto em foco e provar a URL exata por HTTP e por processo.

RECORRÊNCIA / CORREÇÃO DA USUÁRIA (2026-07-24): o preview do Lucro Caseiro foi mantido e reaberto em `8084`, embora essa seja a porta canônica do Lucro Papelaria. A usuária percebeu a porta errada enquanto a tela continuava branca. A inspeção mostrou ainda que `8083`, porta canônica do PWA Caseiro, estava ocupada por `C:\Users\maria\Documents\projects\lunoa\apps\mobile\scripts\serve-pwa.mjs`, portanto não poderia ser tomada nem apresentada como Lucro Caseiro. COMO EVITAR: antes de iniciar ou abrir um preview, conferir o comando do PID dono da porta; preservar outros projetos; usar a porta canônica apenas se estiver livre e, em conflito, escolher uma porta temporária livre, declarar a exceção e não reutilizar uma porta canônica de outra marca.
