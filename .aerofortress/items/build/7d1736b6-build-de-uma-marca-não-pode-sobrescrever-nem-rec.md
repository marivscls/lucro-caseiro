---
id: 7d1736b6-3035-44a8-81ab-6700e5ac2e04
slug: build
type: scar
title: Build de uma marca não pode sobrescrever nem recolorir outra
tags: pwa, whitelabel, marca, build, isolamento, lucro-caseiro, papelaria
provenance: dito
evidence: Correção explícita da usuária nesta conversa em 2026-07-19; regressão observada após build:pwa:papelaria
decay: stable
created: 2026-07-19T03:47:43.010655100+00:00
updated: 2026-07-19T03:47:43.010655100+00:00
validated: 2026-07-19T03:47:43.010655100+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-19): ao tentar gerar o PWA separado do Lucro na Papelaria, o fluxo reutilizou a mesma saída/configuração do app compartilhado e deixou o Lucro Caseiro verde. Isso viola o requisito central: Lucro Caseiro, Papelaria e Manicure são apps separados; gerar ou servir uma marca nunca pode alterar a identidade, o dist nem a porta da outra. COMO EVITAR: cada marca deve compilar para diretório de saída próprio, ser servida a partir desse diretório e ter validação independente de título, manifesto, marca ativa e cor; o build do Lucro Caseiro deve continuar rosa após qualquer build das demais marcas.
