# Orientação contextual e primeiro valor — decisão de implementação

Data: 2026-09-07. Estado: implementação integrada; validação local documentada em `guidance-validation/README.md`. Publicação não realizada.

## Decisões

Preservar perfil por negócio e objetivo. Usar orientação integrada à tela, dispensável e reabrível por Como usar; nenhum tour modal automático por navegação. Persistir apresentação, dispensa e conclusão separadamente por conta e aparelho, com fallback de memória. A persistência da ajuda não bloqueia operações. Conclusão deriva de sucesso real da tarefa, nunca de leitura. Dados existentes podem suprimir convite inicial sem emitir nova conclusão. Ajuda não muda limites ou permissões.

Cada área mantém ações próprias e conteúdo específico. O componente compartilhado cuida somente de apresentação, acessibilidade e estado; a tela fornece a ação real e seu estado de dados. Guias anteriores não devem concorrer com a nova orientação.

Categoria do produto permanece obrigatória por contrato; nome, categoria e preço ficam visíveis. Campos opcionais continuam recolhíveis. Campos inválidos recebem mensagem e foco/rolagem. Cadastros dependentes usam o formulário existente sem desmontar o rascunho de origem. Cancelar devolve à tarefa sem concluir ou inventar registros.

## Matriz de experiência

| Área            | Intenção / pré-requisito                            | Primeiro acesso e vazio / ação                            | Dúvida ou erro                                               | Conclusão / próximo passo                             | Variação                                                   |
| --------------- | --------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------- |
| Início          | Escolher o trabalho do dia; perfil opcional         | Prioridade do perfil ou escolhas claras antes dos números | Não saber por onde começar                                   | Ação concluída na área; acompanhar resultado          | Preço, venda, atendimento, financeiro ou divulgação        |
| Produtos        | Preparar item; nome, categoria, preço               | Cadastrar primeiro produto                                | Preço ausente; kit sem componentes                           | Produto persistido; calcular custo ou registrar venda | Exemplos do segmento, produto continua distinto de serviço |
| Serviços        | Definir atendimento; nome e duração                 | Cadastrar serviço                                         | Duração; preço ainda desconhecido                            | Serviço persistido; agendar                           | Atendimento no local, cliente ou online                    |
| Vendas          | Acompanhar transações                               | Registrar primeira venda                                  | Confundir pedido com venda                                   | Venda confirmada; consultar recebimento               | Unidade ou peso quando permitido                           |
| Nova venda      | Registrar cliente opcional e itens                  | Cadastrar item se não houver; continuar carrinho          | Produto ausente, quantidade e pagamento                      | Venda persistida; recibo/resumo                       | Sem forçar venda fictícia                                  |
| Agenda          | Organizar compromisso; descrição e data             | Agendar atendimento/pedido                                | Cliente opcional; atendimento exige serviço, horário e local | Compromisso persistido; acompanhar data               | Serviço ou encomenda conforme negócio                      |
| Clientes        | Guardar contato; nome                               | Cadastrar cliente                                         | Telefone opcional; fiado separado                            | Cliente persistido; vincular à próxima operação       | Pessoa ou empresa sem pressupor confeitaria                |
| Precificação    | Calcular preço; custo e ganho desejado              | Preencher valores manuais                                 | Taxas e custos omitidos                                      | Resultado válido exibido; salvar/aplicar separados    | Materiais de produto ou serviço                            |
| Financeiro      | Registrar movimento; valor, descrição e categoria   | Entrada ou despesa explícitas                             | Categoria incompatível, caixa não é custo completo           | Lançamento persistido; resumo do período              | Termos de custos adaptados                                 |
| Gastos fixos    | Programar custo mensal; descrição, valor, dia       | Adicionar gasto dentro das permissões                     | Vencimento 1–28                                              | Template salvo; consultar lançamentos                 | Exemplos aluguel, internet, espaço                         |
| Materiais       | Organizar consumo; nome e unidade                   | Cadastrar material                                        | Unidade e custo de compra                                    | Material persistido; montar ficha                     | Insumos de alimentação ou materiais gerais                 |
| Fichas de custo | Compor produção; materiais                          | Criar ficha; cadastrar material sem perder rascunho       | Rendimento e quantidade consumida                            | Ficha persistida; calcular preço                      | Receita em alimentação, ficha em outros                    |
| Embalagens      | Registrar acabamento; nome                          | Cadastrar embalagem/acabamento                            | Custo por unidade                                            | Cadastro persistido; usar no preço                    | Embalagem ou acabamento                                    |
| Fornecedores    | Guardar origem de compras; nome                     | Cadastrar fornecedor                                      | Contatos opcionais                                           | Fornecedor persistido; registrar compra               | Exemplos abrangentes                                       |
| Compras         | Acompanhar abastecimento; descrição e valor         | Registrar compra                                          | A pagar versus já pago                                       | Compra persistida; acompanhar vencimento/caixa        | Fornecedor opcional                                        |
| Fiado           | Acompanhar valores de vendas a prazo                | Explicar origem e abrir nova venda                        | Recebimento parcial e vencimento                             | Recebimento confirmado; saldo atualizado              | Não presumir crédito concedido                             |
| Orçamentos      | Preparar proposta; itens e preços                   | Criar orçamento com itens livres                          | Custo interno não aparece ao cliente                         | Proposta salva; revisar antes de compartilhar         | Produtos e serviços                                        |
| Catálogo        | Apresentar oferta; item e contato quando necessário | Preparar conteúdo antes de compartilhar                   | Link no ar versus pronto para pedidos                        | Conteúdo configurado; prévia/publicação distintas     | Produto ou serviço                                         |
| Etiquetas       | Identificar produto; produto cadastrado             | Criar produto e retomar etiqueta                          | Produto ausente, tamanho de impressão                        | Etiqueta salva; imprimir/compartilhar                 | Não presumir regras de alimentação                         |
| Resultados      | Entender operação; registros do período             | Explicar ausência e levar a registro                      | Ausência de dados versus zero real                           | Resumo consultado com dados; tarefa seguinte          | Sem reduzir serviços ao funil de produto                   |

## Medição

Allowlist de áreas, eventos e identificadores de validação. Nenhum valor digitado, nome, contato ou dado financeiro é enviado. Eventos: apresentação, dispensa, ajuda voluntária, início, erro, sucesso e retomada de pré-requisito. Best effort, sem bloquear tarefa, sem duplicação por rerender. Identificar preparação (produto/serviço), resultado local (preço), persistência (venda/agenda/financeiro) e consulta informada como marcos diferentes. Documentar que não há validação causal da retenção.

## Aceite

Verificar conta nova e recorrente, dispensa/reabertura, isolamento de conta, falha de persistência, sucesso versus erro de operação, retomada de formulário e regras de plano. Revisão visual móvel 390×844, largura menor e desktop, temas claro/escuro. Testes de navegador não equivalem à homologação física Android/iOS.

## Métricas para acompanhamento

- Preparação: produto/serviço/material/cliente cadastrado. Não equivale a uso recorrente.
- Primeiro valor por objetivo: preço válido consultado (price), venda persistida (sales), compromisso persistido (orders), movimento persistido (money), publicação confirmada no editor com pelo menos um item público (catalog). A publicação do link isolada não é primeiro valor de divulgação. `catalog_content_published` só ocorre após resposta confirmada do salvamento de publicação no editor, com link habilitado e conteúdo público. Não comprova recebimento de pedidos nem leitura pelos clientes.
- No cálculo completo, resultado válido exibido emite `pricing_result_viewed`; no simples a confirmação voluntária “Conferi meu resultado” registra reconhecimento sem exigir salvar. Comparar os dois modos separadamente.
- Retorno útil: nova ação correspondente ao objetivo em outro dia, D1–D7 e D8–D30, com denominador de contas elegíveis ao período. Visita ou help_opened não é retorno útil.
- Eventos `guidance_<area>_<event>`: presented/dismissed/help_opened/task_started/task_completed/prerequisite_resumed. Os quatro primeiros identificam contato/intenção; conclusão vem do sucesso de operação. Apenas a primeira conclusão por área/conta/aparelho é marcada localmente. Cadastros seguintes continuam com suas ações canônicas. A coleta é best effort, portanto não substitui registros de negócio no cálculo de conversão.
- Erros de validação instrumentados nos obrigatórios de produto e financeiro por nomes fixos. Sem valores, nomes ou textos livres. Ampliar cobertura de outros formulários conforme os atritos efetivamente observados.
- Persistência da ajuda: AsyncStorage, chave versionada por conta/aparelho. Leitura limitada a 1,5 s; falha permite uso em memória. Não há sincronização de dispensas entre dispositivos. Se o armazenamento do aparelho permanecer indisponível, uma sessão futura pode reapresentar orientação.

## Correspondência com a auditoria

Preço escondido → obrigatórios abertos e primeiros no formulário. Erro genérico → mensagens locais e foco nos campos principais. Zero antes da ação → cartão inicial e remoção de resumos vazios em produtos/serviços. Dependências → produto para etiqueta e material para ficha preservam rascunho; venda e agenda reutilizam sua continuidade já existente. Categorias → opções por entrada/saída com aviso de incompatibilidade. Etapas de preço → rolagem reiniciada, campos preservados e taxa desconhecida explícita. Catálogo → conteúdo antes de compartilhar, estado público honesto e prévia sob demanda. Suporte → básico gratuito e prioridade conforme plano. Vocabulário → Materiais na navegação e fórmulas/agenda por segmento.

## Ajustes confirmados na revisão visual

A retomada da etiqueta apresenta a confirmação do produto dentro do formulário de origem, evitando diálogo de sucesso atrás de outro modal. A semântica dos diálogos web inclui nome e papel acessíveis. O financeiro distingue ausência de movimentações do resultado calculado. O cabeçalho de Clientes precede sua orientação; Vendas não exibe o resumo zerado antes da primeira ação. Materiais usa o mesmo vocabulário em busca, filtros, ações e lista; formulários e fichas mantêm termos de alimentação quando o perfil os justifica.

No navegador, rolagem de formulário não pode dispensar foco como se fosse arraste para fechar teclado. Android mantém `on-drag` e iOS mantém `interactive`. A validação física com teclado nativo continua necessária.

## Publicação e acompanhamento

Publicar a API com a allowlist de analytics antes ou junto do app; uma API antiga pode rejeitar novos eventos, sem impedir as operações principais. Não há migração de dados de orientação: progresso local versionado por conta. A disponibilidade do suporte é o e-mail já usado pelo produto; o texto não promete horário ou prazo.

Após o lançamento, comparar contas novas por objetivo e período elegível: tempo até o primeiro resultado, erro por campo, retomada após pré-requisito, conclusão após ajuda e repetição de uma tarefa útil. Guardar versão do app e data de exposição. Usar registros de negócio para conferir eventos perdidos; não interpretar ausência de telemetria como ausência de uso nem atribuir a mudança de retenção à personalização recente.
