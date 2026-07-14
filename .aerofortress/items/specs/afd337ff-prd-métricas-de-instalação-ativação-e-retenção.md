---
id: afd337ff-da2a-47d7-bf68-b7eed4055869
slug: specs
type: doc
title: PRD — Métricas de instalação, ativação e retenção
tags: prd, analytics, instalacao, ativacao, retencao, admin
provenance: observado
evidence: .aerofortress/specs/prd-metricas-produto.md
decay: seasonal
created: 2026-07-14T02:15:01.867924900+00:00
updated: 2026-07-14T02:48:12.638600500+00:00
validated: 2026-07-14T02:48:12.638600500+00:00
links:
---

Define e implementa o funil mínimo do Lucro Caseiro: instalação observada, vínculo instalação-conta, ativação derivada de precificação/venda/encomenda, atividade diária e retenção D1/D7/D30. A migration 034 foi aplicada em 2026-07-13; o mesmo cálculo agora alimenta `pnpm analytics:report` e um painel visual no app, cujo atalho e endpoint são protegidos no backend pela allowlist `ADMIN_USER_IDS`. Ainda depende de configurar o UUID administrativo no Railway, publicar a API e gerar a atualização do app.
