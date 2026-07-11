# ADR-0004 — Notificações são locais; código de push remoto morto é removido

**Status:** aceito (2026-07-11) · **Contexto:** PRD melhorias pré-lançamento, item 1.2

## Contexto

O mobile registra o token de push e faz `POST /users/push-token`, mas esse endpoint nunca existiu na API — o request falha com 404 silencioso desde sempre. Todas as notificações que funcionam hoje (entrega, estoque baixo, aniversário, fiado, resumo semanal, lembrete diário) são **locais**, agendadas no aparelho via `expo-notifications`.

## Decisão

Remover o código de registro/envio de token remoto. O produto lança com notificações exclusivamente locais.

## Consequências

- Menos código morto e nenhum request falhando em produção.
- Limitação aceita: notificações se perdem ao reinstalar/trocar de aparelho e não existem campanhas server-side (winback, resumo do servidor).
- **Caminho de upgrade** (quando houver base instalada que justifique): criar `POST /users/push-token` na API (tabela `push_tokens` user-scoped), reintroduzir o registro no mobile e um worker de envio (Expo Push API). Os casos de uso candidatos estão no PRD, seção "Futuro".
