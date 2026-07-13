---
id: 124d486d-6393-49fc-a5ee-9d40e114d310
slug: money
type: scar
title: Gastos fixos: gate por feature e cache confirmado pela API
tags: gastos-fixos, recorrencia, persistencia, cache, planos
provenance: observado
evidence: apps/mobile/src/app/recurring-expenses.tsx; apps/mobile/src/features/finance/hooks.ts; lint/typecheck, 276 testes mobile e 44 testes finance API aprovados em 2026-07-12
decay: stable
created: 2026-07-13T02:45:38.881120600+00:00
updated: 2026-07-13T02:45:38.881120600+00:00
validated: 2026-07-13T02:45:38.881120600+00:00
links: 
---

SINTOMA (2026-07-12): Gastos Fixos não aparecia salvo após enviar o formulário. CAUSAS no cliente: a tela usava `isProfilePremiumActive`, liberando o formulário para qualquer plano pago embora `recurringExpenses` seja exclusiva do Profissional; e create/update/delete dependiam apenas de invalidação ampla do cache, sem aplicar imediatamente o registro confirmado pela API. CORREÇÃO: gate com `hasActiveFeature(..., 'recurringExpenses')`; mutations serializadas; create/update/delete atualizam diretamente `['finance','recurring']`; formulário confere descrição, valor, categoria e dia retornados antes de mostrar sucesso; erros 400 exibem a mensagem da API. COMO EVITAR: features exclusivas não devem usar o conceito genérico de plano pago, e CRUD de configuração deve confirmar/espelhar a resposta do servidor no cache antes de fechar o formulário.
