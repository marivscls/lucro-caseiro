---
id: 3f4e2c96-8844-4d05-bfaa-af13bbef5afa
slug: backend
type: decision
title: Campanha Profissional não terá trava por dispositivo
tags: trial, campaign, device, scope, yagni
provenance: dito
evidence: Correção de escopo da usuária em 2026-08-13; worktree verificado após reversão
decay: stable
created: 2026-08-13T16:58:20.015548300+00:00
updated: 2026-08-13T17:00:33.873971800+00:00
validated: 2026-08-13T17:00:33.873971800+00:00
links:
---

DECISÃO DA USUÁRIA (2026-08-13): embora limitar apenas por `user_id` permita em tese criar outra conta no mesmo aparelho, não implementar histórico por dispositivo nesta campanha. Ela entrega somente um mês, tem teto global de 100 beneficiários e a complexidade adicional não compensa o risco. A implementação experimental de trava por instalação feita na sessão foi integralmente revertida; permanece a regra canônica de uma concessão por conta.
