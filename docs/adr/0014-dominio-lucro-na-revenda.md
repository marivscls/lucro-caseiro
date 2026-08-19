# ADR-0014 — Domínio do Lucro na Revenda

**Status:** aceito (2026-08-13)

## Decisão

- Produtos, variações, compras, estoque, vendas e o núcleo `retail` são canônicos.
- Recursos escolares permanecem exclusivos da Papelaria.
- Revenda adiciona importação/custo posto, lotes, seriais, atacado e pós-venda como tipos e
  entidades próprios.
- IMEI/serial possui unicidade por conta e ciclo explícito disponível → reservado → vendido →
  devolvido/garantia.
- Custos de importação preservam moeda, câmbio e componentes originais; o custo posto em reais
  é snapshot do recebimento.

## Razão

O núcleo de varejo já cobre caixa, PDV, inventário, reposição e promoções. A diferenciação real
está em origem/custo, unidade serializada, atacado e pós-venda.
