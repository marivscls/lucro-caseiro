---
id: e3ce86fd-5266-436c-92c1-09bbbd4cf088
slug: ui
type: scar
title: Primeiros Passos: não inverter os heroes das etapas 1 e 2
tags: onboarding, primeiros-passos, etapa-1, etapa-2, produto, venda, assets, ordem, correcao
provenance: dito
evidence: Referências e correções explícitas da usuária em 2026-08-23/24; apps/mobile/src/shared/components/getting-started-overlay.tsx; assets getting-started-product.png e getting-started-sale.png
decay: stable
created: 2026-08-23T23:45:57.558911600+00:00
updated: 2026-08-24T12:39:12.383130600+00:00
validated: 2026-08-24T12:39:12.383130600+00:00
links: 
---

CORREÇÃO CONSOLIDADA DA USUÁRIA (2026-08-23/24): a inversão ocorreu nos assets do guia. A ETAPA 1 continua sendo “Cadastre o que você vende” e usa a caixa com cartão de preço; o PNG com recibo, caixa, cartão vinho e check pertence à ETAPA 2, “Registre sua primeira venda”. A referência mais recente da etapa 1 é a fonte de verdade e também remove a repetição acidental: descrição “Comece pelo essencial...” e card separado “Você poderá adicionar fotos...”. COMO EVITAR: nomear e mapear assets por etapa (`product`/`sale`), preservar o PNG já aprovado ao introduzir outro e conferir progress bar, badge, título e CTA juntos antes de substituir o arquivo canônico.
