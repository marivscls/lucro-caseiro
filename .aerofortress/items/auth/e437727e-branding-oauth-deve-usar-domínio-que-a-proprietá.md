---
id: e437727e-f87f-48e3-9831-bfa50e8622c8
slug: auth
type: scar
title: Branding OAuth deve usar domínio que a proprietária controla
tags: oauth, google, branding, ownership, supabase
provenance: dito
evidence: Correção da usuária em 2026-07-28; falha da verificação Google informando que a homepage Orion Seven não estava registrada para a conta; Google Search Console/Branding OAuth.
decay: stable
created: 2026-07-28T22:15:44.862851200+00:00
updated: 2026-07-28T23:04:19.627474600+00:00
validated: 2026-07-28T23:04:19.627474600+00:00
links:
---

ERRO DE ORIENTAÇÃO (2026-07-28): ao tentar eliminar `<project-ref>.supabase.co` da tela Google, a orientação derivou para URLs em `orionseven.com.br`. A usuária esclareceu que não é proprietária da Orion Seven. Embora política e termos do Lucro Caseiro estejam publicados lá, o Google exige que a conta que pede verificação seja proprietária do domínio da homepage no Search Console; depender de credenciais ou infraestrutura de terceiro bloqueou a verificação e o deploy. CORREÇÃO CANÔNICA: usar `lucrocaseiro.com.br`, domínio que a usuária possui, para homepage pública e documentos do app, verificar a propriedade com a mesma conta Google que administra o OAuth e publicar o branding. Não pedir login/senha de conta alheia; se um domínio de terceiro fosse indispensável, o proprietário deveria adicionar a conta da usuária formalmente como proprietária autorizada. Separar domínio da marca/homepage, documentos públicos e callback técnico do Supabase; custom domain do Supabase continua opcional.
