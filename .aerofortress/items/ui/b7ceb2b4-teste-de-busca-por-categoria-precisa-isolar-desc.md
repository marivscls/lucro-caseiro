---
id: b7ceb2b4-0fc6-4371-840b-3dac98c7c25c
slug: ui
type: scar
title: Teste de busca por categoria precisa isolar descrição do fixture
tags: serviços, testes, busca, fixture, vitest
provenance: observado
evidence: apps/mobile/src/features/services/domain.test.ts; primeira execução do Vitest em 2026-08-16 falhou com service-2 adicional
decay: stable
created: 2026-08-16T23:06:14.024271300+00:00
updated: 2026-08-16T23:06:14.024271300+00:00
validated: 2026-08-16T23:06:14.024271300+00:00
links:
---

FALHA CORRIGIDA (2026-08-16): o novo teste da busca de Serviços por categoria esperava encontrar apenas o item `online`, mas o segundo fixture herdava a descrição padrão `Atendimento online` e também correspondia corretamente à busca. CORREÇÃO: usar descrições neutras e distintas no cenário que valida `locationMode`, isolando a dimensão sob teste. COMO EVITAR: ao testar busca multi-campo, sobrescrever todos os outros campos pesquisáveis para que nenhum deles contenha o termo-alvo.
