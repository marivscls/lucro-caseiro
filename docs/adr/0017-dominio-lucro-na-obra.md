# ADR-0017 — Domínio do Lucro na Obra

**Status:** aceito (2026-08-13)

## Decisão

- Cliente, fornecedor, produto/material, compra e financeiro existentes permanecem canônicos.
- Projeto, linha de base, etapa, diário, medição e aditivo são documentos tipados com eventos.
- Proposta aprovada congela linha de base; aditivo aprovado cria nova versão.
- Progresso físico, medição, faturamento e recebimento são estados separados.
- Diário fechado é append-only; correções são novos eventos.
- Fórmulas de composição/BDI são configuráveis e transparentes; o app não produz projeto técnico.

## Razão

Separar execução física de dinheiro evita o erro comum de tratar serviço concluído como valor
recebido e permite apurar desvio real de custo e prazo.
