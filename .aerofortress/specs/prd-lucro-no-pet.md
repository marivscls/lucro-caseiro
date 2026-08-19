# PRD — Lucro no Pet

Status: pesquisa futura — fora da implementação de apps separados
Data: 2026-08-13
Produto: vertical da família Lucro para cuidados não hospitalares de pets

## Visão

O Lucro no Pet atende banho e tosa, pet shop, hotel, creche, passeadores e cuidadores. O fluxo
canônico é `conhecer o pet → agendar/reservar → receber → cuidar → registrar → entregar → retornar`.

## Módulos completos

1. **Tutores e pets**: espécie, raça, porte, nascimento, foto, identificação, contatos,
   preferências, comportamento e alertas informados pelo tutor.
2. **Consentimentos**: termos, autorizações de imagem, emergência e pessoas autorizadas.
3. **Serviços**: banho, tosa, hidratação, unhas, passeio, transporte, diária e adicionais.
4. **Agenda**: profissional, baia/recurso, duração, capacidade, recorrência e conflitos.
5. **Banho e tosa**: check-in, condição informada/observada, fotos, procedimentos, produtos,
   conclusão e orientação de saída.
6. **Pacotes**: sessões, validade, frequência e consumo idempotente.
7. **Hotel e creche**: reserva, acomodação, check-in/out, alimentação, pertences, rotina e diário.
8. **Cuidados**: alimentação e medicação somente conforme instrução registrada pelo tutor,
   com horário, responsável e confirmação.
9. **Vacinas e lembretes**: registro documental informado pelo tutor, validade e alerta; sem
   diagnóstico ou prescrição.
10. **Táxi pet**: origem/destino, janela, motorista, status e confirmação de entrega.
11. **Estoque e loja**: produtos de uso, consumo, venda, validade e reposição.
12. **Equipe e comissões**: agenda, serviços realizados, comissão e estorno.
13. **Financeiro e indicadores**: ocupação, recorrência, no-show, ticket, pacote, consumo,
    faturamento, lucro e desempenho por serviço.
14. **Portal do tutor**: solicitações, agenda, histórico liberado, fotos e comprovantes.

## Regras críticas

- Pet sempre pertence a um tutor do mesmo usuário.
- Alertas de comportamento/saúde são informativos e visíveis no atendimento.
- Medicação exige instrução explícita do tutor; o app não sugere dose.
- Vacina registrada não é validação clínica.
- Capacidade de hotel/creche e recursos da agenda impedem sobreposição.
- Sessão de pacote é consumida apenas ao concluir o serviço.
- Portal público expõe somente informações liberadas daquele tutor/pet.

## Experiência e identidade

- Home começa pelos pets esperados, hospedados e que precisam retornar.
- Assinatura visual: ficha viva do pet conectando agenda, cuidados e histórico.
- Paleta: `#176B87` oceano, `#68A357` parque, `#F28C72` coral, `#F4F8F6` névoa e
  `#24343A` grafite.
- Vocabulário: tutor, pet, cuidado, serviço, pacote, hospedagem e retorno.

## Critérios de aceite

1. Cadastro relaciona tutor, pet, contatos e consentimentos.
2. Agenda valida profissional, recurso e capacidade.
3. Check-in/out preserva fotos, pertences e registros de cuidado.
4. Pacote consome uma sessão uma única vez.
5. Hospedagem bloqueia acomodação/capacidade no período.
6. Alimentação/medicação registra instrução e execução sem recomendação clínica.
7. Vacinas geram lembrete sem alegar validação veterinária.
8. Estoque baixa consumo e venda em movimentos separados.
9. Portal do tutor respeita token, escopo e revogação.
10. Android/PWA têm paridade e build isolado.

## Dependências externas honestas

Mapas, pagamento, WhatsApp e prontuário veterinário regulamentado não são simulados. Clínicas
veterinárias exigem um produto clínico e requisitos profissionais próprios, fora desta vertical.
