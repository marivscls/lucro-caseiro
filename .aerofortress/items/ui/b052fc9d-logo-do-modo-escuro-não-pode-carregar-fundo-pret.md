---
id: b052fc9d-7dae-48d9-9cf4-9641c7d6bc4f
slug: ui
type: scar
title: Logo do modo escuro não pode carregar fundo preto no BrandIntro
tags: mobile, login, brand-intro, logo, png, transparencia, dark-mode
provenance: dito
evidence: apps/mobile/src/assets/auth-house.png; icone/Sem título - 04 August 2026 at 07.56.50.png; captura da usuária em 2026-08-04
decay: stable
created: 2026-08-04T11:01:02.489854+00:00
updated: 2026-08-04T11:01:02.489854+00:00
validated: 2026-08-04T11:01:02.489854+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-04): a tela de login no modo escuro mostrava a casa/moeda dentro de um quadrado preto porque `apps/mobile/src/assets/auth-house.png` era um PNG 512×512 totalmente opaco. CORREÇÃO CANÔNICA: usar o arquivo fornecido `icone/Sem título - 04 August 2026 at 07.56.50.png` como `auth-house.png`; ele é ARGB 512×512, tem transparência real e mantém a arte ocupando bem o canvas. COMO EVITAR: para logos internas do app, validar alpha e área útil do PNG, não confiar apenas na prévia visual ou nas dimensões nominais.
