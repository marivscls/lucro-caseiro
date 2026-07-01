---
id: 0fa7e0e6-0dfc-4738-8c45-f7a947628a84
slug: ui
type: scar
title: Duplicidade em cadastros mestres precisa bloquear em todos os formulários
tags: duplicidade, clientes, fornecedores, embalagens, formulario
provenance: dito
evidence: Relato da usuária em 2026-06-30 com screenshots de clientes Mariana duplicados, fornecedores Mariana duplicados e embalagens de teste duplicadas
decay: stable
created: 2026-06-30T15:07:26.416175400+00:00
updated: 2026-06-30T15:07:26.416175400+00:00
validated: 2026-06-30T15:07:26.416175400+00:00
links:
---

Falha real: depois do PRD de duplicidade, a usuária ainda conseguiu cadastrar duplicatas em Clientes, Fornecedores e Embalagens pela UI. A lição é não implementar a defesa local só em um formulário: toda entidade mestre com regra de duplicidade precisa validar no formulário antes do submit, usando dados carregados e/ou busca do campo digitado, além da validação da API.
