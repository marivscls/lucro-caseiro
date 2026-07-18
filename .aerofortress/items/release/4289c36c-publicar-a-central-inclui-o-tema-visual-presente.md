---
id: 4289c36c-0a75-4f7c-a768-ba7caa5fb41d
slug: release
type: scar
title: Publicar a Central inclui o tema visual presente no worktree
tags: release, central-de-marketing, css, escopo, correcao
provenance: dito
evidence: Commit beab617 e correção da usuária em 2026-07-18; apps/web/src/app/globals.css
decay: stable
created: 2026-07-18T12:45:36.357943+00:00
updated: 2026-07-18T12:45:36.357943+00:00
validated: 2026-07-18T12:45:36.357943+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-18): ao pedir commit e push das alterações da Central de Marketing, a usuária esperava também a reformulação rosa já presente no worktree. O commit beab617 excluiu esses arquivos com base numa decisão antiga de manter verde; o deploy subiu, porém a produção continuou visualmente inalterada. Regra: não excluir silenciosamente uma mudança visual evidente do escopo pedido com base em memória antiga. Se houver conflito real, confirmar antes do release; depois do deploy, validar a cor/identidade no CSS servido em produção, não apenas o status do provedor.
