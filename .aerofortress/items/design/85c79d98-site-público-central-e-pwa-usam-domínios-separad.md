---
id: 85c79d98-ace6-4fa8-be97-d5771b0c9ad4
slug: design
type: decision
title: Site público, Central e PWA usam domínios separados
tags:
provenance: dito
evidence: commits 38d21d9 e 974d1a5; Railway custom domain 2de5b200-7104-4d75-9b50-103fa3d63e11
decay: stable
created: 2026-08-09T15:18:17.015631600+00:00
updated: 2026-08-09T15:18:17.015631600+00:00
validated: 2026-08-09T15:18:17.015631600+00:00
links:
---

Decisão confirmada pela usuária e implementada em 2026-08-09: `lucrocaseiro.com.br` serve o site público na raiz; `central.lucrocaseiro.com.br` serve a Central de Marketing; `app.lucrocaseiro.com.br` permanece o PWA. O mesmo serviço Railway `@lucro-caseiro/web` diferencia a raiz pública pelo host encaminhado, enquanto a Central preserva suas rotas atuais no subdomínio próprio. O domínio da Central foi criado no Railway, mas só fica publicamente acessível após publicar CNAME e TXT de verificação na Hostinger e emitir o certificado.
