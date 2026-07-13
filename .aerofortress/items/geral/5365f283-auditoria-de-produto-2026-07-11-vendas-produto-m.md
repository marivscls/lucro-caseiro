---
id: 5365f283-d773-4830-9f0a-f48e13c31c7a
slug: geral
type: fact
title: Auditoria de produto 2026-07-11 (vendas/produto/marketing/design) — achados priorizados
tags: auditoria, produto, monetizacao, growth, design
provenance: observado
evidence: apps/mobile/src/app/plans.tsx:324; apps/mobile/src/features/subscription/components/paywall.tsx; apps/api/src/features/catalog/catalog.domain.ts:251
decay: seasonal
created: 2026-07-11T03:59:18.813602200+00:00
updated: 2026-07-11T03:59:18.813602200+00:00
validated: 2026-07-11T03:59:18.813602200+00:00
links:
---

Auditoria completa pré-lançamento em 4 frentes. Top achados:

**Riscos imediatos**: (1) botão "Cancelar assinatura" morto em plans.tsx:324-336 (só alerta "em breve") — risco de reembolso/review negativa; (2) push remoto quebrado: use-notifications.ts POSTa /users/push-token que não existe na API (404 silencioso) — notificações são só locais.

**Monetização**: paywall sem âncora de preço, mensal pré-selecionado (paywall.tsx:207), sem trial, sem prova social, sem winback/downgrade comunicado (rebaixamento silencioso em resolveActivePlan). Essencial não tem NENHUM recurso qualitativo vs Free (só remove limites) e mantém teto de 3 fornecedores igual ao Free sem comunicar. AdBanner ao lado do LimitBanner na Home (index.tsx:710-720) canibaliza upgrade. Purchases e kits (features pagas) sem call-site de showPaywall identificado.

**Growth**: catálogo público tem footer "Feito com carinho no Lucro Caseiro" mas SEM link/CTA; PDFs (orçamento/recibo/rótulo/receita) sem branding nenhum; sem expo-store-review (nunca pede avaliação); sem referral; sem landing page (docs/ só tem páginas legais).

**Produto/IA**: Agenda, Financeiro e Fiado enterrados na aba "Mais" (14 itens); precificação fragmentada em 3 fluxos (materials→recipes→pricing, 5 passos); order-form não expõe notes/clientId do contrato; empty states faltando em clients/purchases/packaging/insights/labels.

**Design**: duas linguagens visuais (home flat vs legadas com sombra), 371 fontSize inline, fontes <16px em index.tsx:376, paywall.tsx:84 etc., Card variant elevated sem sombra real, hex hardcoded em fiado.tsx/recurring-expenses.tsx, 16 ai.context.mobile.md desatualizados citando Alert.alert.
