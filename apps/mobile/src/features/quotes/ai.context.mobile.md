# ai.context.mobile.md — Quotes (Orçamentos)

---

## Purpose

Criar, enviar e acompanhar orçamentos: itens livres (descrição/qtd/preço), total em
tempo real, envio por WhatsApp (texto) ou PDF (Premium), e conversão de orçamento
aprovado em encomenda na agenda (com sinal opcional).

## Non-goals

- Não registra venda (a conversão gera encomenda; venda nasce na entrega).
- Não vincula itens a produtos cadastrados (itens são livres).
- Não conta no limite freemium de vendas.

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (Quote, CreateQuote, ConvertQuote,
  QuoteStatus), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`,
  `shared/utils/whatsapp`, `shared/components/toast`, `features/subscription/hooks`
  (plano p/ gate do PDF).
- **Counterpart de API:** feature `quotes` (`/api/v1/quotes`).
- **Dependentes:** tela `app/quotes.tsx`; item "Orçamentos" em `tabs/more.tsx`.

## Code pointers

| Arquivo                                     | Descricao                                                     |
| ------------------------------------------- | ------------------------------------------------------------- |
| `features/quotes/api.ts`                    | HTTP (CRUD, status, convert)                                  |
| `features/quotes/hooks.ts`                  | React Query (key `["quotes"]`; convert invalida `["orders"]`) |
| `features/quotes/message.ts`                | `buildQuoteMessage` — texto p/ WhatsApp                       |
| `features/quotes/quote-pdf.ts`              | `buildQuoteHtml`/`exportQuotePdf` (expo-print)                |
| `features/quotes/components/quote-form.tsx` | Form com itens dinâmicos + total ao vivo                      |
| `app/quotes.tsx`                            | Lista (filtros), detalhe, conversão, FAB                      |

## Components

- **QuoteForm** — título, cliente (texto livre), itens dinâmicos (adicionar/remover,
  mín. 1), total calculado ao vivo, validade (máscara DD/MM/AAAA) e observações.
- **QuoteDetail** (na tela) — itens + total, ações: WhatsApp, PDF (Premium → paywall
  "export"), "Aprovado! Criar encomenda" (modal data+sinal), ver encomenda, editar
  (só pending), recusar, excluir.
- **ConvertModal** — data de entrega obrigatória, sinal opcional; sucesso → toast e
  encomenda na agenda.

## Hooks

| Hook                            | Tipo     | Descricao                            |
| ------------------------------- | -------- | ------------------------------------ |
| `useQuotes(opts?)`              | query    | lista paginada, filtro por status    |
| `useQuote(id)`                  | query    | detalhe                              |
| `useCreateQuote/useUpdateQuote` | mutation | invalida `["quotes"]`                |
| `useUpdateQuoteStatus`          | mutation | recusar/reabrir                      |
| `useConvertQuote`               | mutation | invalida `["quotes"]` e `["orders"]` |
| `useDeleteQuote`                | mutation | exclusão                             |

## API Integration

`/api/v1/quotes` GET/POST, `/:id` GET/PUT/DELETE, `/:id/status` PATCH,
`/:id/convert` POST.

## Contracts

`Quote`, `QuoteItem`, `CreateQuote`, `UpdateQuote`, `UpdateQuoteStatus`,
`ConvertQuote`, `QuoteStatus` (pending/accepted/rejected).

## Error Handling

- Validações locais com Alert ("Opa!") antes do submit; erros da API mostram a
  mensagem do backend.
- Sucessos usam toast global.

## Performance

- Lista paginada (20/página, página 1 no MVP); filtros refazem a query por status.

## Test matrix

- [ ] Total ao vivo soma qtd × preço com vírgula decimal
- [ ] Item sem descrição é ignorado; nenhum item válido bloqueia submit
- [ ] Conversão exige data válida; sinal opcional
- [ ] PDF bloqueado no free (paywall "export")
- [ ] Aprovado esconde editar/recusar/converter

## Examples

- Acesso: aba "Mais" → "Orçamentos". Rota: `/quotes`.
- Fluxo papeleira: criar → WhatsApp → cliente aprova → "Criar encomenda" (data + sinal)
  → produção na agenda.

## Change log / Decisions

- 2026-06-10: criação. Cliente é texto livre (orçamento chega antes do cadastro);
  PDF é Premium (exportação); ilustração `clipboard` no estado vazio.
- 2026-07-11: `quote-pdf.ts` ganhou rodapé discreto "Feito com Lucro Caseiro" linkando
  pra ficha da Play Store (UTM `pdf`), mesmo padrão do catálogo público.
