---
id: 2ee1f6ea-ffe6-47fe-a2d5-8024bc9c00e0
slug: testes
type: fact
title: Massa completa aplicada na conta marianavasconcelos497@gmail.com
tags: seed, massa-de-testes, producao, conta-teste, idempotencia
provenance: observado
evidence: packages/database/src/seeds/seed-full-mariana.sql; execução Railway production em 2026-08-16 para user_id 8a7d5ad0-7cf5-44b6-9848-dd16708dcb71
decay: seasonal
created: 2026-08-16T15:45:14.418831400+00:00
updated: 2026-08-16T15:45:14.418831400+00:00
validated: 2026-08-16T15:45:14.418831400+00:00
links:
---

Em 2026-08-16, a conta digitada como `marianavasconcelos497@gmial.com` não existia; a conta correspondente observada no banco de produção era `marianavasconcelos497@gmail.com`. O seed completo foi parametrizado por `app.seed_email`, ampliado para cobrir também serviços e pacotes, agendamentos, estoque rastreado, produção, variações, itens de compra, preferências de precificação e Operação/PDV, e aplicado atomicamente nessa conta. Contagens observadas após a carga: 24 clientes, 18 produtos, 72 vendas, 27 encomendas, 4 serviços, 7 documentos operacionais e 4 lotes de produção. Uma validação transacional com rollback passou antes da aplicação e outra passou depois, provando o caminho idempotente.
