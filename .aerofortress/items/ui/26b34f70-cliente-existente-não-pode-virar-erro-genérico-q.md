---
id: 26b34f70-24a3-4798-b3ce-6b76ef702c4f
slug: ui
type: scar
title: Cliente existente não pode virar erro genérico quando índice do banco bloqueia
tags: duplicidade, clientes, erro, api, mobile
provenance: dito
evidence: Relato da usuária em 2026-06-30 com screenshot do alerta genérico ao cadastrar Mariana existente; correção em apps/mobile/src/app/tabs/clients.tsx e apps/mobile/src/features/clients/components/edit-client-form.tsx.
decay: stable
created: 2026-06-30T23:06:01.809450500+00:00
updated: 2026-06-30T23:06:01.809450500+00:00
validated: 2026-06-30T23:06:01.809450500+00:00
links:
---

Falha real: ao tentar cadastrar cliente já existente depois do índice único no banco, o app mostrou 'Erro — Algo deu errado. Tente novamente.' A causa é que a API em uso pode retornar erro genérico/500 para a colisão do índice antes de estar atualizada, ou o erro pode não carregar detalhes suficientes. Para evitar repetir, o formulário mobile deve, no catch de criação/edição, refazer a busca pelo telefone normalizado e mostrar 'Cliente já cadastrado' se encontrar o cliente, além de tratar `VALIDATION_ERROR` amigável da API.
