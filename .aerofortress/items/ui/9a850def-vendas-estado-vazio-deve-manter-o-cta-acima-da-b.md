---
id: 9a850def-b033-4247-84b0-cea1e6879d9d
slug: ui
type: scar
title: Vendas: estado vazio deve manter o CTA acima da barra inferior
tags: vendas, empty-state, cta, mobile, desktop, tab-bar
provenance: dito
evidence: apps/mobile/src/app/tabs/sales.tsx; capturas enviadas pela usuária em 2026-08-14; typecheck/lint/build:pwa:revenda aprovados e preview 8086 HTTP 200
decay: stable
created: 2026-08-14T15:35:15.287883900+00:00
updated: 2026-08-14T15:35:15.287883900+00:00
validated: 2026-08-14T15:35:15.287883900+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-14): após instalar a ilustração azul do Lucro na Revenda, o botão `Registrar venda` ficou parcialmente encoberto pela navegação inferior no mobile e abaixo da área visível no desktop. CAUSA: o estado vazio de Vendas era um contêiner não rolável, com ilustração de 220 px e padding inferior de segurança dentro da área reduzida por filtros, busca e KPIs. CORREÇÃO CANÔNICA: a ilustração de Vendas usa 180 px; o estado vazio fica dentro de `ScrollView` com `flexGrow: 1`, conserva o espaço inferior da barra flutuante e usa padding superior compacto. COMO EVITAR: ao trocar uma arte de empty state, validar o conjunto completo até o CTA em viewport móvel e desktop, não apenas a imagem.
