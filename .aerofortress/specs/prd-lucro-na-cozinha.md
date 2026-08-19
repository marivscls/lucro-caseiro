# PRD — Lucro na Cozinha

Status: pesquisa futura — fora da implementação de apps separados
Data: 2026-08-13
Produto: vertical da família Lucro para negócios de alimentação

## Visão

O Lucro na Cozinha atende quem transforma ingredientes em produtos vendidos por encomenda,
pronta-entrega, balcão ou delivery. A operação canônica é
`planejar → comprar → produzir → etiquetar → vender → entregar → apurar lucro`.

Não é uma skin do Lucro Caseiro. Reutiliza conta, clientes, fornecedores, produtos, vendas,
financeiro e assinatura, mas prioriza ficha técnica, segurança operacional dos alimentos,
produção por lote e pedidos com horário de entrega.

## Público

Confeitarias, doceiras, salgadeiras, marmitas, padarias artesanais, congelados, buffet,
cozinhas de delivery, molhos, geleias, conservas e produtores de alimentos por encomenda.

## Módulos completos

1. **Cardápio e produtos**: tamanhos, sabores, adicionais, combos, disponibilidade por dia,
   canal de venda, preço e foto.
2. **Fichas técnicas**: ingredientes, perdas de preparo, rendimento, porção, custo, embalagem,
   mão de obra, custos fixos, taxas e preço sugerido.
3. **Ingredientes e compras**: unidades conversíveis, fornecedores, último custo, estoque
   mínimo, lista de compras e recebimento.
4. **Lotes de ingredientes**: quantidade, validade, origem, custo e consumo FEFO.
5. **Produção**: ordem de produção, receita, quantidade planejada/real, consumo real,
   rendimento, perdas, responsável, início e conclusão.
6. **Rastreabilidade**: lote produzido, ingredientes consumidos, validade calculada,
   recolhimento interno e histórico de alterações.
7. **Pedidos**: encomenda, balcão, retirada ou entrega; itens, adicionais, observações,
   janela, sinal, saldo, status e comprovante.
8. **Agenda de cozinha**: capacidade por período, conflitos, fila de preparo e calendário de
   entregas.
9. **Etiquetas**: identificação simples, lote, fabricação, validade, conservação,
   ingredientes e alergênicos configurados pelo negócio.
10. **Delivery**: endereço, taxa, rota/transportador, retirada, status e prova de entrega.
11. **Financeiro**: custo previsto/real, faturamento, recebíveis, desperdício, margem e lucro
    por produto, pedido, canal e período.
12. **Catálogo**: cardápio público, disponibilidade, adicionais, pedido e WhatsApp.

## Regras críticas

- Quantidade e dinheiro são calculados no backend e persistidos por snapshot.
- Produção concluída consome lotes uma única vez e registra lote de saída.
- Ingrediente vencido ou bloqueado não pode ser sugerido para consumo.
- Sinal não pode superar o total; conclusão não significa quitação.
- Alterar receita não reescreve custo ou composição de lotes históricos.
- Alergênicos e conservação são declarados pelo negócio; o app não certifica conformidade.
- A etiqueta simples continua disponível. Tabela nutricional regulatória só pode ser gerada
  com dados e metodologia explicitamente fornecidos, sem inferência silenciosa.

## Experiência e identidade

- Home orientada pelo dia: pedidos, produção, entregas e compras urgentes.
- Assinatura visual: faixa de produção que avança da bancada à entrega.
- Paleta: `#C84B31` paprika, `#F2B544` açafrão, `#1E4D45` folha, `#FFF8ED` massa e
  `#292421` carvão. O paprika não substitui cores semânticas.
- Vocabulário: receita, ingrediente, rendimento, lote, fornada, pedido e entrega.

## Critérios de aceite

1. Uma ficha calcula custo por rendimento e preço considerando embalagem, taxas e perdas.
2. Uma compra cria lotes de ingrediente com custo e validade.
3. Uma produção planejada reserva insumos; concluí-la registra consumo real e perdas.
4. O lote produzido é rastreável aos lotes de ingredientes consumidos.
5. Pedidos aparecem na capacidade do dia e percorrem estados válidos.
6. Recebimentos parciais geram somente o saldo pendente.
7. Etiquetas usam os dados do lote e nunca inventam informação regulatória.
8. O catálogo aceita adicionais e recalcula o total no servidor.
9. Dashboard apresenta lucro e desperdício derivados de dados reais.
10. Android e PWA têm paridade funcional e o build não altera outras marcas.

## Dependências externas honestas

Mapas, roteirização, pagamento online, emissão fiscal e cálculo nutricional certificado exigem
provedores, credenciais e/ou profissional habilitado. A plataforma entrega fronteiras e estados
de integração, sem marcar uma operação como concluída sem confirmação do provedor.
