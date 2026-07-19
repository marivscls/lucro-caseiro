---
id: 4a761bc5-9996-4e99-ab11-def798aadd75
slug: build
type: scar
title: Deploy da API com schema novo exige aplicar a migration correspondente antes de validar telas
tags: deploy, migration, postgres, railway, api, fiado, schema-drift, 500
provenance: observado
evidence: packages/database/src/migrations/038_product_variations.sql; Railway logs de @lucro-caseiro/api em 2026-07-18 com PostgreSQL 42703; captura .aerofortress/tmp/fiado-final.png após aplicação
decay: stable
created: 2026-07-18T23:18:31.789292900+00:00
updated: 2026-07-18T23:18:31.789292900+00:00
validated: 2026-07-18T23:18:31.789292900+00:00
links:
---

SINTOMA (2026-07-18): a tela Fiado e várias listas da PWA exibiam erro de carregamento; o health da API respondia 200, mas endpoints autenticados retornavam 500. CAUSA OBSERVADA: a API publicada já selecionava `products.variations` e `sale_items.variation_id`/`variation_name`, enquanto o banco de produção ainda não tinha a migration `038_product_variations.sql`. CORREÇÃO: aplicar a migration 038 no banco de produção; depois a tela Fiado real voltou a renderizar os dados (total R$ 556,50 e clientes). COMO EVITAR: toda publicação que introduz colunas deve ter uma etapa explícita de migration antes/de junto do deploy e validação autenticada de um endpoint que toca o schema; health 200 não prova compatibilidade entre API e banco.
