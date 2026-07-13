---
id: fac920bd-dd77-49b1-9778-789a14467528
slug: ui
type: scar
title: Recurso 100%-premium não pode exibir o formulário de cadastro pra conta free (ilusão de cadastrar)
tags: paywall, premium, freemium, gastos-fixos, form
provenance: dito
evidence: apps/mobile/src/app/recurring-expenses.tsx (RecurringPremiumGate); FEATURE_COPY em apps/mobile/src/features/subscription/limit-copy.ts
decay: stable
created: 2026-07-10T11:57:38.189368+00:00
updated: 2026-07-10T11:57:38.189368+00:00
validated: 2026-07-10T11:57:38.189368+00:00
links:
---

SINTOMA (2026-07-10, testes internos): em Gastos fixos (recurring-expenses.tsx), a conta FREE abria a tela e já via o formulário completo de "Novo gasto fixo" — porque `showForm` iniciava em `true` e o paywall só disparava no botão "Adicionar" ou no erro de salvar. A usuária preenchia e só no fim descobria que precisava assinar. "Ilusão de poder cadastrar algo e no final ter que assinar."

CORREÇÃO: pra `!isPremium`, renderizar uma TELA DE APRESENTAÇÃO do recurso (badge "Recurso Profissional" + o que ele faz + 3 benefícios + CTA "Desbloquear no Profissional" → showPaywall("recurring")), sem nenhum formulário. O form/lista só existem no ramo premium.

COMO EVITAR REPETIR: recurso 100%-premium (FEATURE_COPY, não count-limited) NUNCA deve mostrar o form de cadastro pra free — mostra apresentação + CTA. Diferente de recurso count-limited (labels 1, catálogo 5, clientes/produtos/etc.): aí o form É legítimo até o limite e o bloqueio vem via LimitBanner/LIMIT_EXCEEDED. Ao criar/gatear uma feature premium, decidir de cara: é "fully premium" (gate a tela inteira) ou "limited" (deixa criar até o teto). Em 2026-07-10 varri o app: só Gastos fixos tinha esse defeito; reports/export/aniversários são views/botões, labels/catálogo são count-limited. Ver [[freemium-limits-decision]].
