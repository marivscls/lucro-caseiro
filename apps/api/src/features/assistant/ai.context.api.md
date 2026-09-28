# ai.context.api.md — Assistant (anotar falando e foto do caderno)

## Purpose

Transformar uma fala (áudio) ou frase escrita em um rascunho de venda casado
com os produtos e clientes cadastrados, e ler a foto de uma página de caderno
de fiado para importar clientes e valores em aberto depois da revisão.

## Non-goals

- Não grava a venda: o app mostra o rascunho e a pessoa confirma na Nova venda.
- Não guarda áudio nem foto (só passam pela IA).
- Não conversa nem responde dúvidas (isso é o `help-assistant` do mobile).

## Boundaries & Ownership

- **IA**: Gemini via `ai` SDK (`GOOGLE_GENERATIVE_AI_API_KEY`), injetada como `IAssistantAi`.
- **Composição**: produtos, clientes, plano, limite de clientes, criação de
  cliente e `SalesUseCases.createOpeningFiado` via `IAssistantBusiness`.
- **Dependentes**: mobile `assistant`.

## Code pointers

- `assistant.routes.ts` (parser JSON de 9 MB só aqui), `assistant.usecases.ts`,
  `assistant.domain.ts`, `assistant.ai.ts`, `assistant.repo.pg.ts`, `assistant.types.ts`.

## Data Model

- `assistant_usage` (`user_id`, `month` AAAA-MM, `count`), PK composta.
- `sale_items_source_required` passa a aceitar item só com `item_name` (fiado do caderno).
- Migration `20260928220300_assistant_usage.sql`.

## Invariants

- Limite por mês: Gratuito 15, Essencial 300, Profissional 600 (`ASSISTANT_MONTHLY_LIMITS`).
- O limite é conferido antes da IA; o uso só conta quando a IA responde.
- Casamento de nomes exige todas as palavras faladas no cadastro.
- Importação respeita o limite de clientes do plano antes de criar qualquer cliente.
- Arquivo: áudio `audio/*` do app ou foto JPG/PNG/WEBP/HEIC, até 6 MB.

## Operations

```yaml
feature: assistant
app: api
mobile_counterpart: assistant
api:
  base: /api/v1/assistant
  endpoints:
    - method: GET
      path: /usage
      response: AssistantUsage
    - method: POST
      path: /sale-draft
      body: AssistantSaleRequest
      response: AssistantSaleDraft
    - method: POST
      path: /notebook
      body: AssistantNotebookRequest
      response: AssistantNotebookResult
    - method: POST
      path: /notebook/import
      body: ImportNotebook
      response: ImportNotebookResult
db:
  tables: [assistant_usage, clients, sales, sale_items]
```

## Authorization & RLS

- `authMiddleware`; tudo escopado por `userId`. `assistant_usage` com RLS e sem grants públicos.

## Contracts (Zod/DTO)

- `AssistantSaleRequestDto`, `AssistantSaleDraftDto`, `AssistantNotebookRequestDto`,
  `AssistantNotebookResultDto`, `ImportNotebookDto`, `ImportNotebookResultDto`, `AssistantUsageDto`.

## Errors

- Limite do mês → 429/403 via `LimitExceededError` com texto em português.
- IA sem chave ou fora do ar → 503 (`ServiceUnavailableError`).
- Arquivo inválido → 400.

## Events / Side effects

- Importação cria clientes e vendas pendentes (sem caixa, sem estoque).

## Performance

- Timeout de 40 s por modelo, um modelo reserva. Rate limit `expensive` (30 em 10 min).

## Security

- Prompt proíbe inventar dados; saída validada por schema e limpa no domínio.
- Nada do áudio/foto é persistido.

## Test matrix

- `assistant.domain.test.ts`: nomes, arquivos, limpeza, mês.
- `assistant.usecases.test.ts`: rascunho casado, item novo, limite, arquivo, caderno, importação, limite de clientes.

## Examples

- `POST /api/v1/assistant/sale-draft` `{ "text": "vendi 3 marmitas pra Célia fiado" }`

## Change log / Decisions

- 2026-09-28: criado (aposta 3). Gemini porque já é usado na central de marketing e entende áudio e imagem.
