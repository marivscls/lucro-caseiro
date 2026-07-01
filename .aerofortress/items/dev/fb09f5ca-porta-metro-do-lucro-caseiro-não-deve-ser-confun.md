---
id: fb09f5ca-7486-480d-bdc5-15d3e081a096
slug: dev
type: rule
title: Porta Metro do Lucro Caseiro não deve ser confundida com Lunoa
tags: metro, mobile, lunoa, porta
provenance: dito
evidence: Dito pelo usuário: "lembre que o lunoa tambem esta rodando entao nao confunda os apps"; observado nesta sessão via processo Expo em 8082 apontando para lucro-caseiro.
decay: stable
created: 2026-06-29T18:41:11.129761300+00:00
updated: 2026-06-29T18:41:11.129761300+00:00
validated: 2026-06-29T18:41:11.129761300+00:00
links: 
---

O usuário avisou que o projeto Lunoa também pode estar rodando ao mesmo tempo que o Lucro Caseiro. Antes de abrir, debugar ou instalar o app mobile, confirmar pela linha de comando do processo Metro/Expo que a porta usada pertence a `C:\Users\maria\Documents\projects\lucro-caseiro\apps\mobile`, e não a `lunoa`. Nesta sessão, o Metro correto do Lucro Caseiro foi colocado na porta 8082; se houver conflito, não assumir pela porta sozinha: verificar `Get-CimInstance Win32_Process` pelo PID dono da porta.
