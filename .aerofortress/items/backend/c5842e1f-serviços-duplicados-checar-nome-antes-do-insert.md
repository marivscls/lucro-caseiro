---
id: c5842e1f-ca81-451b-a82a-31cdfee3e825
slug: backend
type: scar
title: Serviços duplicados: checar nome antes do insert não impede dois envios concorrentes
tags: servicos, duplicidade, concorrencia, idempotencia, postgres, formulario
provenance: dito
evidence: Captura da usuária em 2026-07-29; apps/mobile/src/features/services/components/service-form.tsx; apps/api/src/features/orders/orders.repo.pg.ts; apps/api/src/features/orders/orders.usecases.ts; teste concorrente em apps/api/src/features/orders/orders.usecases.test.ts
decay: stable
created: 2026-07-29T11:20:27.011686300+00:00
updated: 2026-07-29T11:20:27.011686300+00:00
validated: 2026-07-29T11:20:27.011686300+00:00
links: 
---

CORREÇÃO DA USUÁRIA (2026-07-29): ao cadastrar um serviço no PWA, dois cards idênticos foram criados. CAUSA: dois submits quase simultâneos podiam atravessar o `refetch`/`findServiceByName` antes do primeiro insert; `isPending` e a checagem prévia não formavam uma garantia atômica. CORREÇÃO: o formulário usa uma trava síncrona por `useRef` desde o primeiro await até o fim do submit; no Postgres, a criação adquire `pg_advisory_xact_lock` por usuário+nome normalizado, reconsulta dentro da transação e retorna conflito se outro request já criou. COMO EVITAR: todo cadastro que proíbe duplicatas precisa provar dois requests equivalentes concorrentes; trava de UI melhora a experiência, mas a garantia final pertence ao backend/banco.
