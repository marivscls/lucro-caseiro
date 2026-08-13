---
id: 54c735a8-5773-44a9-ae27-49d1f83486a4
slug: marketing
type: fact
title: Central de Marketing: capacidade existe, mas o ciclo operacional está fragmentado
tags: central-de-marketing, selenita, ux, orquestracao, treinamento
provenance: observado
evidence: apps/web/src/app/(dashboard)/_components/sidebar.tsx; apps/web/src/app/(dashboard)/ai/page.tsx; apps/web/src/app/(dashboard)/ai/training/page.tsx; apps/web/src/app/(dashboard)/[section]/page.tsx; apps/api/src/features/marketing/marketing.usecases.ts; apps/api/src/features/marketing/marketing.routes.ts
decay: seasonal
created: 2026-08-12T12:47:21.307868200+00:00
updated: 2026-08-12T12:47:21.307868200+00:00
validated: 2026-08-12T12:47:21.307868200+00:00
links:
---

Auditoria de 2026-08-12: a Central expõe 11 destinos além de Hoje na navegação e mantém capacidades fortes de conteúdo, campanhas, documentos e aprendizado, mas não as apresenta como um único ciclo diário. A Selenita/Consultoria IA sempre usa mode="consult" e contexto genérico; suas saídas só podem ser salvas genericamente como documento ou ideia, sem acionar diretamente os fluxos estruturados já existentes. Há ainda capacidade parcialmente desconectada: `/topics` existe mas não aparece na navegação; `PUT /ai/training/settings` não tem chamada na UI; a classe B apenas registra candidatos shadow, sem fluxo observado de avaliação/promoção; documentos canônicos são copiados para conhecimento no seed, mas updateDocument não sincroniza essa cópia. Direção recomendada: reduzir a navegação diária a Hoje, Produzir, Biblioteca, Resultados e Selenita; transformar Hoje em fila de próximas ações; usar Selenita como orquestradora de ações estruturadas existentes; mover Treinamento para configuração avançada.
