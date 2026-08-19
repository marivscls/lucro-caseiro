# ADR-0012 — Documentos verticais tipados, snapshots e eventos

**Status:** aceito (2026-08-13)

## Contexto

As seis verticais possuem dezenas de documentos com estrutura comum — status, parte, prazo,
valores, itens e histórico — mas payloads e regras diferentes. Criar CRUDs semânticos duplicados
gera inconsistência; usar JSON sem validação produz um ERP genérico e frágil.

## Decisão

1. `vertical_documents` guarda cabeçalho operacional: domínio, tipo, status, título, cliente,
   valores, datas, referências e payload JSONB.
2. `vertical_document_items` guarda itens com snapshots de nome, quantidade, unidade, custo,
   preço e metadados.
3. `vertical_events` é append-only e registra transição, ator, momento e payload sanitizado.
4. Cada par `domain + kind` possui schema Zod, estados, transições e invariantes próprios no
   pacote de contratos e na API.
5. A API nunca aceita um payload apenas porque é JSON válido; valida o schema do tipo escolhido.
6. Operações financeiras, estoque, pacote ou produção usam idempotency key e transação.
7. Documentos aprovados/concluídos preservam snapshots. Correções relevantes geram versão ou
   evento inverso, não edição destrutiva.
8. Índices sempre começam por `user_id`; leituras usam `user_id + domain + id`.

## Consequências

- Infraestrutura é compartilhada sem tornar o produto genérico.
- Novos tipos exigem contrato e regra explícitos, não apenas uma string.
- Relatórios históricos continuam reproduzíveis após alteração de cadastro/preço.
- Entidades de alta cardinalidade ou identidade própria podem ganhar tabelas dedicadas.
