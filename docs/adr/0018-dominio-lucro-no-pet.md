# ADR-0018 — Domínio do Lucro no Pet

**Status:** adiado (2026-08-13) — especificação preservada para possível extensão futura

## Decisão

- Cliente canônico representa o tutor; pet é entidade própria vinculada ao tutor.
- Serviços, pacotes, agenda, vendas, estoque e comissões reutilizam os núcleos compartilhados.
- Consentimentos, alertas, cuidados, hospedagem e registros de banho/tosa são documentos tipados.
- Medicação e vacina guardam somente informação/instrução fornecida, sem recomendação clínica.
- Hotel/creche valida capacidade e acomodação; agenda valida profissional e recurso.
- Portal do tutor usa token revogável e projeção explícita.

## Razão

O pet, e não apenas o tutor, concentra preferências, alertas e histórico. Uma entidade própria
evita notas soltas em clientes e cria isolamento adequado sem transformar o app em prontuário.
