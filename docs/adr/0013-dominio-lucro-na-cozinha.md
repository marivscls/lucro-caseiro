# ADR-0013 — Domínio do Lucro na Cozinha

**Status:** adiado (2026-08-13) — especificação preservada para possível extensão futura

## Decisão

- Receitas, materiais, produtos, pedidos, vendas e `production_runs` existentes permanecem
  canônicos.
- A vertical adiciona lotes de ingrediente, ordens/lotes de produção, rastreabilidade e agenda
  de capacidade por documentos tipados.
- Compra recebida pode criar lote; produção concluída consome lotes por FEFO, com confirmação
  do consumo real.
- Receita e custos usados pela produção são snapshots.
- A etiqueta usa dados declarados e rastreáveis; não infere conformidade nutricional.

## Razão

Reutilizar as entidades atuais evita dois estoques e dois financeiros, enquanto lotes e
rastreabilidade resolvem a operação que distingue uma cozinha de outro negócio artesanal.
