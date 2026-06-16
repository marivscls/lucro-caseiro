# ai.context.mobile.md — Sales (Mobile Feature)

---

## Purpose

Registrar e gerenciar vendas: criar vendas via wizard de 4 passos (selecionar produtos, cliente, pagamento, revisar), listar vendas com filtro por status, visualizar detalhes e atualizar status (marcar como pago, cancelar). Exibe resumo do dia na Home.

## Non-goals

- Nao gerencia produtos (feature `products`).
- Nao gerencia clientes (feature `clients`).
- Nao calcula precificacao (feature `pricing`).
- Nao gera relatorios financeiros (feature `finance`).

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `Sale`, `CreateSale`, `UpdateSaleStatus`, `SaleStatus`), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/hooks/use-limit-check`, `shared/utils/api-client`.
- **Depende de (cross-feature):** `features/products/hooks` (`useProducts` para selecao de produtos no wizard), `features/clients/hooks` (`useClients` para selecao de cliente).
- **Dependentes:** `features/clients` (`useSales` usado no ClientDetail para historico), `tabs/index` (Home usa `useTodaySummary`).

## Code pointers

| Arquivo                                                     | Descricao                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `apps/mobile/src/features/sales/api.ts`                     | Funcoes HTTP (fetchSales, fetchSale, fetchTodaySummary, createSale, updateSaleStatus) |
| `apps/mobile/src/features/sales/hooks.ts`                   | React Query hooks                                                                     |
| `apps/mobile/src/features/sales/components/sale-card.tsx`   | Card de venda na listagem                                                             |
| `apps/mobile/src/features/sales/components/sale-detail.tsx` | Detalhe da venda com acoes de status + enviar recibo                                  |
| `apps/mobile/src/features/sales/receipt.ts`                 | `buildReceiptMessage(sale)` — texto do recibo p/ WhatsApp                             |
| `apps/mobile/src/features/sales/fiado.ts`                   | Fiado (vendas pendentes): `groupFiados`, `totalOwed`, `buildChargeMessage`            |
| `apps/mobile/src/app/fiado.tsx`                             | Tela `/fiado` (quem te deve, por cliente, + cobrar no WhatsApp)                       |
| `apps/mobile/src/app/tabs/new-sale.tsx`                     | Screen do wizard de nova venda (tab)                                                  |

## Components

### `SaleCard`

- **Props:** `{ sale: Sale; onPress?: () => void }`
- Exibe dot de status colorido, nome do primeiro produto (+N), itens resumidos, valor total, Badge de status (Pago/Pendente/Cancelado) e forma de pagamento.

### `SaleDetail`

- **Props:** `{ sale: Sale; clientPhone?: string | null; onStatusUpdated?: () => void; onEditPress?: () => void }`
- Exibe status com Badge, dados do cliente, forma de pagamento, data formatada, observacoes.
- Lista de itens com quantidade x preco unitario e subtotal.
- Card de total com fundo verde.
- Botao "Enviar recibo no WhatsApp" (`buildReceiptMessage` + `openWhatsApp`/`openWhatsAppShare`): se `clientPhone` vai direto pro contato, senao abre o seletor do WhatsApp. A tela `tabs/sales.tsx` passa o telefone via `useClient`.
- Botao "Marcar como pago" (se pending) e "Cancelar venda" (se nao cancelled), ambos com confirmacao Alert.

### `NewSaleScreen` (tela/wizard, definido no screen)

- Wizard de 4 steps:
  1. **Selecionar produtos:** grid 2 colunas com busca, tap para adicionar ao carrinho, long press para remover. Badge de quantidade. Barra de total no rodape.
     - Produtos por peso (`saleUnit === "kg"`): tap abre um modal com campo de **peso em kg** (decimal-pad) e preview do subtotal; preco exibido como "R$X/kg"; badge mostra o peso (ex.: "1,5 kg"); long press remove a linha inteira (nao faz "−1 kg"). Itens do carrinho carregam `saleUnit` para calcular/exibir corretamente.
     - **Escanear / buscar por código:** o ícone de scan na busca e o atalho "Usar código" abrem a câmera (`BarcodeScanner`); o código lido vira o termo de busca (o back casa por nome OU código). Fallback "Digitar à mão" abre o campo de digitação manual.
  2. **Selecionar cliente:** opcao "Sem cliente (avulso)", busca de clientes, selecao com borda destacada.
  3. **Forma de pagamento:** opcoes Pix, Dinheiro, Cartao, Fiado, Transferencia com icones.
  4. **Revisar e confirmar:** resumo de itens, cliente, pagamento, total. Botao "Registrar venda".
- Progress dots no topo.
- Checa limite freemium via `useLimitCheck("sales")` antes de submeter.
- Modal inline para criar produto caso nao exista nenhum.

## Hooks

| Hook                    | Tipo          | Descricao                                                                                                                     |
| ----------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `useSales(opts?)`       | `useQuery`    | Lista paginada. Query key: `["sales", opts]`                                                                                  |
| `useSale(id)`           | `useQuery`    | Detalhe. Query key: `["sales", id]`                                                                                           |
| `useTodaySummary()`     | `useQuery`    | Resumo do dia (totalSales, totalAmount, averageTicket). `refetchInterval: 60_000`. Query key: `["sales", "summary", "today"]` |
| `useCreateSale()`       | `useMutation` | Cria venda. Invalida `["sales"]` e `["products"]` (a venda da baixa no estoque, entao produtos sao revalidados).              |
| `useUpdateSaleStatus()` | `useMutation` | Atualiza status. Invalida `["sales"]`.                                                                                        |

## API Integration

| Endpoint                      | Verbo | Funcao              | Parametros                        |
| ----------------------------- | ----- | ------------------- | --------------------------------- |
| `/api/v1/sales`               | GET   | `fetchSales`        | `?page=N&status=paid&clientId=ID` |
| `/api/v1/sales/:id`           | GET   | `fetchSale`         | path param `id`                   |
| `/api/v1/sales/summary/today` | GET   | `fetchTodaySummary` | -                                 |
| `/api/v1/sales`               | POST  | `createSale`        | body: `CreateSale`                |
| `/api/v1/sales/:id/status`    | PATCH | `updateSaleStatus`  | body: `UpdateSaleStatus`          |

## Contracts

- `Sale` — venda (id, clientId, clientName, paymentMethod, status, total, soldAt, notes, items[]).
- `Sale.items[]` — item da venda (id, productId, productName, quantity, unitPrice, subtotal).
- `CreateSale` — payload (clientId?, paymentMethod, items[{ productId, quantity, unitPrice }]). `quantity` pode ser decimal (peso em kg) para produtos vendidos por peso.
- `UpdateSaleStatus` — payload ({ status: SaleStatus }).
- `SaleStatus` — `"paid" | "pending" | "cancelled"`.
- `DaySummary` — tipo local (totalSales, totalAmount, averageTicket).

## Error Handling

- **Erro de criacao:** `Alert.alert("Erro", "Nao foi possivel registrar a venda. Tente novamente.")`.
- **Erro de status:** `Alert.alert("Erro", "Nao foi possivel atualizar/cancelar o status.")`.
- **Validacao local:** carrinho nao vazio, forma de pagamento selecionado.
- **Limite freemium:** `useLimitCheck("sales")` bloqueia criacao e mostra paywall.

## Performance

- `useTodaySummary` com `refetchInterval: 60_000` (atualiza a cada 1 minuto na Home).
- Grid de produtos usa `FlatList` com `numColumns={2}`.
- Busca de produtos filtrada localmente (client-side filter).
- Busca de clientes usa query param `search` (server-side).

## Test matrix

- [ ] Wizard navega entre 4 steps corretamente
- [ ] Adicionar/remover produto do carrinho
- [ ] Total do carrinho calculado corretamente
- [ ] `useCreateSale` envia payload com items
- [ ] `useUpdateSaleStatus` muda status
- [ ] `useTodaySummary` refetch a cada 60s
- [ ] Limite freemium bloqueia criacao
- [ ] Venda sem cliente (avulso) funciona

## Examples

- Nova venda acessada via tab "Nova Venda" ou botao "Venda" na Home.
- Rota: `/tabs/new-sale`.
- Fluxo: step 1 (produtos) -> 2 (cliente) -> 3 (pagamento) -> 4 (revisar) -> registrar.

## Change log / Decisions

- Wizard de 4 steps segue principio de "maximo 3 toques para acao principal" (cada step e 1 toque).
- Status da venda: paid (default se nao fiado), pending (se fiado), cancelled.
- Formas de pagamento: pix, cash, card, credit, transfer.
- Resumo do dia usa auto-refresh para manter Home atualizada.
- 2026-05-30: recibo de venda no WhatsApp (`receipt.ts` + botao no `SaleDetail`). Vai direto ao contato se o cliente tiver telefone, senao abre o seletor (`openWhatsAppShare`).
- 2026-05-30: `openWhatsApp`/`openWhatsAppShare` agora async e com verificacoes — valida o numero (`isValidBrazilPhone`) e avisa se o numero for invalido ou se o WhatsApp nao abrir. Recibo/fiado caem no seletor de contato quando o telefone salvo nao e valido.
- 2026-05-30: controle de fiado (tela `/fiado`, acessada via "Mais"). Fiado = vendas com status `pending`; agrupadas por cliente (`groupFiados`), com total a receber, "marcar como recebido" (status->paid) e "cobrar no WhatsApp" (`buildChargeMessage`). Telefone do cliente vem de `useClients` (1a pagina); sem telefone, usa o seletor do WhatsApp.
- 2026-06-09: **venda offline** — se `createSale` falhar sem resposta HTTP (erro de rede,
  nao-`ApiError`), o wizard enfileira o POST em `useOfflineQueue` (AsyncStorage) e avisa
  "Venda salva no aparelho". `setupAutoSync` (no `_layout`) reenvia quando a conexao volta
  e invalida o cache do React Query; o `OfflineBanner` mostra quantas vendas aguardam.
  Limite freemium continua sendo aplicado pelo backend no momento do sync.
- 2026-05-30: **venda por peso (R$/kg)** — `CartItem` ganhou `saleUnit`. Produtos `saleUnit === "kg"` usam um modal de peso (kg, decimal-pad) ao inves de incrementar unidades; subtotal = preco/kg × peso. Review/badge formatam peso com virgula (ex.: "1,5 kg"). O payload `createSale` envia `quantity` decimal.
- 2026-06-10: **recibo em PDF (Premium)** — `receipt-pdf.ts` (`buildReceiptHtml`,
  `exportReceiptPdf` via expo-print/expo-sharing): recibo A5 com a paleta da marca,
  nº derivado do id, itens (peso em kg), selo pago/pendente, rodapé "sem valor fiscal".
  Botão "Recibo em PDF" no `SaleDetail`; free abre paywall ("export") — exportação é
  recurso Premium na tabela freemium.
- 2026-06-10: vislumbre pro free — "Recibo em PDF" abre `ReceiptPreviewModal`
  (miniatura do recibo real com cadeado + CTA Premium) em vez de paywall seco.
- 2026-06-10: lembrete de fiado antigo — useFiadoNotifier (use-fiado-notifier.ts, montado em app/\_layout) notifica localmente quando ha vendas pendentes ha mais de 7 dias, com cooldown de 3 dias (AsyncStorage fiadoNotifiedAt). Toque roteia para /fiado (PENDING_SALES). Regra pura em oldFiadoSummary (fiado.ts).
- 2026-06-16: **escanear código de barras na venda** — o ícone de scan da busca e o atalho "Usar código" (passo 1) abrem a câmera (`shared/components/barcode-scanner.tsx`, `expo-camera`); o código lido alimenta a busca de produtos (o back casa por nome OU código, via campo `products.code`). Fallback "Digitar à mão" mantém o modal de digitação. Requer build com o módulo nativo da câmera (ver feature products).
- 2026-06-15: menu de acoes por cliente no card de fiado — os 3 pontinhos (`ellipsis-vertical`) viraram botao que abre um action sheet (Modal bottom-sheet) com "Marcar tudo como recebido" (marca todas as vendas pendentes do cliente como pagas via `Promise.all` de `updateSaleStatus`; com 1 venda cai no fluxo unitario), "Cobrar no WhatsApp" e "Ligar para o cliente" (`tel:`, so quando ha telefone valido). Antes o icone era decorativo (sem `onPress`). O botao "Recebi" de cada venda ganhou estilo de pilula (borda/fundo verde) para ficar obviamente tocavel ao publico nao-tech.
