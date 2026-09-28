# ai.context.api.md — Fiado (Pix na cobrança e extrato por link)

## Purpose

Guardar a chave Pix de quem vende e gerar o link público do extrato do fiado de
um cliente (`/f/:token`). A página mostra o que está em aberto, o Pix copia e
cola com o valor exato (BR Code estático) e um botão para avisar pelo WhatsApp
que pagou. O app usa a mesma chave para colocar o Pix na mensagem de cobrança,
no recibo e no orçamento.

## Non-goals

- Não confirma pagamento sozinho (isso exigiria um banco/PSP com taxa).
- Não guarda dados bancários além da chave Pix e da cidade.
- Não lista nem altera vendas (isso é da feature `sales`); só lê as pendentes do cliente.

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (`buildPixPayload`, `normalizePixKey`,
  `pixForCharge`, `UpdatePixSettingsDto`, `CreateFiadoLinkDto`), schema `users`
  (colunas `pix_*`), `fiado_links`, `clients`, `sales`, `sale_items`, `products`, `services`.
- **Rodapé**: `shared/helpers/made-with.ts` ("Feito com ..." + UTM `extrato_fiado`).
- **Dependentes**: mobile `sales` (tela Fiado, recibo), `quotes` e Ajustes.

## Code pointers

- `fiado.routes.ts` — `createFiadoRouter` (auth) e `createPublicFiadoRouter` (público)
- `fiado.usecases.ts` — Pix settings, link por cliente, extrato público
- `fiado.domain.ts` — token, validação da chave, totais
- `fiado-statement.renderer.ts` — HTML da página pública (marca Lucro Caseiro)
- `fiado.repo.pg.ts` — persistência
- `packages/contracts/src/pix.ts` — BR Code (EMV) e CRC16

## Data Model

- `users.pix_key_type` (`cpf_cnpj|phone|email|random`, CHECK), `users.pix_key`
  (normalizada), `users.pix_city`.
- `fiado_links`: `id`, `user_id` → users (cascade), `client_id` → clients (cascade),
  `token` UNIQUE (16 chars base64url), `brand_id`, `created_at`.
- Migration `20260928220000_pix_fiado_links.sql` (roda a cada boot).

## Invariants

- Um link por cliente; o mesmo token é reaproveitado.
- Token com 96 bits aleatórios; formato validado antes de ir ao banco.
- A chave é validada e normalizada no servidor (CPF/CNPJ com dígito verificador).
- O extrato só lista vendas `pending` do mesmo usuário e cliente do link.
- Nome e cidade do BR Code vão sem acento (25 e 15 caracteres).

## Operations

```yaml
feature: fiado
app: api
mobile_counterpart: sales
api:
  base: /api/v1/fiado
  endpoints:
    - method: GET
      path: /pix
      response: PixSettings
    - method: PUT
      path: /pix
      body: UpdatePixSettings
      response: PixSettings
    - method: POST
      path: /links
      body: CreateFiadoLink
      response: FiadoLink
public:
  - method: GET
    path: /f/:token
    response: text/html
db:
  tables: [users, fiado_links, sales, sale_items]
```

## Authorization & RLS

- Rotas `/api/v1/fiado` usam `authMiddleware`; tudo escopado por `userId`.
- `/f/:token` é público; quem tem o link vê o extrato daquele cliente (é o objetivo).
- `fiado_links` com RLS e sem grants para `anon`/`authenticated`.

## Contracts (Zod/DTO)

- `UpdatePixSettingsDto`, `CreateFiadoLinkDto`, `FiadoLinkDto`, `PixSettingsDto`.

## Errors

- Chave inválida → 400 com dica em português por tipo.
- Cliente de outra conta → 404. Token inexistente → página 404 em HTML.

## Events / Side effects

- Nenhum. A página não grava nada.

## Performance

- Extrato limitado a 200 vendas pendentes; itens buscados em uma consulta.

## Security

- CSP própria (`default-src 'none'`, script só com nonce), `noindex`, sem referrer.
- Os textos do cadastro passam por `escapeHtml`.

## Test matrix

- `fiado.domain.test.ts`: CRC do exemplo oficial, valor, acentos, chaves, totais, token.
- `fiado.usecases.test.ts`: Pix vazio, chave inválida, link reaproveitado, marca, página.

## Examples

- `PUT /api/v1/fiado/pix` `{ "pixKeyType": "phone", "pixKey": "(11) 98765-4321", "pixCity": "Recife" }`
- `POST /api/v1/fiado/links` `{ "clientId": "…" }` → `{ "token": "aB3…", "clientId": "…" }`

## Change log / Decisions

- 2026-09-28: criado (aposta 1). Pix estático para não depender de banco nem cobrar taxa.
