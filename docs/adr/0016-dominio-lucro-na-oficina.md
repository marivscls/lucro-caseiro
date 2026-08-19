# ADR-0016 — Domínio do Lucro na Oficina

**Status:** aceito (2026-08-13)

## Decisão

- Cliente, produto/peça, orçamento, venda, estoque e financeiro existentes são reutilizados.
- Ativos reparáveis ganham identidade própria e payload discriminado para veículo/equipamento.
- Check-in e inspeção são snapshots append-only após aceite.
- Ordem de serviço possui máquina de estados própria e eventos de aprovação, execução, teste,
  entrega e garantia.
- Peças são reservadas e consumidas por integração transacional com estoque.
- Página pública usa token revogável e projeção sanitizada, nunca o documento interno completo.

## Razão

A unidade central é o ativo e seu histórico, não apenas o serviço vendido. Snapshot e evento
protegem a oficina e o cliente contra alteração silenciosa da inspeção/orçamento.
