---
id: 0a9378e4-aaea-470a-a694-259a7942290e
slug: tests
type: scar
title: Fixture indexada precisa afirmar existência antes de spread sob noUncheckedIndexedAccess
tags: typescript, fixtures, noUncheckedIndexedAccess, typecheck
provenance: observado
evidence: apps/api/src/features/retail/retail.usecases.test.ts
decay: stable
created: 2026-07-19T05:46:31.973357500+00:00
updated: 2026-07-19T05:46:31.973357500+00:00
validated: 2026-07-19T05:46:31.973357500+00:00
links:
---

SINTOMA (2026-07-19): o typecheck da API falhou com TS2322 ao montar uma fixture espalhando `makeDocument().items[0]`; as propriedades se tornaram opcionais porque um acesso indexado pode ser `undefined`. CAUSA: o teste sabia que a fixture tinha um item, mas não comunicou essa garantia ao TypeScript. PREVENÇÃO: ao reutilizar um elemento garantido de fixture, faça a asserção localizada (`items[0]!`) antes do spread, ou extraia um construtor de item que retorne o tipo completo; rode o typecheck depois de adicionar testes.
