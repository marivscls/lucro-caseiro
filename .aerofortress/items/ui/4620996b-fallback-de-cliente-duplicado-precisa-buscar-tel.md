---
id: 4620996b-2e3b-4836-9544-4d4b77d47050
slug: ui
type: scar
title: Fallback de cliente duplicado precisa buscar telefone formatado se API antiga estiver ativa
tags: duplicidade, clientes, api-antiga, telefone, fallback
provenance: dito
evidence: Relato da usuária em 2026-06-30 com screenshot repetindo 'Erro — Algo deu errado. Tente novamente.' após tentativa de fallback; correção em apps/mobile/src/app/tabs/clients.tsx e apps/mobile/src/features/clients/components/edit-client-form.tsx.
decay: stable
created: 2026-06-30T23:10:40.235532700+00:00
updated: 2026-06-30T23:10:40.235532700+00:00
validated: 2026-06-30T23:10:40.235532700+00:00
links:
---

Falha real: ao cadastrar cliente existente, o app continuou mostrando erro genérico mesmo após fallback no catch. A causa provável é que a API em uso ainda buscava telefone por `ilike(phone)` e não por dígitos normalizados; o mobile pesquisava `27999383888`, que não encontra `(27) 99938-3888` em API antiga. Para evitar repetir, enquanto houver API antiga em produção/dev, o formulário deve buscar duplicados usando o telefone formatado do campo e comparar localmente com normalização por dígitos.
