---
id: 7a1a08f3-07db-4b11-8ad1-7ab8ef75238e
slug: deploy
type: scar
title: Catálogo público: renderer local não prova a URL publicada
tags: catalogo-publico, railway, producao, validacao, renderer
provenance: dito
evidence: .aerofortress/catalog-production-current.png; apps/api/src/features/catalog/catalog.routes.ts; Railway deployment 69fb3d53-8158-4ed3-9267-49705b87ffe3
decay: stable
created: 2026-08-17T01:25:21.223103700+00:00
updated: 2026-08-17T01:31:30.648283800+00:00
validated: 2026-08-17T01:31:30.648283800+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-08-16): testes, build e screenshots de fixture/local foram apresentados como se comprovassem o redesign, mas `https://catalogo.lucrocaseiro.com.br/c/:slug` continuava servido pelo deployment antigo da API. A usuária reforçou que, antes de qualquer novo redesign, é obrigatório provar o renderer com um marcador temporário na URL pública do subdomínio — localhost, prévia interna, tela administrativa ou rota do PWA não contam. REGRA: consultar a URL exata sem cache, identificar o serviço/deployment/commit de `@lucro-caseiro/api`, localizar o template naquele commit e capturar a própria produção. Se o HTML publicado ainda tiver `placeholder="Nome do produto"`, `COMPRE AGORA` ou `Pedir no WhatsApp`, declarar deploy pendente e jamais concluir. Não publicar o marcador nem aplicar migrations sem autorização explícita; enquanto isso, não fazer novas alterações visuais.
