---
id: a35b9d45-826d-4124-828b-880280a6d27b
slug: geral
type: decision
title: Consultoria IA transforma a proposta em campanha com confirmação explícita
tags: marketing, campanhas, consultoria-ia, ui, fluxo
provenance: dito
evidence: C:\Users\maria\Documents\projects\selenita\apps\desktop\src\AiConsultant.tsx; apps/desktop/src/AiConsultant.test.tsx; 4/4 testes focados, typecheck e ESLint aprovados em 2026-08-15
decay: stable
created: 2026-08-15T22:54:18.848855600+00:00
updated: 2026-08-15T22:54:18.848855600+00:00
validated: 2026-08-15T22:54:18.848855600+00:00
links:
---

DECISÃO DA USUÁRIA (2026-08-15): a criação de campanha deve nascer na Consultoria IA, que monta a proposta completa a partir da conversa, em vez de depender de um cadastro manual isolado. A resposta da consultoria oferece a ação explícita “Criar campanha”; ao confirmar, ela é persistida como MarketingResource(kind="campaign", status="active"), mantendo o texto completo como briefing e ficando disponível no fluxo “Campanhas para criar posts”. A confirmação permanece necessária para não transformar respostas exploratórias em campanhas ativas por acidente.
