---
id: d6c3f95f-9685-4732-bc6a-8eee21f4ed51
slug: design
type: fact
title: Auditoria dos EmptyState do mobile (onboarding/educação por tela) — 2026-06-25
tags: onboarding, emptystate, ux, mobile, kyte
provenance: observado
evidence: apps/mobile/src/app/insights.tsx; grep <EmptyState em apps/mobile/src; commit e349240
decay: seasonal
created: 2026-06-25T22:52:34.453134200+00:00
updated: 2026-06-25T22:52:34.453134200+00:00
validated: 2026-06-25T22:52:34.453134200+00:00
links:
---

Pedido da usuária (inspirado no Kyte): estados vazios devem EDUCAR + ter CTA que INTERLIGA pra ação que preenche a tela. Auditoria do `<EmptyState>` (componente `@lucro-caseiro/ui`, props: icon/title/description/action ReactNode) em todo o mobile:

**JÁ tinham ilustração + CTA (ok):** new-sale (CTA "Cadastrar produto" → cross-link products), tabs/sales.tsx Histórico (CTA nova venda → /tabs/new-sale, empty custom), agenda.tsx ("Nova encomenda" → setShowCreate), suppliers, clients, materials, purchases, labels, finance-entry-list ("Novo lançamento", sem ícone), recurring-expenses (botão add sempre visível).

**Gap corrigido:** `app/insights.tsx` (Estatísticas) — estado vazio tinha ilustração+texto mas SEM CTA; adicionado `action` Button "Adicionar venda" → `router.push("/tabs/new-sale")`. Commit `e349240` (pushado).

**Ainda "secos" (polish opcional, não feito):** `app/pricing.tsx` linha ~128 ("Nenhum cálculo ainda" — sem ícone nem action; action é awkward pq o form é a própria tela) e `app/quotes.tsx` linha ~585 (ilustração+texto, sem CTA "Criar orçamento").

Conclusão: LC já segue bem o padrão de educação+cross-link; não precisa copiar o carrossel multi-slide do Kyte (briga com princípio #1 / máx 3 toques). Rota de criar venda = `/tabs/new-sale`. Ilustrações usadas: chart, basket, box, clients, clipboard, jars, tag, calendar (via `<Illustration name=...>`).
