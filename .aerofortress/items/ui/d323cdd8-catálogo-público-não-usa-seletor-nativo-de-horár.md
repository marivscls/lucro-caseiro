---
id: d323cdd8-262b-45cf-9776-fa33cd0a1f9b
slug: ui
type: scar
title: Catálogo público não usa seletor nativo de horário no navegador
tags: catalogo, servicos, formulario, horario, picker, web, ui
provenance: dito
evidence: Captura enviada pela usuária em 2026-08-01; apps/api/src/features/catalog/catalog.domain.ts; apps/api/src/features/catalog/catalog.domain.test.ts; 33 testes direcionados, typecheck e lint sem erros
decay: stable
created: 2026-08-02T02:06:47.049354700+00:00
updated: 2026-08-02T02:06:47.049354700+00:00
validated: 2026-08-02T02:06:47.049354700+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-01): o campo “Horário desejado” do formulário público de solicitação usava `<input type="time">` e o Chrome/Windows abria um seletor azul nativo, destoando do Lucro Caseiro. CORREÇÃO CANÔNICA: no renderer público, o horário segue o mesmo padrão do app — campo de texto temático com ícone de relógio, teclado numérico, máscara `HH:MM` e validação de 00:00 a 23:59 — sem popup nativo. COMO EVITAR: não usar pickers nativos de data/horário em superfícies públicas que precisam manter a identidade visual do app; reutilizar o comportamento visual canônico.
