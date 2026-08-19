# PRD — Lucro na Revenda

Status: aprovado para implementação
Data: 2026-08-13
Produto: vertical da família Lucro para compra e revenda

## Visão

O Lucro na Revenda atende negócios que compram mercadorias prontas e lucram por estoque, giro,
canal e negociação. O fluxo canônico é
`comprar/importar → receber → precificar → anunciar → vender → trocar/garantir → repor`.

Moda, cosméticos, eletrônicos, importados, semijoias, acessórios e comércio por WhatsApp são
segmentos do produto, não novos aplicativos.

## Módulos completos

1. **Catálogo mestre**: produto, marca, categoria, coleção, fornecedor, SKU, EAN, foto e status.
2. **Variações**: cor, tamanho, capacidade, modelo, estado e estoque/preço próprios.
3. **Compras**: cotação, pedido, recebimento parcial, divergência, devolução ao fornecedor e
   contas a pagar.
4. **Importação**: moeda, câmbio, frete, seguro, imposto, taxa, desembaraço e rateio do custo
   posto por item.
5. **Lotes e custo**: custo médio e por lote, data, origem, quantidade e margem realizada.
6. **Seriais**: IMEI/número de série, condição, origem, reserva, venda, troca e garantia.
7. **Estoque**: entradas, saídas, reservas, inventário, perdas, transferências futuras e
   reposição por mínimo/giro.
8. **PDV e caixa**: venda rápida, código de barras, pagamentos divididos, desconto, fiado,
   sangria, suprimento e fechamento.
9. **Varejo e atacado**: tabelas de preço, quantidade mínima, cliente/segmento, desconto e
   limite de crédito.
10. **Pedidos e reservas**: balcão, WhatsApp e catálogo; separação, expiração e retirada/entrega.
11. **Pós-venda**: troca, devolução, defeito, garantia, crédito e trilha do item serializado.
12. **Divulgação**: catálogo, promoções, cupons, produto em destaque e link compartilhável.
13. **Indicadores**: giro, cobertura, ruptura, encalhe, ticket, margem, lucro, curva ABC e
    desempenho por produto/canal.

## Regras críticas

- Estoque disponível é físico menos reservas ativas e nunca fica negativo.
- O custo posto usa todos os componentes informados e conserva moeda/taxa originais.
- Cada serial ativo pertence a no máximo uma unidade disponível ou reserva.
- Venda de serial marca exatamente aquele item; cancelamento devolve o mesmo serial.
- Promoções válidas não se empilham silenciosamente.
- Troca, devolução e garantia geram movimentos auditáveis, nunca edição do histórico.
- O servidor recalcula preços, crédito, estoque e totais do checkout.

## Experiência e identidade

- Home em formato de mesa de operação: vender, receber, separar e repor.
- Assinatura visual: trilha de giro do produto, do lote à venda.
- Paleta: `#2457C5` cobalto, `#FFB229` etiqueta, `#17304F` tinta, `#F4F7FB` papel e
  `#25282D` grafite.
- Vocabulário: mercadoria, lote, giro, estoque disponível, custo posto e reposição.

## Critérios de aceite

1. Compra parcial atualiza apenas itens recebidos e preserva pendências.
2. Importação rateia custos e calcula custo posto por item sem misturar moedas.
3. Produto serializado só pode ser vendido quando disponível.
4. PDV aceita pagamentos divididos cuja soma feche o total.
5. Reserva expira e libera estoque de forma idempotente.
6. Preços de atacado respeitam quantidade mínima e cliente elegível.
7. Troca/garantia mantém rastreabilidade de venda e serial.
8. Reposição considera estoque disponível e giro recente.
9. Catálogo nunca expõe custo ou estoque físico interno.
10. Android/PWA têm paridade e build isolado.

## Dependências externas honestas

NFC-e/NF-e, meios de pagamento, transportadoras, marketplaces e cotações automáticas dependem
de provedores e credenciais. Estados de integração são persistidos; falha externa nunca é
registrada como sucesso.
