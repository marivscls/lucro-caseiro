# ADR-0006 — Tab bar: Agenda substitui Clientes

**Status:** aceito pela dona do produto (2026-07-11) · **Contexto:** PRD melhorias pré-lançamento, item 4.1

## Contexto

A tab bar tinha Início · Vendas · Nova venda · Clientes · Mais. Agenda, Financeiro e Fiado — funções de uso diário pra quem trabalha com encomendas — estavam enterrados na aba "Mais" junto com 14 itens. Pro público (incluindo idosas/leigas), atalho na home é remendo; a navegação primária deve refletir frequência de uso.

## Decisão

- **Agenda entra na tab bar no lugar de Clientes** (Início · Vendas · Nova venda · Agenda · Mais).
- Clientes permanece acessível pelo "Mais" e pelos atalhos da home.
- Financeiro e Fiado ganham destaque no topo do "Mais".

## Consequências

- Encomendas do dia ficam a 1 toque — alinha com o fluxo real de confeiteiras/marmiteiras.
- Quem usa muito Clientes perde 1 toque; mitigado pela home e pelo topo do "Mais".
- A rota `/agenda` vira tab (`tabs/agenda`); deep links/atalhos existentes para agenda e clientes devem ser atualizados.
