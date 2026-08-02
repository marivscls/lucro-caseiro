---
id: d323cdd8-262b-45cf-9776-fa33cd0a1f9b
slug: ui
type: scar
title: Catálogo público deve reutilizar calendário temático do app
tags: catalogo, servicos, formulario, calendario, data, picker, web, ui, correcao
provenance: dito
evidence: Capturas e correção explícita da usuária em 2026-08-01; apps/mobile/src/shared/components/calendar-modal.tsx; apps/api/src/features/catalog/catalog.domain.ts
decay: stable
created: 2026-08-02T02:06:47.049354700+00:00
updated: 2026-08-02T02:22:28.009224600+00:00
validated: 2026-08-02T02:22:28.009224600+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-08-01): a captura mostrava o campo de data/horário do formulário público usando controles nativos do Chrome/Windows. A primeira correção interpretou o pedido como sendo apenas o horário, trocou `<input type="time">` por um campo mascarado e publicou, mas deixou `<input type="date">`; a usuária esclareceu que queria o calendário que já existe no app padrão. CORREÇÃO CANÔNICA: o renderer público deve espelhar o `CalendarModal` canônico (`apps/mobile/src/shared/components/calendar-modal.tsx`): modal temático centralizado, cabeçalho com mês/ano e setas, grade de 42 dias com semana D–S, dia selecionado em rosa, dia atual contornado, navegação de mês e escolha de ano; o campo visível usa `DD/MM/AAAA` com ícone e mantém ISO apenas no valor enviado à API. O horário permanece no padrão digitável `HH:MM`. COMO EVITAR: quando a usuária disser “calendário padrão do app”, localizar e reproduzir o componente canônico completo antes de alterar só o controle mais evidente da captura; validar o popup de data real, não apenas o HTML do campo.
