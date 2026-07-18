# Experimentos, funil e métricas

**Status:** Instrumentação implementada; validação de produção pendente
**Versão:** 1.1
**Data:** 18 de julho de 2026

## Unidade principal

O crescimento deve ser otimizado por **negócios ativados**, não apenas por downloads.

Um negócio ativado conclui esta sequência:

1. precificação concluída;
2. produto criado a partir do cálculo;
3. produto publicado no catálogo ou utilizado em uma venda.

Até que a instrumentação esteja validada, a IA deve tratar taxas, custos e volumes do funil como desconhecidos.

## Eventos necessários

- instalação atribuída;
- cadastro concluído;
- precificação iniciada;
- precificação concluída;
- produto criado a partir da precificação;
- catálogo publicado;
- primeira venda registrada;
- limite de plano atingido;
- recurso pago solicitado;
- assinatura iniciada;
- assinatura concluída;
- cancelamento.

O nome técnico final de cada evento deve seguir a implementação de analytics. Este documento define o significado de negócio, não inventa nomes de código.

## Mapeamento implementado

| Marco de negócio                        | Fonte canônica                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| instalação atribuída                    | referrer UTM da Google Play nos links do site e do catálogo + relatórios da Play Console/GA |
| cadastro concluído                      | `signup_completed`                                                                          |
| precificação iniciada                   | `pricing_started`                                                                           |
| precificação concluída                  | `pricing_completed`                                                                         |
| produto criado a partir da precificação | `product_created_from_pricing`                                                              |
| catálogo publicado                      | `catalog_published`                                                                         |
| primeira venda registrada               | primeira ocorrência de `sale_completed`                                                     |
| limite de plano atingido                | `plan_limit_reached`                                                                        |
| recurso pago solicitado                 | `paid_feature_requested`                                                                    |
| assinatura iniciada                     | `subscription_started`                                                                      |
| assinatura concluída                    | `subscription_completed`, gravado na transição real de plano                                |
| cancelamento                            | `subscription_cancelled`, gravado na transição real para Gratuito                           |

O painel considera **negócio ativado** somente quando observa, nesta ordem, `pricing_completed` → `product_created_from_pricing` → (`catalog_published` ou `sale_completed`). Uma precificação isolada não conta mais como ativação.

Antes de investir em mídia, validar em produção um caso controlado de cada evento, conferir a migração `037_activation_funnel_events.sql` aplicada e reconciliar os cliques/instalações atribuídos com Play Console e GA.

## Métricas por etapa

- **Aquisição:** retenção inicial do criativo, clique, conversão da loja, custo por cadastro.
- **Ativação:** tempo até o primeiro cálculo, início para conclusão, cálculo para produto, produto para catálogo ou venda.
- **Receita:** conversão por plano, receita média, CAC, retorno do CAC e cancelamento.
- **Retenção:** D1, D7, D30, frequência de precificações, vendas e catálogos ativos.
- **Conteúdo:** retenção, salvamentos, compartilhamentos, comentários com intenção, cliques e negócios ativados atribuídos.

## Cartão de experimento

```markdown
### Nome

- Público:
- Etapa do funil:
- Problema observado:
- Hipótese:
- Variável alterada:
- Controle:
- Variante:
- Métrica principal:
- Métricas de proteção:
- Janela e amostra mínima:
- Critério de decisão:
- Resultado:
- Decisão:
- Aprendizado:
- Evidência:
```

## Primeira matriz de testes

Testar uma variável estratégica por comparação sempre que possível:

- dor de preço errado versus medo de não sobrar dinheiro;
- gancho de pergunta versus afirmação;
- demonstração falada versus texto na tela;
- CTA “calcule seu primeiro produto” versus “pare de chutar o preço”;
- nichos diferentes com o mesmo conceito;
- fluxo completo versus uma funcionalidade isolada.

## Critério de decisão

Não declarar vencedor com base apenas em alcance, curtidas ou poucos casos. Definir antes a métrica principal, a janela, a amostra mínima e as métricas de proteção. Registrar resultados negativos e inconclusivos; eles também evitam repetição de testes.

## Retargeting por estado

- assistiu e não visitou a loja;
- visitou e não instalou;
- instalou e não concluiu o cálculo;
- calculou e não criou o produto;
- criou e não publicou catálogo nem venda;
- atingiu limite ou tentou recurso pago.

Cada estado recebe a mensagem do próximo passo, não uma campanha genérica de funcionalidades.

## Regras para a IA

- nunca preencher métricas ausentes com estimativas apresentadas como fatos;
- separar dado observado, hipótese e meta;
- calcular taxas apenas quando numerador, denominador, período e fonte forem conhecidos;
- apontar viés de atribuição ou amostra quando relevante;
- recomendar o menor teste que realmente reduza a incerteza.
