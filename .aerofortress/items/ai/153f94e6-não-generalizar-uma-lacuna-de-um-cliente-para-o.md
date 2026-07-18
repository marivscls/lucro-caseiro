---
id: 153f94e6-d944-47ae-8332-0f784324bb79
slug: ai
type: scar
title: Não generalizar uma lacuna de um cliente para o produto inteiro
tags: análise, escopo, web, desktop, portabilidade, agentes
provenance: dito
evidence: Correção explícita da usuária em 2026-07-18; item corrigido 78238655
decay: stable
created: 2026-07-18T20:17:53.776339700+00:00
updated: 2026-07-18T20:17:53.776339700+00:00
validated: 2026-07-18T20:17:53.776339700+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-18): ao responder se a Central tinha estrategista de anúncios e copywriter, a análise examinou apenas um cliente/implementação genérica e concluiu incorretamente que o produto inteiro não possuía o fluxo. O web Next.js já implementa `campaign-plan.v1` → `creative-bundle.v3`, com estratégia estruturada, BrandProfile, variantes por canal, aprovação e persistência; a ausência é no desktop. COMO EVITAR: antes de afirmar inexistência de uma capacidade no produto, identificar todos os clientes/superfícies relevantes e procurar contratos/rotas canônicos em cada um; expressar a conclusão por superfície quando a paridade não estiver comprovada.
