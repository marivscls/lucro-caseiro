---
id: 11a6b56e-4540-4cb7-9d13-ceeb4c70aff8
slug: release
type: scar
title: Domínio customizado do Railway exige CNAME e TXT de verificação
tags: railway, dominio, dns, cname, txt, ssl, certificado
provenance: observado
evidence: Railway domain ad192a61-9870-4f80-94fd-8fb8e79b3dbf; https://docs.railway.com/networking/domains/working-with-domains; DNS e HTTPS verificados em 2026-07-19
decay: stable
created: 2026-07-20T01:17:55.408453200+00:00
updated: 2026-07-20T01:17:55.408453200+00:00
validated: 2026-07-20T01:17:55.408453200+00:00
links:
---

SINTOMA (2026-07-19): `app.lucrocaseiro.com.br` recebeu o CNAME correto e propagou em Hostinger, Cloudflare e Google DNS, mas o Railway permaneceu com `verified: false`, certificado em `VALIDATING_OWNERSHIP` e HTTPS sem confiança. CAUSA: a primeira orientação pediu apenas o CNAME; o Railway atual exige também o TXT de propriedade exibido em `verification.dnsHost/token`. CORREÇÃO: criar ambos os registros exatamente como fornecidos e só considerar concluído após `verified: true`, certificado emitido e HTTP 200 no domínio. COMO EVITAR: ao configurar domínio customizado Railway, ler tanto `dnsRecords` quanto `verification` da resposta/status; nunca orientar somente o CNAME.
