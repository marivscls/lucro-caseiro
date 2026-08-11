---
id: 13f38022-d480-4ff0-a72e-aa099684eb7b
slug: geral
type: scar
title: Seletor de funcionalidade deve cobrir todo o portfólio publicado
tags: marketing, lucro-caseiro, funcionalidades, seed, desktop, modal
provenance: dito
evidence: C:\Users\maria\Documents\projects\selenita\seeds\lucro-caseiro\marketing.json; apps/desktop/src/ResourceBoard.tsx; backends/Selenita.Api/Modules/Marketing/LucroCaseiroMarketingSeedUpgrade.cs; validação local: 20 features ativas, Vitest 11/11, onboarding 1/1, typecheck, build e design doctor em 2026-08-10
decay: stable
created: 2026-08-11T02:23:50.817112400+00:00
updated: 2026-08-11T02:23:50.817112400+00:00
validated: 2026-08-11T02:23:50.817112400+00:00
links: 
---

CORREÇÃO DA USUÁRIA (2026-08-10): o campo “Oferta ou funcionalidade” do modal “Gerar ideias específicas” mostrava somente cinco recursos do seed inicial do Lucro Caseiro, embora o app publique muitas outras áreas. CORREÇÃO: o seed da edição passou a representar 20 funcionalidades ativas (incluindo agenda, clientes, produtos, serviços, fiado, gastos fixos, orçamentos, receitas, embalagens, fornecedores, etiquetas, operação para papelarias, insights/relatórios, alertas e offline), o seletor ordena as opções alfabeticamente e um upgrade idempotente acrescenta chaves ausentes aos workspaces desktop já existentes. COMO EVITAR: todo seletor de oferta da Central deve derivar do portfólio canônico completo da edição; testar os slugs do seed e a lista visível, sem manter uma lista curta paralela.
