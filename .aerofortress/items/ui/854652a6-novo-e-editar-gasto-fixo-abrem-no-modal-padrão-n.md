---
id: 854652a6-ee5d-4209-bbb1-9abde7e6766c
slug: ui
type: scar
title: Novo e editar gasto fixo abrem no modal padrão, não em tela substituta
tags: ui, gastos-fixos, modal, standard-modal, cadastro, mobile
provenance: dito
evidence: apps/mobile/src/app/recurring-expenses.tsx; correção solicitada pela usuária e implementação validada por ESLint, typecheck, teste de visão recorrente e build PWA em 2026-08-16
decay: stable
created: 2026-08-16T23:09:51.168890300+00:00
updated: 2026-08-16T23:09:51.168890300+00:00
validated: 2026-08-16T23:09:51.168890300+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-16): após o redesign de Gastos fixos, tocar para adicionar fazia o formulário `Novo gasto fixo` substituir toda a tela, com cabeçalho de voltar, divergindo dos demais cadastros. CORREÇÃO CANÔNICA: criação e edição de gasto fixo devem manter a listagem ao fundo e abrir no `StandardModal`, com título/subtítulo, X, rolagem interna e rodapé Cancelar + Salvar. Gastos fixos continua sendo exceção apenas na forma de expor o CTA da listagem; isso não transforma o formulário em rota/tela própria. COMO EVITAR: em redesigns de cadastro, preservar o padrão de apresentação já usado pelo domínio e reutilizar `StandardModal` antes de criar uma composição full-screen.
