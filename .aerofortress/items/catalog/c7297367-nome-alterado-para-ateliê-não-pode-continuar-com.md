---
id: c7297367-60a3-4b6a-99cb-6615b4ec7086
slug: catalog
type: scar
title: Nome alterado para ateliê não pode continuar compartilhando slug papelaria
tags: catalog, slug, whatsapp, correction
provenance: dito
evidence: Relato direto da usuária e captura mostrando catalogo.lucrocaseiro.com.br/c/papelaria.
decay: stable
created: 2026-08-01T23:09:29.291031300+00:00
updated: 2026-08-01T23:09:29.291031300+00:00
validated: 2026-08-01T23:09:29.291031300+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-01): após mudar a identificação da vitrine para “ateliê”, o compartilhamento do serviço ainda gerou `/c/papelaria`. A UI não pode dar a entender que o endereço foi atualizado enquanto `catalog_settings.slug` permanece antigo; validar a persistência do slug e o valor retornado por `useCatalogSettings` antes de montar o WhatsApp.
