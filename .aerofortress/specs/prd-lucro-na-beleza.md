# PRD — Lucro na Beleza

Status: pesquisa futura — fora da implementação de apps separados
Data: 2026-08-13
Produto: evolução do Lucro na Manicure para beleza e bem-estar

## Visão

O Lucro na Beleza atende profissionais e equipes que vendem tempo, procedimento, recorrência e
relacionamento. O fluxo canônico é
`divulgar → solicitar → agendar → confirmar → atender → receber → retornar`.

O produto absorve o Lucro na Manicure como modalidade, preservando contas e dados. Não mantém
dois aplicativos concorrentes com a mesma operação.

## Público

Manicure, pedicure, cabeleireiro, barbeiro, lash designer, designer de sobrancelhas,
maquiador, depilação, massagem e estética não médica.

## Módulos completos

1. **Serviços**: duração, intervalo, preço, custo, variações, adicionais e instruções.
2. **Agenda**: dia/semana, profissional, sala/recurso, bloqueio, encaixe, recorrência e conflito.
3. **Equipe**: disponibilidade, função, acesso e comissão por serviço/produto.
4. **Clientes**: histórico, preferências, observações, fotos autorizadas, aniversários e retorno.
5. **Agendamento online**: página pública, disponibilidade, solicitação/confirmação, sinal e
   política de cancelamento.
6. **Atendimento**: check-in, em andamento, concluído, cancelado e não compareceu.
7. **Pacotes e assinaturas**: sessões, validade, consumo idempotente e saldo.
8. **Comandas**: serviços, adicionais, produtos, descontos, pagamento parcial e fiado.
9. **Materiais e estoque**: consumo padrão/real, descartáveis, produtos de uso interno e venda.
10. **Comissões**: base, percentual/fixo, estorno, fechamento e demonstrativo.
11. **Relacionamento**: lembretes, confirmação, retorno sugerido, reativação e WhatsApp.
12. **Indicadores**: ocupação, no-show, retorno, ticket, faturamento, comissão, lucro/hora e
    desempenho por profissional/serviço.

## Regras críticas

- Agenda bloqueia sobreposição considerando duração, intervalo, profissional e recurso.
- Solicitação pública não confirma horário sozinha.
- Sessão de pacote é consumida apenas na conclusão e uma única vez.
- Comissão deriva de atendimento concluído/recebido conforme a regra configurada.
- Estorno gera lançamento inverso; não apaga comissão histórica.
- Fotos e observações sensíveis exigem consentimento e controle de acesso.
- O app não se apresenta como prontuário médico nem recomenda procedimentos clínicos.

## Experiência e identidade

- Home começa pela agenda viva do dia e pelos retornos que precisam de atenção.
- Assinatura visual: linha contínua de horários que se transforma em histórico do cliente.
- Paleta: `#6F3D73` ameixa, `#2F8F83` mineral, `#E8B85B` dourado, `#FBF7FA` porcelana e
  `#302A31` grafite.
- Vocabulário: agenda, atendimento, procedimento, profissional, sessão e retorno.

## Critérios de aceite

1. Agendamento valida profissional, recurso, duração e intervalo.
2. Página pública mostra somente horários realmente disponíveis.
3. Conclusão cria venda/recebimento uma única vez.
4. Pacote consome exatamente uma sessão por atendimento concluído.
5. Comissão calcula e estorna sem reescrever histórico.
6. Materiais previstos podem ser ajustados pelo consumo real.
7. Retornos e confirmações têm histórico e opt-out.
8. Métricas distinguem agenda, atendimento, recebimento e comissão.
9. Migração de Lucro na Manicure preserva usuário e dados.
10. Android/PWA têm paridade e build isolado.

## Dependências externas honestas

WhatsApp automatizado, pagamento de sinal e calendário externo dependem de provedores e
consentimento. A operação interna funciona sem eles e expõe claramente o estado da integração.
