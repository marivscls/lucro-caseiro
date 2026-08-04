---
id: 877acc13-5228-4dbc-a385-b7fc931f7bf0
slug: specs
type: doc
title: PRD — Hardening de segurança do aplicativo, PWA, site e API
tags: spec, security, prd, production
provenance: observado
evidence: .aerofortress/specs/prd-hardening-seguranca-2026-08.md
decay: seasonal
created: 2026-08-04T12:56:35.583227600+00:00
updated: 2026-08-04T13:40:03.658223900+00:00
validated: 2026-08-04T13:40:03.658223900+00:00
links:
---

Define e registra como concluído o hardening de ponta a ponta: billing fail-closed, vínculo Google Play por identidade/hash único, CSP/headers, CORS allowlist, quotas PostgreSQL, IDOR, supply chain, segredos e rollout. A versão de 2026-08-04 inclui evidências de produção para 413/400/429, CSP/HSTS/CORS e os commits ad4f1f3/75013cb; também registra honestamente que o `knip:full` segue vermelho por dívida preexistente e que nenhum pagamento real foi criado nos probes não destrutivos.
