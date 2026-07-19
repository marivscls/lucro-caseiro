---
id: 8e48dc69-6a3a-466f-8b63-301bc0d90473
slug: marketing
type: scar
title: Central de Marketing não pode reduzir o Lucro Caseiro a confeiteiras iniciantes
tags: central-de-marketing, posicionamento, publico, segmentacao, ia, marca
provenance: dito
evidence: apps/api/src/features/marketing/marketing.system-prompt.ts; apps/api/src/features/marketing/campaign-ai.ts; apps/api/src/features/marketing/marketing.seed.ts; apps/web/src/features/marketing/campaign-studio.tsx; docs/marketing/estrategia-marketing-vendas.md; docs/marketing/publicos-e-contextos.md; 16 testes focados aprovados, typechecks API/web e lint API/web aprovados em 2026-07-18.
decay: stable
created: 2026-07-19T00:01:13.892522600+00:00
updated: 2026-07-19T00:07:29.381828800+00:00
validated: 2026-07-19T00:07:29.381828800+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-18): a Central de Marketing voltou a descrever o público do Lucro Caseiro principalmente como mulheres confeiteiras iniciantes de 25 a 55 anos. Esse recorte é estreito e contradiz o posicionamento do produto. Confeitaria e outros segmentos caseiros são exemplos de entrada, nunca o teto: a comunicação deve abranger profissionais autônomos, MEIs, prestadores de serviço, produtores, comerciantes, equipes e negócios de diferentes segmentos, do início à operação estruturada e ao crescimento. COMO EVITAR: separar sempre o mercado amplo da marca do público tático de uma campanha ou peça; prompts, perfis de marca, documentos e sugestões não podem promover um recorte tático a definição global. Quando o briefing estiver vazio, comparar segmentos e não escolher confeitaria por ordem, frequência ou hábito. CORREÇÃO IMPLEMENTADA: guardrail obrigatório em todos os fluxos de IA, prompt de campanha v4, público guarda-chuva no seed, rótulo “Público desta campanha” e documentos canônicos revisados.
