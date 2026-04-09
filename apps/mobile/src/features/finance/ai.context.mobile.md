# ai.context.mobile.md — Finance (Mobile Feature)

---

## Purpose

Dashboard financeiro do usuario: visualizar resumo mensal (entradas, saidas, lucro), listar lancamentos financeiros com filtro por tipo, criar novos lancamentos e exportar relatorios em PDF ou Excel.

## Non-goals

- Nao registra vendas diretamente (feature `sales`).
- Nao calcula precificacao de produtos (feature `pricing`).
- Nao gerencia assinaturas (feature `subscription`).

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `FinanceEntry`, `FinanceSummary`, `CreateFinanceEntry`, `UpdateFinanceEntry`, `FinanceEntryType`, `ExpenseCategory`), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`.
- **Depende de (externo):** `expo-file-system` e `expo-sharing` para exportacao.
- **Dependentes:** `tabs/index` (Home usa `useFinanceSummary` para card mensal).

## Code pointers

| Arquivo                                                                | Descricao                                                                                      |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `apps/mobile/src/features/finance/api.ts`                              | Funcoes HTTP (fetchEntries, fetchSummary, createEntry, updateEntry, deleteEntry, getExportUrl) |
| `apps/mobile/src/features/finance/hooks.ts`                            | React Query hooks                                                                              |
| `apps/mobile/src/features/finance/components/finance-dashboard.tsx`    | Dashboard principal com resumo, seletor de mes e exportacao                                    |
| `apps/mobile/src/features/finance/components/finance-entry-list.tsx`   | Lista de lancamentos com filtro                                                                |
| `apps/mobile/src/features/finance/components/create-finance-entry.tsx` | Formulario de criacao de lancamento                                                            |
| `apps/mobile/src/app/finance.tsx`                                      | Screen (rota `/finance`)                                                                       |

## Components

### `FinanceDashboard`

- **Props:** `{ onEntryPress?: (id: string) => void; onAddPress?: () => void }`
- Exibe seletor de mes (navegacao < >), card hero de lucro, cards de entradas/saidas, botoes de exportacao (PDF/Excel), e lista de lancamentos.
- Usa `useFinanceSummary({ month, year })` e `useFinanceEntries`.

### `FinanceEntryList`

- **Props:** `{ entries?: FinanceEntry[]; onEntryPress?: (id: string) => void; onAddPress?: () => void; showFilter?: boolean }`
- FlatList de lancamentos com filtro por tipo (Tudo/Entradas/Saidas).
- Cada item mostra icone +/-, descricao, categoria (Badge), data e valor colorido.
- EmptyState quando vazio.

### `CreateFinanceEntry`

- **Props:** `{ onSuccess?: () => void }`
- Campos: tipo (income/expense via toggle), valor, descricao, categoria (chips: material, embalagem, transporte, taxa, utilidade, outro), data.

## Hooks

| Hook                       | Tipo          | Descricao                                                                             |
| -------------------------- | ------------- | ------------------------------------------------------------------------------------- |
| `useFinanceEntries(opts?)` | `useQuery`    | Lista paginada. Query key: `["finance", "entries", opts]`                             |
| `useFinanceSummary(opts?)` | `useQuery`    | Resumo mensal (totalIncome, totalExpenses). Query key: `["finance", "summary", opts]` |
| `useCreateFinanceEntry()`  | `useMutation` | Cria lancamento. Invalida `["finance"]`.                                              |
| `useUpdateFinanceEntry()`  | `useMutation` | Atualiza lancamento. Invalida `["finance"]`.                                          |
| `useDeleteFinanceEntry()`  | `useMutation` | Remove lancamento. Invalida `["finance"]`.                                            |

## API Integration

| Endpoint                         | Verbo  | Funcao         | Parametros                              |
| -------------------------------- | ------ | -------------- | --------------------------------------- |
| `/api/v1/finance`                | GET    | `fetchEntries` | `?page=N&type=income&category=material` |
| `/api/v1/finance/summary`        | GET    | `fetchSummary` | `?month=N&year=N`                       |
| `/api/v1/finance`                | POST   | `createEntry`  | body: `CreateFinanceEntry`              |
| `/api/v1/finance/:id`            | PATCH  | `updateEntry`  | body: `UpdateFinanceEntry`              |
| `/api/v1/finance/:id`            | DELETE | `deleteEntry`  | -                                       |
| `/api/v1/finance/export/:format` | GET    | `getExportUrl` | `?month=YYYY-MM` (download direto)      |

## Contracts

- `FinanceEntry` — lancamento financeiro (id, type, amount, description, category, date).
- `FinanceSummary` — resumo mensal (totalIncome, totalExpenses, profit).
- `CreateFinanceEntry` — payload de criacao (type, amount, description, category, date).
- `UpdateFinanceEntry` — payload de edicao.
- `FinanceEntryType` — `"income" | "expense"`.
- `ExpenseCategory` — `"material" | "packaging" | "transport" | "fee" | "utility" | "other"`.

## Error Handling

- **Erro de listagem:** EmptyState generico.
- **Erro de criacao:** `Alert.alert("Erro", "Nao foi possivel registrar o lancamento. Tente novamente.")`.
- **Erro de exportacao:** `Alert.alert("Erro", "Nao foi possivel exportar o relatorio. Tente novamente.")`.
- **Validacao local:** valor > 0, descricao obrigatoria, categoria obrigatoria.

## Performance

- Dashboard carrega summary e entries em paralelo.
- Seletor de mes altera query params e React Query faz refetch.
- Exportacao usa `FileSystem.downloadAsync` e `Sharing.shareAsync`.

## Test matrix

- [ ] `useFinanceSummary` retorna totais do mes
- [ ] `CreateFinanceEntry` valida valor > 0
- [ ] `CreateFinanceEntry` valida categoria obrigatoria
- [ ] `FinanceEntryList` filtra por tipo corretamente
- [ ] Exportacao gera URL correta com mes formatado
- [ ] Dashboard navega entre meses corretamente

## Examples

- Acessado via Home (quick access "Financeiro") ou tab "Mais" -> "Financeiro".
- Rota: `/finance`.

## Change log / Decisions

- Exportacao PDF/Excel depende do backend retornar arquivo via download (header Authorization).
- Dashboard mostra lucro = entradas - saidas (calculo feito no front a partir do summary).
