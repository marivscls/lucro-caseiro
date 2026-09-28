# ai.context.mobile.md — Pix (Receber no Pix + extrato do fiado)

---

## Purpose

Cadastrar a chave Pix de quem vende e colocar o Pix copia e cola, com o valor exato, na
cobrança do fiado, no recibo de venda em aberto e no orçamento. A cobrança do fiado também
leva o link público do extrato do cliente (`/f/:token`, página da API).

## Non-goals

- Não confirma pagamento: o Pix é estático (BR Code), sem banco no meio. A pessoa continua
  marcando a venda como paga.
- Não gera Pix dinâmico nem cobra taxa.
- Não renderiza o extrato: a página pública é da API (`features/fiado` na API).

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (`pixForCharge`, `normalizePixKey`, `PixSettings`,
  `UpdatePixSettings`, `FiadoLink`), `@lucro-caseiro/ui`, `shared/utils/api-client`.
- **Dependentes:** `app/pix.tsx`, `app/fiado.tsx` (cobrança + aviso), `features/sales/components/sale-detail.tsx`
  (recibo), `app/quotes.tsx` (orçamento).

## Code pointers

| Arquivo                            | Descricao                                                      |
| ---------------------------------- | -------------------------------------------------------------- |
| `api.ts`                           | GET/PUT da chave, POST do link do extrato, `fiadoStatementUrl` |
| `hooks.ts`                         | `usePixSettings`, `useUpdatePixSettings`, `useCreateFiadoLink` |
| `domain.ts`                        | `chargePix`, `pixReceiverName`, `pixKeyError`, `maskedPixKey`  |
| `components/pix-settings-form.tsx` | Formulário da chave (tipo, chave, cidade)                      |
| `components/pix-nudge.tsx`         | Aviso "Cadastrar chave Pix" onde a pessoa cobra                |
| `app/pix.tsx`                      | Tela Receber no Pix                                            |

## Components

- `PixSettingsForm({ settings, onSaved? })`: `ChoiceField` do tipo, `TextField` da chave com
  validação local (`pixKeyError`), cidade opcional; salvar e remover (com confirmação).
- `PixNudge({ text })`: some quando a chave existe ou enquanto carrega.

## Hooks

| Hook                     | Tipo          | Descricao                                               |
| ------------------------ | ------------- | ------------------------------------------------------- |
| `usePixSettings()`       | `useQuery`    | Chave atual. Key `["pix", "settings"]`, stale 5 min.    |
| `useUpdatePixSettings()` | `useMutation` | Salva/remove e grava o retorno no cache.                |
| `useCreateFiadoLink()`   | `useMutation` | Link do extrato de um cliente (reaproveitado pela API). |

## API Integration

| Endpoint              | Verbo | Funcao              | Parametros               |
| --------------------- | ----- | ------------------- | ------------------------ |
| `/api/v1/fiado/pix`   | GET   | `fetchPixSettings`  | -                        |
| `/api/v1/fiado/pix`   | PUT   | `updatePixSettings` | body `UpdatePixSettings` |
| `/api/v1/fiado/links` | POST  | `createFiadoLink`   | body `{ clientId }`      |

URL pública do extrato: `EXPO_PUBLIC_CATALOG_URL ?? EXPO_PUBLIC_API_URL` + `/f/:token`.

## Contracts

- `PixSettings { pixKeyType, pixKey, pixCity }` (chave já normalizada pela API).
- `FiadoLink { token, clientId }`.

## Error Handling

- Chave inválida: erro no campo (`useFormValidation`); a API valida de novo e responde 400.
- Falha ao criar o link do extrato (ou mais de 2,5 s): a cobrança sai sem o link.
- Sem chave: mensagens saem como antes, sem Pix.

## Performance

- Uma query da chave (stale 5 min) serve fiado, recibo e orçamento.
- O código Pix é montado no aparelho (`pixForCharge`), sem ida à API.

## Test matrix

- [x] `domain.test.ts`: nome do recebedor, Pix com valor e CRC, sem chave/sem valor, erros da chave, máscara.
- [x] `features/sales/fiado.test.ts`: cobrança com link e Pix.
- [x] `features/sales/receipt.test.ts`: Pix só em venda pendente.
- [x] `features/quotes/message.test.ts`: orçamento com Pix do total.
- [x] `shared/mock/growth-routes.test.ts`: chave salva e recusada na demonstração.

## Examples

- Mais > Receber no Pix > escolher "Celular", digitar a chave > Salvar.
- Fiado > Cobrar > WhatsApp abre com total, link do extrato e o código Pix na última linha.

## Change log / Decisions

- 2026-09-28: criação. Pix estático (sem PSP, sem taxa) para não depender de banco parceiro.
  Nome do recebedor = nome do negócio (até 25 letras no código). O código vai sozinho numa
  linha da mensagem para facilitar copiar no WhatsApp.
