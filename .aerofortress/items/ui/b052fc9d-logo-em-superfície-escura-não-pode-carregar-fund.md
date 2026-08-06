---
id: b052fc9d-7dae-48d9-9cf4-9641c7d6bc4f
slug: ui
type: scar
title: Logo em superfície escura não pode carregar fundo preto opaco
tags: 
provenance: dito
evidence: apps/mobile/src/assets/auth-house.png; apps/web/public/landing/logo.png; apps/api/src/features/email/professional-trial-email.ts
decay: stable
created: 2026-08-04T11:01:02.489854+00:00
updated: 2026-08-06T14:02:07.347008+00:00
validated: 2026-08-06T14:02:07.347008+00:00
links: 
---

CORREÇÃO DA USUÁRIA (2026-08-04): a tela de login no modo escuro mostrava a casa/moeda dentro de um quadrado preto porque `apps/mobile/src/assets/auth-house.png` era um PNG 512×512 totalmente opaco. CORREÇÃO CANÔNICA: usar o arquivo fornecido `icone/Sem título - 04 August 2026 at 07.56.50.png` como `auth-house.png`; ele é ARGB 512×512, tem transparência real e mantém a arte ocupando bem o canvas. RECORRÊNCIA (2026-08-06): o e-mail transacional incorporou `apps/web/public/landing/logo.png`, que tem um gradiente preto opaco, apesar do pedido explícito por logo sem fundo; o Gmail exibiu o quadrado preto no cabeçalho rosa. A logo grande foi removida do corpo do e-mail, e a identidade visual ficou textual; o asset transparente canônico permanece reservado ao avatar do remetente. COMO EVITAR: antes de reutilizar qualquer PNG de marca em app, e-mail ou material promocional, validar `PixelFormat`, alpha nos cantos e área útil; não confiar na extensão RGBA nem na prévia visual. Consultar primeiro os assets e scars canônicos da marca.
