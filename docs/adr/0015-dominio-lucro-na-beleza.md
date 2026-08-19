# ADR-0015 — Domínio do Lucro na Beleza

**Status:** adiado (2026-08-13) — especificação preservada para possível extensão futura

## Decisão

- Serviços, variações, adicionais, pacotes, agenda, clientes, vendas e financeiro existentes
  permanecem canônicos.
- Lucro na Manicure torna-se alias de migração para `lucro-beleza`; não haverá dois domínios de
  agenda concorrentes.
- A vertical adiciona profissionais, recursos, disponibilidade, regras de comissão,
  consentimentos e histórico visual autorizado.
- Conflitos são validados por profissional e recurso, somando duração e intervalo.
- Comissão nasce de evento concluído/recebido configurado e estorno é movimento inverso.

## Razão

Agenda genérica não cobre equipe, recurso e comissão. Manter o serviço canônico preserva todo o
ciclo financeiro já implementado.
