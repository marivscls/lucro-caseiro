---
id: 4fd56452-4a7b-4410-ad72-6fd41fa90115
slug: ui
type: scar
title: Compartilhar vitrine precisa de ação direta no fluxo correto
tags: servicos, catalogo, vitrine, compartilhamento, whatsapp, pwa, windows, fluxo-incorreto
provenance: dito
evidence: Captura e correção da usuária em 2026-07-31; primeira correção insuficiente no commit 417e18c; painel de Serviços visível com subtítulo “Atendimentos, resultado, pacotes e pedidos da vitrine”
decay: stable
created: 2026-07-31T21:33:35.380421700+00:00
updated: 2026-07-31T21:53:30.656706400+00:00
validated: 2026-07-31T21:53:30.656706400+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-31): após pedir que “Compartilhar vitrine” oferecesse WhatsApp, a primeira correção alterou apenas a tela Catálogo. A captura posterior mostrou que o botão usado fica no painel de Serviços (“Atendimentos, resultado, pacotes e pedidos da vitrine”) e continuava abrindo o share sheet do Windows, com e-mail/Outlook e sem WhatsApp. CORREÇÃO CANÔNICA: identificar e alterar o acionador exato mostrado pela usuária para abrir `openWhatsAppShare` diretamente; só manter o share sheet onde estiver explicitamente rotulado como opção genérica. COMO EVITAR: antes de corrigir ações com rótulos semelhantes em telas diferentes, localizar o fluxo pela composição visível da captura (título, subtítulo e contêiner), não apenas pelo nome da ação.
