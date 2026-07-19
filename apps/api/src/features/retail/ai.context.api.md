# ai.context.api.md — Retail (Operação da Papelaria)

---

## Purpose

Centralizar a operação de varejo do Lucro na Papelaria: caixa/PDV, listas escolares,
inventário, reposição, ordens de serviço, promoções, preços, etiquetas, reservas do
catálogo, convênios e fronteira fiscal.

## Non-goals

- Não substitui a emissão fiscal homologada de um provedor/SEFAZ.
- Não integra TEF ou adquirente de cartão; registra as formas informadas pelo operador.
- Não duplica venda, estoque ou compra: usa os casos de uso canônicos dessas features.

## Boundaries & Ownership

- Depende de `products`, `sales`, `clients`, `catalog` e dos contratos compartilhados.
- É habilitada apenas quando a marca expõe `varejoPapelaria`.
- Recebimento físico de mercadoria continua em `purchases`; o pedido de compra nasce aqui.

## Code pointers

- `retail.routes.ts` — endpoints autenticados e criação pública de reservas.
- `retail.usecases.ts` — orquestra regras, compensações e integrações canônicas.
- `retail.domain.ts` — transições, promoções, rateio de desconto e HTML seguro.
- `retail.repo.pg.ts` — documentos, caixa, promoções, convênios e auditoria de preço.
- `retail.types.ts` — porta de persistência.

## Data Model

- `retail_documents` e `retail_document_items`: documentos tipados e seus itens.
- `retail_cash_movements`: trilha imutável de vendas, suprimentos, sangrias e estornos.
- `retail_promotions`: regras por produto/categoria e período.
- `retail_business_accounts`: convênios, limites e crédito usado.
- `retail_price_changes`: auditoria de reajustes.

## Invariants

- Só existe um caixa aberto por usuário.
- Checkout exige caixa aberto, estoque disponível e soma exata dos pagamentos.
- Promoções não acumulam: vence a melhor regra aplicável; desconto adicional é rateado.
- Reserva de catálogo expira em quatro horas e só é recebida quando estiver `ready`.
- Venda concluída passa por `SalesUseCases`, preservando estoque e financeiro canônicos.
- Contagem finalizada ajusta estoque por produto/variação e exige motivo para diferença.

## Operations

```yaml
feature: retail
base: /api/v1/retail
public_base: /api/v1/public/retail
operations:
  - documents CRUD e transições
  - cash open/current/movements/close
  - checkout quote/checkout
  - replenishment/purchase-order
  - inventory finalize
  - promotions/prices/labels/business-accounts/fiscal-documents
  - public catalog-orders
```

## Authorization & RLS

- Todas as rotas privadas usam `authMiddleware`, `getUserId` e
  `requireBrandFeature("varejoPapelaria")`.
- A rota pública resolve o dono exclusivamente pelo slug ativo da marca Papelaria.
- Repositórios sempre escopam documentos e contas por `userId`.

## Contracts (Zod/DTO)

- `CreateRetailDocumentDto`, `UpdateRetailDocumentDto` e enums de tipo/status.
- `RetailCheckoutQuoteDto` e `RetailCheckoutDto`.
- DTOs de caixa, promoção, preço, etiquetas, convênio, catálogo e documento fiscal.

## Errors

- `ValidationError`: transição, estoque, pagamento, desconto, crédito ou caixa inválido.
- `NotFoundError`: documento, venda, promoção ou convênio fora do escopo do usuário.

## Events / Side effects

- Checkout cria venda, baixa estoque, registra cada pagamento e pode concluir reserva.
- Falha posterior à venda cancela a venda, estorna movimentos e devolve crédito usado.
- Inventário e reajuste aplicam compensação quando uma operação parcial falha.

## Performance

- Listas operacionais são indexadas por usuário/tipo/status/data.
- Reposição limita a leitura a 500 produtos ativos; adequado ao escopo atual do produto.
- Reservas são agregadas no banco por produto e variação.

## Security

- A emissão fiscal valida que a venda pertence ao usuário.
- Etiquetas escapam nome e código antes de gerar HTML.
- Valores, UUIDs, quantidades e limites passam pelos DTOs Zod.

## Test matrix

- Domínio: melhor promoção, leve-X-pague-Y e rateio de desconto.
- Casos de uso: cotação/estoque reservado, checkout/compensação, inventário por variação,
  caixa, crédito e propriedade fiscal.
- Integração: typecheck, lint, suíte API/mobile e build PWA Papelaria.

## Examples

- `POST /checkout/quote` calcula o total autoritativo antes de montar os pagamentos.
- `POST /public/retail/catalog-orders` cria uma reserva a partir do catálogo Papelaria.

## Change log / Decisions

- 2026-07-19: operação completa criada a partir do PRD da Papelaria. Documentos tipados
  evitam dez subsistemas paralelos; venda, compra e estoque continuam canônicos.
- 2026-07-19: fiscal entra como fronteira `waiting_configuration` até existir provedor
  homologado; nenhuma autorização é simulada.
