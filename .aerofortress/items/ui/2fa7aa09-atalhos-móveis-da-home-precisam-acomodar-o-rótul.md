---
id: 2fa7aa09-2c35-480b-b359-aa5e5788c3c9
slug: ui
type: scar
title: Atalhos móveis da Home precisam acomodar o rótulo inteiro
tags: home, android, mobile, atalhos, tipografia, responsividade, white-label
provenance: dito
evidence: Correção da usuária em 2026-07-20; apps/mobile/src/app/tabs/index.tsx; captura Android 720x1600
decay: stable
created: 2026-07-20T23:49:55.432586500+00:00
updated: 2026-07-20T23:49:55.432586500+00:00
validated: 2026-07-20T23:49:55.432586500+00:00
links:
---

SINTOMA (2026-07-20, Android): na barra de quatro atalhos da Home, “Registrar venda” aparecia truncado como “Registrar ve...”. CAUSA: cada atalho ocupa 25% da largura, mas o `Typography` forçava `numberOfLines={1}`; o rótulo canônico não cabe nessa coluna estreita e a marca Lucro Manicure tem um rótulo ainda maior (“Registrar atendimento”). CORREÇÃO: no mobile, permitir até duas linhas centralizadas, esticar o texto à largura da coluna e aumentar a altura mínima da barra para 88 px; no desktop, preservar uma linha e 76 px. COMO EVITAR: barras móveis com vários atalhos devem dimensionar-se pelo maior rótulo real das marcas suportadas, não pelo mais curto, e nunca truncar a ação principal.
