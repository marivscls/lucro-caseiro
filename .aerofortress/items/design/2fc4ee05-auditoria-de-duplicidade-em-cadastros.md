---
id: 2fc4ee05-8c94-4c59-a884-036ac726d1a3
slug: design
type: fact
title: Auditoria de duplicidade em cadastros
tags: duplicidade, cadastros, ux
provenance: observado
evidence: packages/database/src/schema/*.ts; apps/api/src/features/*/*.usecases.ts; apps/mobile/src/features/*/components/*form*.tsx
decay: seasonal
created: 2026-06-30T14:16:08.303389500+00:00
updated: 2026-06-30T14:16:08.303389500+00:00
validated: 2026-06-30T14:16:08.303389500+00:00
links:
---

Em 2026-06-30 foi verificado que as telas/entidades de catálogo do app não têm bloqueio real de duplicidade por usuário: insumos (`materials`), produtos, embalagens, clientes, fornecedores, receitas e rótulos usam índices de busca, mas não `uniqueIndex` nem validação de duplicata nos usecases. As únicas unicidades fortes observadas são email de usuário, slug do catálogo público e meta de pró-labore por usuário. Regra recomendada: bloquear/avisar duplicidade em cadastros mestres; permitir repetição em eventos/transações como vendas, compras, finanças, encomendas e orçamentos.
