# Lucro Caseiro — primeira sessão de estratégia

Data: 10/09/2026. Método: product-strategy-session, com módulos de posicionamento, proto-persona e jobs-to-be-done; avaliação de UI/UX pela Impeccable.

## Estado e alcance

Diagnóstico inicial baseado no repositório e na captura da tela Início enviada pela dona do produto. Não é pesquisa com clientes nem comprovação de conversão, retenção ou adequação ao mercado. Nenhuma alteração de interface foi realizada nesta sessão.

A prioridade empresarial foi perguntada à dona do produto: primeiro resultado útil, retorno ao app ou conversão paga. Enquanto não houver resposta, a sequência abaixo é provisória e usa primeiro valor como hipótese de trabalho, alinhada aos documentos existentes.

## Fontes e precedência

- `apps/web/PRODUCT.md`: público amplo de autônomas, MEIs e pequenos negócios; operação pelo celular; proposta de reaproveitar dados entre preço, produto, catálogo e venda. Documento da web usado como contexto compartilhado, não como especificação integral do app.
- `docs/orientacao-contextual-primeiro-valor.md`: decisão mais recente de respeitar objetivo e segmento; primeiro resultado e retorno útil distintos para preço, vendas, agenda, dinheiro e divulgação.
- `docs/marketing/experimentos-e-metricas.md`: funil sequencial de preço → produto → catálogo/venda; registra validação de produção pendente. Não foram consultados dados reais nesta sessão.
- `docs/typography-validation/README.md`: registra solicitação da dona do produto em 08/09 para corpo de 14 px e legendas de 13 px. Essa decisão móvel é posterior à referência de 16 px no PRODUCT da web; não recomendar aumento global por divergência documental.
- `apps/mobile/src/app/tabs/index.tsx`, `features/onboarding/business-profile.tsx` e `profile-data.ts`: comportamento atual da home e recomendação pelo perfil.

## Posicionamento de trabalho

Para pessoas que produzem, revendem ou prestam serviços por conta própria e precisam saber quanto cobrar e acompanhar o que combinaram com clientes, o Lucro Caseiro reúne precificação e organização do negócio pelo celular, com linguagem simples e reaproveitamento de informações.

A proposta de diferenciação documentada é a continuidade entre tarefas. Sua força comercial frente a concorrentes ainda requer pesquisa; não foram feitas comparações atuais de mercado nesta sessão. Caderno, planilha e conversas dispersas são alternativas citadas pelo próprio projeto.

## Hipóteses de público e necessidades

Perfis de trabalho derivados da documentação, sem inventar idade, renda ou depoimentos:

| Situação                          | Trabalho que a pessoa quer concluir           | Resultado observável                                                         |
| --------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------- |
| Precisa definir ou revisar preço  | Incluir custos e decidir quanto cobrar        | Resultado de preço válido consultado; salvar/aplicar é um marco separado     |
| Recebe pedidos pelo WhatsApp      | Registrar o combinado e acompanhar a operação | Venda real persistida ou compromisso agendado, conforme intenção             |
| Presta serviços                   | Preparar atendimento e cumprir o horário      | Serviço preparado e compromisso real salvo                                   |
| Vende, mas não entende o dinheiro | Distinguir venda, recebimento e despesa       | Movimento registrado e resumo do período interpretado corretamente           |
| Quer divulgar a oferta            | Preparar uma vitrine compartilhável           | Publicação confirmada com conteúdo público; link sozinho não prova resultado |

Necessidades emocionais e sociais sugeridas pela documentação: segurança ao cobrar, sensação de controle e apresentação profissional. São hipóteses, não conclusões de entrevistas.

## Problema a investigar

A home precisa servir a duas situações: orientar quem ainda não chegou ao primeiro resultado e ajudar quem retorna para trabalhar. Hoje, a recomendação do perfil ocupa o topo mesmo depois da primeira venda. Ela usa objetivo, segmento e alguns sinais de atividade; não representa uma lista de urgências operacionais.

Hipótese: parte do espaço da home pode deixar de ser útil após a conclusão inicial, enquanto a pessoa ainda precisa interpretar vendas, entradas, despesas e meta. Não há evidência nesta sessão de que isso já tenha causado abandono.

## Oportunidades e critérios de decisão

1. **Clareza de ação e resultado:** alinhar rótulos que abrem a mesma rota e explicar o significado de vendas, entradas e meta. Benefício esperado: menos dúvida; medir compreensão e conclusão, não só cliques.
2. **Orientação que acompanha o progresso:** manter a prioridade escolhida, mas testar apresentação mais compacta após primeiro resultado. Não substituir automaticamente a preferência da pessoa por uma suposta urgência.
3. **Medição coerente com cada objetivo:** preservar o funil encadeado de precificação como indicador específico e analisar primeiro valor de serviços, agenda e financeiro separadamente. Uma prestadora que agenda corretamente não deve ser classificada como fracasso só por não criar produto a partir de cálculo.

## Sequência provisória

- Agora: verificar compreensão da home e consistência dos destinos; esclarecer a definição de sucesso de cada objetivo. O código e a captura sustentam a existência de ambiguidades, não o tamanho de seu impacto.
- Em seguida: prototipar uma home para primeira utilização e outra para retorno, preservando marca e escala tipográfica aprovadas. Validar antes de implementar mudanças amplas.
- Depois: ajustar apresentação de recursos pagos conforme necessidade demonstrada, após examinar primeiro valor e retorno. Não há dados suficientes para recomendar mudança de preço ou limites.

## Plano de validação

Proposta de teste moderado com cinco pessoas do público, incluindo produção/revenda e serviços. Ainda não executado nem agendado.

- Pedir que indiquem onde registrariam uma venda já feita e onde organizariam um compromisso futuro; observar hesitação e caminhos escolhidos.
- Mostrar dados ilustrativos distintos de vendas e recebimentos e pedir interpretação, sem ensinar antes.
- Pedir que expliquem o que representam o valor atingido e o alvo da meta.
- Após completar uma tarefa útil, pedir que voltem ao Início e escolham o próximo trabalho.
- Registrar conclusão sem ajuda, erros e interpretação. Cinco participantes ajudam a encontrar problemas; não estimam taxas de toda a base.

Dados de produto a verificar: tempo até primeiro resultado por objetivo; retorno com nova ação útil em outro dia, D1–D7 e D8–D30; exposição a limite/recurso pago e assinatura concluída. Usar contas elegíveis e conciliar telemetria com registros de negócio. Nenhuma taxa ou previsão de ganho foi calculada.

## Pontos ainda abertos

- Prioridade empresarial atual escolhida pela dona do produto.
- Evidência real de onde as pessoas travam ou pedem ajuda.
- Validação de produção dos eventos documentados e eventual evolução das definições de ativação.
- Comportamento com leitor de tela, fonte ampliada, rede lenta e uso em aparelho real.

Próxima decisão: selecionar uma oportunidade com base na prioridade empresarial e validar a hipótese antes de avançar para um plano de implementação.
