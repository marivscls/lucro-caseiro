---
id: 17f2c3fc-0a6a-44b5-b3e0-0da639ed828b
slug: marketing
type: scar
title: Categoria de posts precisa aparecer no Estúdio de Post Drafts
tags: marketing, ui, posts, post-drafts, categoria, correção
provenance: dito
evidence: Captura enviada pela usuária em 2026-08-12; primeira implementação em apps/web/src/features/marketing/content-brief-editor.tsx não ficou visível na tela indicada
decay: stable
created: 2026-08-12T18:02:15.301346+00:00
updated: 2026-08-12T18:02:15.301346+00:00
validated: 2026-08-12T18:02:15.301346+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-12): ao pedir uma categoria de posts e indicar a tela de Posts, adicionar a opção apenas ao formulário genérico de conteúdo não atende. A tela relevante é o Estúdio de Posts/Post Drafts, onde aparecem “Campanhas para criar posts” e a biblioteca de drafts. COMO EVITAR: localizar a interface exata pelo texto visível da captura e colocar o seletor/filtro na fonte canônica dessa tela, conectando-o à geração; confirmar visualmente onde a usuária encontrará a opção.
