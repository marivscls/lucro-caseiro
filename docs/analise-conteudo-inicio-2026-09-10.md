# Tela Início — cobertura das necessidades do usuário

Data: 10/09/2026. Pedido: analisar a sensação de que o início não contém tudo de que a pessoa precisa. Método: estratégia de produto e jobs-to-be-done, com leitura da home e dos recursos relacionados; aproveita a avaliação visual anterior. Análise de conteúdo e arquitetura de informação, sem nova pontuação heurística ou alteração de interface.

## Diagnóstico

A home oferece orientação pelo perfil, totais financeiros, meta e atalhos de cadastro. Falta trazer a situação operacional do negócio: o que vence, o que está próximo, o que falta receber e o que exige atenção. Para quem retorna ao app, os dados mais úteis permanecem separados em Agenda, Fiado, Produtos e Resultados.

Essa lacuna é observável na composição atual. O impacto sobre retenção ou conversão é hipótese, pois não foram consultados analytics, entrevistas ou sessões de uso reais.

## Cobertura de necessidades

| Pergunta da pessoa                         | Cobertura atual no início                                         | Recomendação                                                                                      |
| ------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| O que preciso fazer hoje?                  | Recomendação baseada no objetivo salvo; sem lista de compromissos | Mostrar próximos compromissos e pendências reais, com data/horário e ação                         |
| Quem ainda precisa me pagar?               | Mostra entradas, mas não valores pendentes                        | Resumo de recebimentos pendentes e acesso à lista correspondente                                  |
| O que pode atrapalhar minha próxima venda? | Não mostra alertas de estoque/custo                               | Até dois ou três avisos relevantes, condicionados aos dados e à modalidade de negócio             |
| Como está o dinheiro?                      | Vendas, entradas e despesas; sem síntese interpretativa           | Distinguir vendas de recebimentos e mostrar resultado dos lançamentos do período com rótulo claro |
| O que falta para minha meta?               | Percentual e dois valores                                         | Explicar meta mensal de vendas e quanto falta; contextualizar estimativas                         |
| Como faço minha tarefa mais frequente?     | Quatro atalhos fixos                                              | Ações adequadas ao perfil e com destino correspondente ao verbo                                   |
| Por onde começo?                           | Perfil, orientação contextual e próximos passos                   | Preservar orientação inicial por objetivo; reduzir destaque após primeiro resultado útil          |

## Composição proposta

Ordem proposta para uma conta com uso recorrente, sujeita a validação:

1. Saudação compacta e estado de atualização, quando necessário.
2. **Seu dia:** próximo compromisso e uma pendência prioritária; acesso a todos os compromissos. Priorizar pelo prazo real, sem afirmar urgência sem evidência.
3. **Ações rápidas:** no máximo quatro, adequadas à modalidade de trabalho. Manter a navegação estável; evitar ordenar botões automaticamente a cada acesso.
4. **Dinheiro:** vendas, recebido e despesas do período, com acesso separado aos valores a receber. Se houver saldo calculado, informar que se refere aos lançamentos, não ao saldo bancário nem ao lucro líquido.
5. **Precisa de atenção:** até três avisos acionáveis, somente quando relevantes; itens já mostrados em Seu dia não se repetem aqui.
6. **Meta do mês:** progresso, valor restante e explicação do alvo. Menor prioridade quando houver trabalho com prazo ou recebimento pendente.

Esses são blocos conceituais, não uma obrigação de renderizar seis cartões. Sem dados ou necessidade, omitir o bloco ou usar um estado vazio compacto; evitar aumentar a rolagem com recomendações genéricas.

## Adaptação por situação

- Conta nova: orientar uma primeira tarefa útil escolhida pela pessoa. Sem painel dominado por zeros, sem exigir venda fictícia e sem cadastro amplo obrigatório.
- Produção/encomendas: próximos prazos, encomendas prontas e recebimentos; alertas de produto não equivalem a disponibilidade dos materiais da receita.
- Comércio/revenda: recebimentos, reposição de itens com controle de estoque e ações de venda.
- Serviços: próximo atendimento, agendamento, conclusão e recebimentos; não manter Produto como atalho central obrigatório.
- Conta recorrente sem pendências: resumo curto e atalhos estáveis; manter o próximo compromisso futuro se houver, sem inventar tarefas.

## O que reduzir ou deslocar

- Editar perfil do negócio: acesso pela conta/configurações; pode permanecer como ação secundária no contexto da orientação inicial.
- Ideias para divulgar: destaque quando divulgação for o objetivo, sem competir permanentemente com a agenda do dia.
- Criação de venda: padronizar os rótulos e reduzir as quatro chamadas atuais para a mesma rota.
- Meta: manter disponível, mas atrás de compromissos e recebimentos que exigem ação.

## Evidência técnica e limites de reaproveitamento

- Home: `apps/mobile/src/app/tabs/index.tsx` renderiza perfil, resumo, meta e QUICK_ACTIONS fixas. “Despesa” abre `/finance`, não diretamente o formulário de despesa. Adequar verbo ao destino ou criar entrada direta no fluxo existente.
- Agenda: `features/orders/hooks.ts` oferece consultas filtráveis e resumo; `app/tabs/agenda.tsx` já agrupa vencidos, hoje, amanhã e próximos períodos. Datas e status podem orientar a home respeitando funcionalidades disponíveis no plano.
- Recebimentos: `features/sales/fiado.ts` calcula saldo restante por venda e agrupa por cliente. Atenção: o rótulo de atraso atual deriva de sete dias após a venda; não confundir essa convenção com prazo combinado com o cliente.
- Encomendas: `OrdersSummaryDto` contém sinal recebido e valor a receber. Não somar indiscriminadamente com vendas pendentes: uma encomenda pode estar vinculada a uma venda. Definir fonte canônica e evitar duplicidade.
- Estoque e preço: `features/insights/domain.ts` já contém regras de reposição e margem. Estoque cobre condições específicas (unidade, controle configurado, não composto). O limiar fixo de margem de 20% é uma regra existente, não recomendação universal para todo negócio.
- Meta: `features/goals/domain.ts` já produz valor restante e estimativa de vendas. Estimativas devem depender de base válida e nunca prometer resultado.
- Sincronização: há componentes compartilhados de rede/offline. Verificar integração existente antes de criar outro indicador na home.
- Totais precisam cobrir o conjunto completo e o período correto; não calcular “total a receber” com apenas a primeira página de vendas ou misturando consultas parciais.
- Permissões e limites de plano continuam valendo. Não consultar dados sem permissão nem usar avisos bloqueados como falsa pendência.

## Prioridade recomendada

Primeira rodada: Seu dia, valores a receber e ações adequadas ao perfil; corrigir apresentação de dados desconhecidos como zero na mesma preparação. Esses elementos respondem a tarefas recorrentes concretas.

Segunda rodada: alertas de estoque/preço com regras transparentes e meta mais explicativa. Validar frequência e utilidade dos alertas antes de expandir a quantidade.

Não se recomenda acrescentar gráficos, rankings, feed de dicas, atalhos para todas as áreas ou novos recursos só para preencher espaço.

## Validação proposta

Com pessoas de produção, revenda e serviços, pedir que encontrem o próximo trabalho, identifiquem o que falta receber e iniciem sua tarefa mais comum. Observar acerto, hesitação, tempo e necessidade de ajuda. Repetir com conta nova, conta sem pendências, fonte ampliada e falha de atualização. Não foram executados testes de interface nesta análise.

Critério de utilidade: a pessoa consegue dizer o que precisa fazer e chegar à ação correta a partir do início, com menos busca entre áreas. A melhoria de retorno ao app deve ser medida depois, sem presumir causalidade.

## Implementação posterior à análise

As prioridades das duas rodadas foram autorizadas e implementadas em 10/09/2026. O comportamento final, as verificações técnicas e as capturas estão em [home-ui-validation/README.md](home-ui-validation/README.md). A inspeção do servidor esclareceu que o progresso da meta usa entradas financeiras, e a interface foi alinhada a esse cálculo. Os testes de navegador posteriores não substituem pesquisa de usabilidade com clientes.
