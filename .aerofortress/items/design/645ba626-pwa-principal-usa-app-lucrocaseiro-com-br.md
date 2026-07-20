---
id: 645ba626-4342-4a78-b428-90048f2166ca
slug: design
type: decision
title: PWA principal usa app.lucrocaseiro.com.br
tags: dominio, pwa, railway, dns, hostinger, https
provenance: observado
evidence: Railway custom domain ad192a61-9870-4f80-94fd-8fb8e79b3dbf; DNS Hostinger; validação HTTP em https://app.lucrocaseiro.com.br em 2026-07-19
decay: stable
created: 2026-07-20T01:08:52.990815200+00:00
updated: 2026-07-20T01:25:24.741611700+00:00
validated: 2026-07-20T01:25:24.741611700+00:00
links:
---

A usuária escolheu `https://app.lucrocaseiro.com.br` como domínio próprio do PWA principal, preservando `lucrocaseiro.com.br`/`www` para o site público e `catalogo.lucrocaseiro.com.br` para o catálogo/API. O domínio está vinculado ao serviço Railway `@lucro-caseiro/mobile` na porta 8080 com CNAME e TXT verificados, certificado HTTPS válido e renovação automática. Em 2026-07-19, `/`, `/labels`, o bundle e `sw.js` responderam HTTP 200 pelo domínio novo. O domínio Railway original foi preservado como fallback; não removê-lo sem considerar instalações e links antigos.
