---
id: 6775d546-e04e-4ec5-98ea-4cc074352938
slug: geral
type: fact
title: Fase 1 do PRD pré-lançamento implementada e pushada (2026-07-11)
tags: lancamento, status, prd
provenance: observado
evidence: git log 46bbe50; pnpm prepush exit 0
decay: volatile
created: 2026-07-11T04:45:56.356443200+00:00
updated: 2026-07-11T04:45:56.356443200+00:00
validated: 2026-07-11T04:45:56.356443200+00:00
links:
---

Toda a fase 1 do PRD [[prd-melhorias-pre-lancamento]] foi implementada, com prepush verde e push na main (f90f87c..46bbe50, 16 commits novos). Inclui: cancelamento de assinatura via loja + aviso de expiração (plans.tsx), paywall anual default + âncora, exportBasic no Essencial (contracts + gate na API finance /export/pdf), branding "Feito com Lucro Caseiro" nos PDFs (orçamento/recibo/receita; rótulo só nome), CTA na vitrine pública, expo-store-review após 3ª venda, landing docs/index.html, Agenda na tab bar no lugar de Clientes (rota /agenda redireciona pra /tabs/agenda; /tabs/clients segue com href:null), "Mais" com seção "Do dia a dia" (Financeiro/Fiado/Clientes), token elevation no @lucro-caseiro/ui + Card elevated, vendas/catálogo flat, fontes mínimas, fiado/recurring sem hex hardcoded, push remoto morto removido, gates purchases/kits confirmados (Codex fez em paralelo).

ATENÇÃO: expo-store-review é módulo NATIVO — exige novo dev build/EAS build pra funcionar no aparelho (JS-only funciona via Metro, o pedido de avaliação não). Pendências fase 2: precificação guiada (wizard), winback. Futuro: referral, push remoto.
