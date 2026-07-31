---
id: 1242066b-a07b-4c06-a641-bfb7b2f85d80
slug: ui
type: scar
title: Catálogo público só está corrigido quando a página real abandona o card antigo
tags: catalogo, servicos, publicacao, ambiente, validacao, ui
provenance: dito
evidence: Captura enviada pela usuária em 2026-07-31 mostrando `papelaria`, 2 serviços e cards antigos após a resposta de conclusão; apps/api/src/features/catalog/catalog.domain.ts
decay: stable
created: 2026-07-31T17:16:56.730949300+00:00
updated: 2026-07-31T22:08:57.381282500+00:00
validated: 2026-07-31T22:08:57.381282500+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-31): depois de eu afirmar que o catálogo de serviços estava padronizado com base em teste e captura de HTML local, a página que ela abriu continuava exibindo dois cards antigos com blocos de inicial de 220 px. ERRO: tratei a renderização isolada do código local como entrega visível sem validar a URL/ambiente real usado pela usuária. REGRA: para correções do catálogo público, confirmar qual processo/domínio serve `/c/:slug`, garantir que ele está executando a versão alterada e validar a própria URL real; teste unitário e screenshot de HTML local provam o renderer, não a publicação nem a atualização do servidor. A causa concreta desta divergência ainda deve ser diagnosticada antes de declarar correção.
