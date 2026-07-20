# ai.context.mobile.md — Retail (Operação da Papelaria)

---

## Purpose

Oferecer uma central operacional exclusiva da marca Papelaria para caixa/PDV, listas,
inventário, reposição, serviços, promoções, preços, etiquetas, reservas e convênios.

## Non-goals

- Não contém regras financeiras próprias; mostra e envia dados para a API de varejo.
- Não emite nota fiscal nem processa cartão diretamente.

## Boundaries & Ownership

- Depende de `products`, `clients`, `@lucro-caseiro/ui`, React Query e contratos.
- A rota `/retail` é protegida por `FeatureRouteGuard("varejoPapelaria")`.

## Code pointers

- `api.ts` — cliente HTTP tipado.
- `hooks.ts` — queries/mutations e invalidações.
- `apps/mobile/src/app/retail.tsx` — central operacional responsiva.

## Components

- Reutiliza `Button`, `Card`, `Chip`, `Input`, `StandardModal` e `ScreenHeader`.
- O seletor trabalha por produto/variação e permite quantidade por item.
- Busca por nome/código e reutiliza `BarcodeScanner` para leitura pela câmera.

## Hooks

- Documentos por tipo, caixa, cotação/checkout, reposição, promoções, preços,
  etiquetas, convênios e finalização de inventário.
- Mutações invalidam `retail`, `products` e `sales`.

## API Integration

- Base privada `/api/v1/retail`.
- O PDV chama `/checkout/quote` antes de `/checkout`, usando o total autoritativo.
- Etiquetas usam o exportador HTML/PDF já existente no app.

## Contracts

- Tipos `RetailDocument`, `RetailDocumentKind`, `PaymentMethod` e DTOs de varejo.

## Error Handling

- Valida seleção, quantidade, valores e divisão de pagamento localmente.
- Erros da API são apresentados por `alertError`; sucessos usam `showToast`.

## Performance

- React Query mantém os grupos em cache e invalida somente as famílias afetadas.
- A tela mostra no máximo três documentos recentes por grupo no painel compacto.

## Test matrix

- Typecheck e lint da tela/hooks/api.
- Fluxo manual: abrir caixa, cotar/vender com promoção e duas formas, contar variação,
  vender lista escolar, avançar serviço/reserva e exportar etiquetas.

## Examples

- Mais → Operação da Papelaria → Venda no PDV.
- Pedido de catálogo `ready` → Receber → checkout com a reserva vinculada.

## Change log / Decisions

- 2026-07-20: o PDV passou a carregar todas as páginas de produtos e a consultar códigos pela API.
  Leitura encontrada seleciona o item e incrementa sua quantidade; produto com várias variações
  pede a escolha da variação. Código desconhecido abre o `CreateProductForm` preenchido e continua
  a operação após o cadastro.

- 2026-07-19: central criada com componentes existentes; documentos compartilham o
  mesmo painel e modal para manter a superfície pequena e coerente.
