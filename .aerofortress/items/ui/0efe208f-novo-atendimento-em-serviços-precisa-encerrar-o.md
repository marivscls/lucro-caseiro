---
id: 0efe208f-bee5-4063-b4d0-a0515d8b5856
slug: ui
type: scar
title: Novo atendimento em Serviços precisa encerrar o modal e atualizar os dados
tags: servicos, atendimento, agenda, modal, react-query, cache, onSuccess
provenance: dito
evidence: Relato da usuária em 2026-07-29; apps/mobile/src/app/services.tsx; apps/mobile/src/features/orders/hooks.ts; apps/mobile/src/features/orders/hooks.test.ts; lint, typecheck e 415 testes mobile aprovados
decay: stable
created: 2026-07-29T12:01:28.551974200+00:00
updated: 2026-07-29T12:01:28.551974200+00:00
validated: 2026-07-29T12:01:28.551974200+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-29): ao salvar um atendimento iniciado em Serviços, o modal permanecia aberto e os dados de Serviços não eram atualizados, fazendo parecer que o atendimento não havia sido salvo. CAUSA: o `OrderForm` usado por `app/services.tsx` recebia `onClose`, mas não `onSuccess`; além disso, `useCreateOrder` invalidava somente `['orders']`, enquanto indicadores e histórico do serviço vivem sob `['services', ...]`. CORREÇÃO: no sucesso, fechar o modal, confirmar “Atendimento agendado” e informar que está disponível na Agenda; a mutation de criação invalida `['orders']` e `['services']`. COMO EVITAR: todo formulário controlado por estado do pai precisa ligar explicitamente o callback de sucesso; ao criar uma entidade que alimenta mais de um domínio visual, invalidar todas as raízes de cache consumidoras.
