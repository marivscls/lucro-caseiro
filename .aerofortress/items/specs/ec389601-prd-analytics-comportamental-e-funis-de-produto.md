---
id: ec389601-e7c7-48c6-a80b-4c1475a9b5af
slug: specs
type: doc
title: PRD — Analytics comportamental e funis de produto
tags: prd, analytics, eventos, funil, retencao, versao, privacidade
provenance: observado
evidence: .aerofortress/specs/prd-analytics-comportamental.md
decay: seasonal
created: 2026-07-14T03:16:38.620388+00:00
updated: 2026-07-14T03:34:42.816287600+00:00
validated: 2026-07-14T03:34:42.816287600+00:00
links:
---

Implementado em 2026-07-14. A fase 2 mede visitas e tempo ativo de todas as telas, dez ações canônicas, funil instalação→cadastro→precificação→produto→venda, adoção por versão e retenção D7 por precificação/compartilhamento de catálogo. O painel administrativo possui quatro seções, os endpoints usam allowlists estritas sem conteúdo pessoal e a persistência depende da migration `035_analytics_behavior_events.sql`.
