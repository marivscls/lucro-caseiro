---
id: 473a3434-8537-4f72-ac20-883c6937f712
slug: database
type: fact
title: Seed idempotente de etiquetas da conta Mariana
tags: seed, labels, etiquetas, mariana, database
provenance: observado
evidence: packages/database/src/seeds/seed-labels-mariana.sql; execução em produção em 2026-07-19: 12 simple_labels, 0 old_mass_labels, 2 preserved, 0 technical_payloads
decay: seasonal
created: 2026-07-19T20:03:02.878797900+00:00
updated: 2026-07-19T20:37:02.468474700+00:00
validated: 2026-07-19T20:37:02.468474700+00:00
links:
---

A conta marianadosreisvasconcelos7@gmail.com possui um seed específico e não destrutivo em `packages/database/src/seeds/seed-labels-mariana.sql`. Ele substitui somente massas antigas de labels, preserva registros manuais e cria 12 etiquetas simples ligadas a produtos reais, cobrindo cinco modelos; quatro usam QR opcional. O payload contém apenas productName, note, datas e contato, sem ingredientes, advertências ou nutrição.
