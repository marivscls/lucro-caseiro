---
id: 9674878c-104d-4ba8-82e9-2b79833233a7
slug: backend
type: fact
title: Avatar de remetente do Gmail ainda não tem BIMI
tags: 
provenance: observado
evidence: Resolve-DnsName em 2026-08-06; https://support.google.com/a/answer/10911320
decay: seasonal
created: 2026-08-06T13:44:41.521080600+00:00
updated: 2026-08-06T13:44:41.521080600+00:00
validated: 2026-08-06T13:44:41.521080600+00:00
links: 
---

Em 2026-08-06, o DNS de `lucrocaseiro.com.br` tinha DMARC `v=DMARC1; p=none;` e não tinha TXT em `default._bimi.lucrocaseiro.com.br`. O envio Resend estava autenticado por `send.lucrocaseiro.com.br` com SPF `include:amazonses.com`, MX de feedback SES e DKIM `resend._domainkey`. Portanto a logo dentro do HTML funciona, mas o avatar exibido pelo Gmail ao lado do remetente exige um trabalho separado de BIMI/DMARC e não deve ser ativado mudando DMARC diretamente sem auditar todos os emissores.
