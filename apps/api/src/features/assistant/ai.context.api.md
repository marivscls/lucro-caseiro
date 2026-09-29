# ai.context.api.md — Assistant (anotar falando)

## Purpose

Transformar uma fala (áudio) ou frase escrita em um rascunho de venda casado
com os produtos e clientes cadastrados.

## Non-goals

- Não grava a venda: o app mostra o rascunho e a pessoa confirma na Nova venda.
- Não guarda áudio (só passa pela IA).
- Não lê foto de caderno (removido em 2026-09-29).
- Não conversa nem responde dúvidas (isso é o `help-assistant` do mobile).

## Boundaries & Ownership

- **IA**: Gemini via `ai` SDK (`GOOGLE_GENERATIVE_AI_API_KEY`), injetada como `IAssistantAi`.
- **Composição**: produtos, clientes e plano via `IAssistantBusiness`.
- **Dependentes**: mobile `assistant`.

## Code pointers

- `assistant.routes.ts` (parser JSON de 9 MB só aqui), `assistant.usecases.ts`,
  `assistant.domain.ts`, `assistant.ai.ts`, `assistant.repo.pg.ts`, `assistant.types.ts`.

## Data Model

- `assistant_usage` (`user_id`, `month` AAAA-MM, `count`), PK composta.
- `sale_items_source_required` aceita item só com `item_name` (vem da importação do caderno, já removida; a regra ficou).
- Migration `20260928220300_assistant_usage.sql`.

## Invariants

- Limite por mês: Gratuito 15, Essencial 300, Profissional 600 (`ASSISTANT_MONTHLY_LIMITS`).
- O limite é conferido antes da IA; o uso só conta quando a IA responde.
- Casamento de nomes exige todas as palavras faladas no cadastro.
- Arquivo: áudio `audio/*` do app, até 6 MB.

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
db:
  tables: [assistant_usage]
```

## Authorization & RLS

- `authMiddleware`; tudo escopado por `userId`. `assistant_usage` com RLS e sem grants públicos.

## Contracts (Zod/DTO)

- `AssistantSaleRequestDto`, `AssistantSaleDraftDto`, `AssistantUsageDto`.

## Errors

- Limite do mês → 429/403 via `LimitExceededError` com texto em português.
- IA sem chave ou fora do ar → 503 (`ServiceUnavailableError`).
- Arquivo inválido → 400.

## Events / Side effects

- Só conta o uso do mês; não grava venda.

## Performance

- Timeout de 40 s por modelo, um modelo reserva. Rate limit `expensive` (30 em 10 min).

## Security

- Prompt proíbe inventar dados; saída validada por schema e limpa no domínio.
- Nada do áudio é persistido.

## Test matrix

- `assistant.domain.test.ts`: nomes, arquivos, limpeza, mês.
- `assistant.usecases.test.ts`: rascunho casado, item novo, limite, arquivo.

## Examples

- `POST /api/v1/assistant/sale-draft` `{ "text": "vendi 3 marmitas pra Célia fiado" }`

## Change log / Decisions

- 2026-09-28: criado (aposta 3). Gemini porque já é usado na central de marketing e entende áudio e imagem.
- 2026-09-29: removida a leitura da foto do caderno de fiado e a importação (`/notebook`, `/notebook/import`), a pedido de LUCAS: a leitura falhava demais. `SalesUseCases.createOpeningFiado` saiu junto.
