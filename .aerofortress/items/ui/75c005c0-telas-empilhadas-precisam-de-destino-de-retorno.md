---
id: 75c005c0-68ec-4660-8375-ccc53dfa0407
slug: ui
type: scar
title: Telas empilhadas precisam de destino de retorno quando não há histórico
tags: navegacao, expo-router, pwa, mobile, voltar, agenda, metricas, cabecalho, responsividade, screen-header
provenance: dito
evidence: Correções da usuária em 2026-07-20 e 2026-07-25; apps/mobile/src/shared/components/screen-header.tsx; apps/mobile/src/shared/components/screen-header.test.tsx; apps/mobile/src/app/tabs/agenda.tsx; apps/mobile/src/app/admin-metrics.tsx; apps/mobile/src/app/labels.tsx; apps/mobile/src/app/tabs/clients.tsx; apps/mobile/src/app/quotes.tsx; apps/mobile/src/app/products.tsx
decay: stable
created: 2026-07-20T22:32:54.579732800+00:00
updated: 2026-07-25T21:21:14.913209300+00:00
validated: 2026-07-25T21:21:14.913209300+00:00
links:
---

SINTOMA ORIGINAL (2026-07-20): na tela Etiquetas, tocar no botão de voltar não fazia nada. CAUSA: o ScreenHeader padrão chamava somente router.back(); quando a rota era a raiz do histórico interno — por acesso direto, recarga ou retomada do PWA — não havia entrada anterior para remover. CORREÇÃO LOCAL: Etiquetas consulta router.canGoBack(); se houver histórico usa router.back(), caso contrário usa router.replace("/tabs").

PRIMEIRA CORREÇÃO EM CLIENTES (2026-07-20): a lista, acessível por “Mais” e atalhos da Home, não tinha seta de voltar porque usava um cabeçalho próprio em vez do ScreenHeader. Foi adicionada uma ação móvel de 44 px com destino funcional para /tabs/more. A usuária confirmou que Clientes deve voltar sempre para “Mais opções”, sem priorizar o histórico.

RECORRÊNCIA EM ORÇAMENTOS (2026-07-25): /quotes ainda dependia do router.back() padrão. CORREÇÃO: Orçamentos usa histórico quando disponível e fallback para /tabs/more quando a rota é raiz.

RECORRÊNCIA SISTÊMICA (2026-07-25): a usuária relatou que os botões de voltar não eram clicáveis em várias telas. A auditoria mostrou que 15 usos do ScreenHeader ainda herdavam router.back() sem fallback. CORREÇÃO CANÔNICA: ScreenHeader verifica router.canGoBack() e, na ausência de histórico, usa router.replace(fallbackRoute); o fallback padrão é /tabs/more, com fallbackRoute="/tabs" em destinos ligados à Home. O cabeçalho e o Pressable têm camada explícita e alvo centralizado de 44 px.

NOVA RECORRÊNCIA NA AUDITORIA COMPLETA (2026-07-25): Agenda ainda renderizava título próprio sem seta, e Métricas do produto configurava um cabeçalho nativo que continuava invisível porque o Stack raiz usa headerShown: false. CORREÇÃO: ambas passaram a usar ScreenHeader no mobile; Agenda declara fallbackRoute="/tabs" e Métricas herda /tabs/more. O título interno duplicado de Métricas foi removido. A auditoria confirmou retorno visível em 24 telas/fluxos secundários, e testes cobrem histórico existente, acesso direto sem histórico, fallback específico e onBack customizado.

COMO EVITAR: toda tela secundária ou fluxo empilhado precisa distinguir retorno histórico de destino canônico. Novos usos herdam o fallback funcional do ScreenHeader; destinos específicos declaram fallbackRoute ou onBack. Não confiar em opções de cabeçalho nativo quando o Stack pai desativa headers. Abas-raiz como Início, Vendas e Mais não recebem voltar artificial; Agenda mantém a exceção pedida para permitir retorno à Home.
