# PRD — Operação completa do Lucro na Papelaria

Status: implementado e validado localmente
Data: 2026-07-19
Responsável: Produto e Engenharia

## Resumo

Esta evolução transforma o Lucro na Papelaria em uma operação de varejo de balcão,
volta às aulas e serviços gráficos. O produto continua reutilizando identidade,
assinatura, produtos, clientes, fornecedores, compras, vendas, financeiro e catálogo
da plataforma, mas ganha fluxos próprios de papelaria.

O pacote cobre:

1. PDV, pagamentos divididos e fechamento de caixa.
2. Listas escolares e kits.
3. Inventário por contagem.
4. Reposição inteligente e pedidos de compra.
5. Ordens de serviço para impressão e personalizados.
6. Promoções e alteração de preços em massa.
7. Etiquetas de preço e código de barras em lote.
8. Carrinho, reserva e pedidos do catálogo.
9. Clientes institucionais e convênios.
10. Base fiscal e fronteiras para provedores externos.

## Princípios

- Produto, variação, cliente, fornecedor e venda existentes são as fontes canônicas.
- Toda operação pertence ao usuário autenticado; IDs de outro usuário são rejeitados.
- Estoque nunca pode ficar negativo por venda, reserva, inventário ou cancelamento.
- Valores monetários são calculados e validados no backend.
- A Papelaria usa capacidades de marca; outras marcas não recebem rotas ou navegação.
- Integrações externas falham de forma explícita, sem fingir emissão ou pagamento.
- A primeira versão não depende de hardware fiscal, impressora específica ou ERP.

## Arquitetura funcional

### Documento de varejo

Listas escolares, contagens, pedidos de compra, ordens de serviço, pedidos do
catálogo e documentos fiscais compartilham um cabeçalho e itens. O tipo do documento
define os estados permitidos e o schema do payload. Essa estrutura evita tabelas e
CRUDs duplicados, mantendo validação de domínio por tipo.

### 1. PDV e caixa

- Abrir um turno com fundo inicial.
- Impedir dois turnos abertos para a mesma conta.
- Registrar suprimento, sangria, venda e estorno por forma de pagamento.
- Aceitar Pix, dinheiro, cartão, transferência e fiado na mesma venda.
- Exigir que a soma dos pagamentos seja igual ao total líquido.
- Calcular desconto por item/promoção e desconto manual limitado ao total.
- Fechar turno informando o dinheiro contado.
- Exibir total esperado, contado e diferença.
- Registrar toda venda de varejo no módulo canônico de vendas e estoque.

### 2. Listas escolares e kits

- Cadastrar lista por escola, série, turma e ano.
- Adicionar produto, variação, quantidade, obrigatoriedade e substituição permitida.
- Calcular disponibilidade e valor atual usando o catálogo de produtos.
- Duplicar uma lista para o ano seguinte.
- Converter lista em orçamento/carrinho do PDV sem recadastrar itens.
- Kit vendido baixa os componentes, nunca um estoque paralelo.

### 3. Inventário

- Criar contagem geral ou por categoria.
- Capturar a quantidade esperada no início da contagem.
- Informar contagem por produto/variação, inclusive por código de barras.
- Exibir divergência antes da finalização.
- Exigir motivo para ajustes não nulos.
- Finalizar de forma idempotente e registrar o ajuste no histórico.

### 4. Reposição

- Sugerir compra a partir de estoque mínimo, estoque disponível e vendas recentes.
- Considerar reservas ativas no estoque disponível.
- Exibir quantidade sugerida, último custo e fornecedor quando disponível.
- Converter sugestões em pedido de compra em rascunho.
- Estados: rascunho, enviado, parcial, recebido e cancelado.
- Recebimento continua sendo feito pela compra canônica, que atualiza estoque e custo.

### 5. Ordens de serviço

- Tipos iniciais: impressão, cópia, plastificação, encadernação e personalizado.
- Especificações: papel, tamanho, cor, acabamento, páginas e observações.
- Vincular cliente, arquivo, prazo, quantidade, valor e sinal.
- Estados: orçamento, aguardando arquivo, produção, pronto, entregue e cancelado.
- O sinal nunca pode superar o valor total.
- Entregue não significa automaticamente quitado.

### 6. Promoções e preços

- Promoção percentual, valor fixo e leve-X-pague-Y.
- Aplicação por produto ou categoria, dentro de período configurado.
- Promoções inativas, expiradas ou futuras não alteram o preço.
- O backend escolhe a melhor promoção válida por item, sem empilhar descontos.
- Atualização em massa aceita categoria, percentual de reajuste ou markup sobre custo.
- Preço resultante deve ser positivo e preservar histórico operacional da venda.

### 7. Etiquetas em lote

- Selecionar produtos por IDs, categoria, compra ou estoque alterado.
- Gerar nome, preço, SKU/código de barras e variação.
- Modelos: produto e gôndola.
- Código interno é aceito quando o produto não possui EAN.
- A geração retorna HTML imprimível no PWA e usa impressão nativa do navegador.

### 8. Pedidos do catálogo

- Visitante monta carrinho sem autenticação.
- Informa nome, telefone, retirada/entrega e observações.
- O backend recalcula preço e disponibilidade.
- Reserva possui validade e não baixa estoque antes da confirmação.
- Estados: novo, confirmado, separado, pronto, concluído, expirado e cancelado.
- Confirmação pode converter o pedido em venda; cancelamento libera a reserva.
- Catálogo nunca expõe custo, quantidade física ou dados internos.

### 9. Instituições e convênios

- Complementar um cliente existente com razão social, documento e responsável.
- Configurar limite de crédito, prazo, desconto padrão e tabela de preço.
- Acompanhar saldo utilizado e bloquear nova venda acima do limite.
- Permitir escola, empresa, escritório e convênio.
- Extrato usa vendas e recebimentos canônicos, sem saldo paralelo editável.

### 10. Fiscal e integrações

- Registrar solicitação de NFC-e/NF-e vinculada à venda.
- Estados: rascunho, aguardando configuração, processando, autorizada, rejeitada,
  cancelada e contingência.
- Guardar provedor, chave, número, série, payload e erro sanitizado.
- Sem provedor configurado, a solicitação fica `aguardando_configuracao`.
- Nenhum documento é marcado como autorizado sem retorno assinado do provedor.
- TEF, SEFAZ e conciliação bancária dependem de credenciais, certificados,
  homologação e contratos externos; o núcleo entrega a fronteira e a rastreabilidade.

## Modelo de dados

- `retail_documents`: cabeçalho tipado, status, parte, valores, prazo e payload JSONB.
- `retail_document_items`: produto/variação, snapshots, quantidade, preço e metadados.
- `retail_cash_movements`: turno, tipo, forma de pagamento, valor e referência.
- `retail_promotions`: regra, alvo, período e estado.
- `retail_business_accounts`: extensão institucional de um cliente.
- `retail_price_changes`: auditoria das alterações em massa.

Todos os documentos carregam `user_id`; consultas e mutações usam `user_id + id`.

## API

- `/api/v1/retail/cash/*`
- `/api/v1/retail/school-lists/*`
- `/api/v1/retail/inventory/*`
- `/api/v1/retail/replenishment`
- `/api/v1/retail/purchase-orders/*`
- `/api/v1/retail/service-orders/*`
- `/api/v1/retail/promotions/*`
- `/api/v1/retail/prices/bulk`
- `/api/v1/retail/labels/batch`
- `/api/v1/retail/catalog-orders/*`
- `/api/v1/retail/business-accounts/*`
- `/api/v1/retail/fiscal-documents/*`
- `/api/v1/retail/checkout`

Rotas autenticadas exigem a capacidade de marca `varejoPapelaria`. A criação pública
de pedido resolve a marca pelo catálogo e aplica rate limit.

## Experiência

- Uma tela “Operação” concentra o cockpit da Papelaria.
- No desktop, módulos usam grade/tabela; no celular, cards e ações progressivas.
- O PDV mantém busca e código de barras como entrada principal.
- Formulários longos usam seções recolhíveis e seletores sob demanda.
- Ações financeiras ou de estoque exibem loading somente no registro afetado.

## Critérios de aceite

1. Um turno pode ser aberto, movimentado e fechado com diferença calculada.
2. Uma venda com dois pagamentos é aceita apenas quando a soma fecha o total.
3. Uma lista escolar calcula preço e disponibilidade pelos produtos atuais.
4. Uma contagem finalizada ajusta produto/variação uma única vez e registra motivo.
5. Reposição sugere quantidade para item abaixo do mínimo e cria pedido rascunho.
6. Ordem de serviço preserva sinal, saldo e transições válidas.
7. Promoção válida altera a cotação do PDV; expirada não altera.
8. Alteração em massa nunca gera preço zero/negativo e deixa auditoria.
9. Etiquetas em lote produzem HTML com preço e código.
10. Pedido público recalcula preços e reserva somente estoque disponível.
11. Convênio acima do limite é rejeitado.
12. Solicitação fiscal sem provedor não é marcada como autorizada.
13. API rejeita o módulo para marcas sem `varejoPapelaria`.
14. Typechecks, lint, testes e `build:pwa:papelaria` passam.

## Fora de escopo operacional

- Homologar certificado digital, CSC, credenciais SEFAZ, TEF ou adquirente.
- Transmitir documento fiscal real sem provedor contratado e ambiente homologado.
- Controlar múltiplas lojas/depósitos ou permissões de vários operadores.
- Integrar balança, gaveta ou impressora fiscal por driver proprietário.

Esses itens exigem decisões, contratos ou credenciais externas e não podem ser
simulados como concluídos pelo código local.

## Evidências de implementação

- Contratos: `packages/contracts/src/schemas/retail.ts`.
- Banco: `packages/database/src/schema/retail.ts` e migration 041.
- API: `apps/api/src/features/retail/` e integração pública com `catalog`.
- App: `apps/mobile/src/app/retail.tsx`, hooks/API e navegação exclusiva da Papelaria.
- Segurança operacional: feature gate de marca, escopo por usuário, propriedade da venda
  fiscal e índice único de caixa aberto.
- Validação em 2026-07-19: lint API/mobile, cinco typechecks, context lint, 640 testes API,
  341 testes mobile e build PWA `lucro-papelaria`.

O código entrega a fronteira fiscal e registra solicitações sem simular autorização. A
transmissão real continuará bloqueada até existirem provedor, certificado e homologação.
