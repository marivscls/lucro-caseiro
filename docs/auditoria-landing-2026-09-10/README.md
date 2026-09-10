# Análise de conteúdo, conversão e SEO do Lucro Caseiro

A landing tem uma proposta relevante e uma demonstração concreta do produto. O maior ganho imediato está em corrigir o acesso dos buscadores, esclarecer a oferta e manter um caminho consistente entre conhecer, calcular e começar a usar. A identidade visual e a mensagem sobre valorizar o próprio trabalho já oferecem uma boa base.

O diferencial mais convincente é o reaproveitamento da informação: calcular o preço, cadastrar o produto e usá-lo no catálogo ou na venda. Esse encadeamento merece mais destaque do que uma enumeração extensa de ferramentas. A análise recomenda preservar a abrangência do público — produção, comércio e serviços — e melhorar as provas e os exemplos para cada contexto.

## Escopo e limites da avaliação

Foram examinados o endereço público [lucrocaseiro.com.br](https://lucrocaseiro.com.br/), as nove páginas do sitemap, os metadados renderizados, os links principais, a calculadora, as regras de rastreamento e as respostas HTTP. As observações foram coletadas em 10 de setembro de 2026 e comparadas com o código disponível no projeto. A tabela comercial foi confrontada com a matriz de recursos e os preços do código; isso não equivale a uma compra de teste na loja.

O aplicativo e a ficha da Google Play foram abertos somente para conferir os destinos das chamadas da landing. Não foi realizada uma auditoria do aplicativo autenticado. A revisão visual observada corresponde ao viewport efetivo de 1280 × 720; a tentativa de emulação não alterou esse viewport, portanto esta análise não certifica a apresentação móvel.

Não foram obtidos dados do Search Console, taxas de conversão, campanhas, backlinks, volumes de busca, Core Web Vitals de campo ou um teste de laboratório de desempenho. Nenhuma estimativa de perda de vendas, posição no Google ou aumento percentual de conversão é apresentada. As recomendações comerciais são hipóteses fundamentadas para validação, e os defeitos técnicos identificados são observações verificáveis.

## Prioridades

| Prioridade | Achado                                                                                   | Consequência provável                                                                       | Ação                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| P1         | `robots.txt` bloqueia `/` e `/_next/`                                                    | Dificulta o rastreamento da entrada pública e a renderização pelos buscadores               | Liberar a raiz pública e os recursos necessários, preservando a proteção das rotas internas |
| P1         | HTTPS com `www` falha na validação do certificado                                        | Quem usa essa variante pode encontrar erro antes de chegar à página                         | Configurar o domínio e seu certificado; depois redirecionar para a versão canônica          |
| P1         | Catálogo personalizado aparece como diferencial do Profissional, mas existe no Essencial | A comparação de planos pode induzir uma escolha baseada em informação incompleta            | Reconciliar os cartões com a matriz comercial atual                                         |
| P1         | “Precificação completa” não explica quais capacidades são exclusivas do Profissional     | A pessoa não consegue comparar a demonstração com o que cada plano oferece                  | Nomear as diferenças reais, em vez de depender do rótulo genérico                           |
| P2         | Planos e resultado da calculadora conduzem somente à Google Play                         | Visitantes do computador ou interessados no navegador perdem continuidade                   | Oferecer o caminho web nos mesmos pontos de decisão                                         |
| P2         | Guia usa “margem” para o acréscimo aplicado ao custo                                     | Ensina um conceito diferente daquele que parte do público entende como margem sobre a venda | Padronizar a linguagem e mostrar os dois denominadores                                      |
| P2         | Mensagens e capturas repetem a mesma jornada em três blocos                              | A página exige mais leitura antes da escolha do plano                                       | Unir explicação e demonstração; medir alcance dos planos                                    |
| P2         | GA previsto no código não apareceu carregado na página inspecionada                      | O mecanismo existente pode não estar produzindo dados do funil                              | Conferir configuração e recebimento real de eventos                                         |
| P2         | Compartilhamento sem `og:image` nas páginas verificadas                                  | Menor controle da apresentação do link em mensagens e redes                                 | Configurar imagem e metadados adequados por tipo de página                                  |
| P3         | Guias curtos, com pouca ligação entre si e poucas provas externas                        | Cobertura limitada das dúvidas que antecedem o uso do app                                   | Aprofundar os três guias antes de multiplicar novas páginas                                 |

P1 significa corrigir antes de ampliar aquisição. P2 melhora compreensão, continuidade ou medição. P3 amplia a base de conteúdo. A classificação expressa prioridade editorial e técnica, não uma nota de ranking.

## O que já funciona

O título principal aborda uma dor reconhecível: vender sem saber o que sobra. A demonstração ao lado transforma uma promessa abstrata em uma conta legível. Materiais, embalagem, tempo de trabalho e custos fixos aparecem separados; a diferença entre preço de venda e sobra fica visível. O exemplo é identificado como ilustrativo, evitando sugerir que seus números sejam resultados reais de uma cliente. [1]

A escrita é majoritariamente simples. “Seu tempo fica de graça” e “O dinheiro se mistura” têm mais força explicativa do que termos genéricos de gestão. O acesso à calculadora sem cadastro reduz o compromisso necessário para experimentar o produto. Os screenshots apresentam o aplicativo e informam que usam dados de uma conta de testes. [1]

As nove páginas públicas verificadas responderam com HTTP 200. Há título, descrição, canonical e um H1 no HTML de cada uma. As páginas públicas informam `index, follow`. O sitemap existe e aponta para URLs canônicas; os três guias incluem `Article` e a landing inclui `MobileApplication` no DOM renderizado. As imagens do conteúdo principal têm textos alternativos descritivos. [2–4]

As páginas de suporte, privacidade, termos e exclusão são acessíveis. O suporte separa dúvidas por assunto e informa que não pede senha. A exclusão explica o caminho no aplicativo, a alternativa por e-mail e a diferença entre excluir a conta e cancelar uma assinatura. A avaliação aqui é de clareza e confiança, sem concluir conformidade jurídica. [5–8]

## Posicionamento e conteúdo da landing

### Abertura

**Observação.** A página começa com “Quanto sobra de cada venda? Agora você sabe.” A descrição promete descobrir quanto cobrar, valorizar o tempo e organizar vendas. Há três caminhos próximos: Google Play, navegador e calculadora. A mensagem é compreensível e os destinos são explícitos. [1]

**Avaliação.** O benefício está claro; a categoria e o público podem ser apresentados mais cedo. Quem chega sem conhecer a marca ainda precisa deduzir que se trata de um aplicativo para organizar um negócio. A frase “sem cadastrar de novo” também deixa implícito o que será reaproveitado.

**Recomendação.** Manter a ideia de sobra e acrescentar uma frase que nomeie o produto, o público e o reaproveitamento do cálculo. Não estreitar a homepage a confeitaria: isso contrariaria o posicionamento amplo registrado no projeto. Usar exemplos de produção, revenda e serviços nas seções seguintes. [9]

O título SEO atual, “Preço certo. Venda pronta. · Lucro Caseiro”, funciona como assinatura de marca, mas descreve pouco a categoria em uma busca. Recomenda-se “App de precificação e vendas | Lucro Caseiro”. É uma proposta editorial; não uma palavra-chave com volume comprovado. O Google recomenda títulos concisos, descritivos e coerentes com o conteúdo; não estabelece uma obrigação universal de 60 caracteres. [10]

### Exemplo de preço

**Observação.** Os custos somam R$ 23,10. O preço mostrado é R$ 30,49 e a sobra é R$ 7,39. A conta fecha: R$ 10,00 + R$ 2,00 + R$ 8,10 + R$ 3,00 = R$ 23,10; R$ 30,49 − R$ 23,10 = R$ 7,39. O preço corresponde aproximadamente a 32% de acréscimo sobre o custo, com arredondamento. [1]

**Avaliação.** O número final é convincente, mas sua premissa não está visível. “Preço sugerido” pode parecer uma recomendação automática sobre o mercado quando decorre do percentual escolhido para o exemplo.

**Recomendação.** Acrescentar uma linha curta: “Exemplo com 32% sobre o custo, sem taxas adicionais.” Preferir “Sobra estimada por caixa” quando o produto demonstrado é uma caixa, evitando a dúvida entre uma caixa e um brigadeiro. Explicar que o resultado depende dos custos e das taxas informadas. Não acrescentar um retorno prometido.

### Dores, funcionamento e demonstração

**Observação.** A landing apresenta quatro etapas em “Da primeira conta à próxima venda”, repete calcular/cadastrar/compartilhar em uma jornada com screenshots e depois exibe novamente precificação e catálogo na grade de recursos. No viewport observado, a jornada ocupa 2.448 px, equivalentes aos `340svh` definidos no CSS; os planos começam aproximadamente a 6.660 px do início. Existe um atalho “Planos” no cabeçalho. [1,11]

**Avaliação.** A repetição pode ajudar a fixar o conceito, mas cada seção precisa acrescentar uma informação. Hoje, uma parte importante da página reconta a mesma história. A distância até os planos é observável; abandono ou perda de conversão não foram medidos.

**Recomendação.** Unir a explicação e a demonstração em três etapas: calcular, transformar em produto, compartilhar ou registrar a venda. Reservar a seção posterior a benefícios complementares, como fiado, agenda e resultado financeiro. Preservar a direção visual e a animação já escolhidas, mas testar duração e extensão com uma métrica de alcance da seção de planos.

### Público

Os quatro grupos atuais — confeitaria, marmitas, artesanato/costura e beleza/serviços — ampliam a identificação. Entretanto, a abertura demonstra somente brigadeiros, e as principais etapas continuam centradas em produto. Incluir exemplos breves de uma peça artesanal, um item de revenda e um atendimento ajudaria a cumprir a promessa ampla. Isso não exige quatro novas landing pages nem animações adicionais. [1,9]

Para aquisição específica, páginas ou campanhas por segmento podem existir posteriormente. Cada uma precisa mostrar um cálculo, uma dúvida e um fluxo realmente diferentes; apenas substituir o nome da atividade geraria conteúdo repetitivo e pouco útil.

## Oferta, planos e continuidade da conversão

### Benefícios que precisam ser reconciliados

Os preços mensais publicados coincidem com `PLAN_PRICING`: Gratuito R$ 0, Essencial R$ 29,90 e Profissional R$ 69,90. Os limites de 30 vendas por mês e 15 produtos do Gratuito também coincidem com a matriz. O código registra anuais de R$ 299 e R$ 699, equivalentes a dez mensalidades. Isso sustenta a comparação de dois meses de economia frente a doze pagamentos mensais, sem verificar o preço efetivamente apresentado em cada loja ou oferta. [1,12]

O principal desencontro é o catálogo personalizado. `catalogCustomization` e `catalogPremium` pertencem ao Essencial, e o Profissional herda esses recursos. A landing só menciona personalização no cartão Profissional. Não é falso dizer que o Profissional inclui o recurso; o problema é apresentá-lo como motivo de diferenciação sem informar sua disponibilidade no Essencial. [12,13]

O Gratuito permite cadastrar 15 produtos, mas a implementação do catálogo público limita sua seleção padrão a três produtos quando `catalogPremium` não está ativo. “Catálogo básico” não comunica esse limite. A seleção pode mudar quando um produto específico é acessado; a redação mais segura é “Vitrine básica com até 3 produtos por vez”. [14]

### Precificação gratuita versus completa

A landing identifica a precificação completa como Profissional, mas não explica quais capacidades formam essa diferença. A calculadora pública oferece mão de obra, fixos e taxas sem cadastro. A matriz reserva `advancedPricing` ao Profissional, porém o nome da feature não basta para concluir que todo cálculo detalhado seja pago. [1,12,15]

O fluxo unificado atual mostra mão de obra, despesas por unidade e taxas manuais sem condicionar esses campos ao Profissional. As restrições explícitas estão no rateio por faturamento e nos perfis salvos de taxas. A API também aplica o guard de cálculo avançado quando `allocationMode` é `revenue`, além das preferências. Portanto, seria incorreto recomendar que a landing anunciasse todo uso de mão de obra ou taxas como exclusivo do plano pago. [15,32]

Recomenda-se uma tabela com capacidades concretas: cálculo por unidade com os custos informados; distribuição de despesas por faturamento; perfis salvos de taxas. Conferir essa matriz contra a versão publicada antes de mudar a promessa comercial. A inconsistência observada é a falta de precisão do rótulo e a divergência entre materiais de marketing e granularidade do produto, não uma prova de que o fluxo gratuito anunciado seja impossível.

### Destino das chamadas

O hero e o fechamento oferecem navegador e Android. Os três cartões de planos, porém, levam à mesma ficha da Google Play. O resultado da calculadora também oferece apenas Android, embora o navegador já seja apresentado como disponível. Esse é um desencontro verificável de navegação. Não significa que o acesso web esteja ausente do site: ele existe no cabeçalho e em outros pontos. [1,16]

Recomenda-se manter ambos os caminhos nos cartões e no resultado. “Começar grátis no navegador” pode ser a ação principal para visitantes da web, com “Baixar para Android” como alternativa. Se a prioridade comercial continuar sendo instalação no Android, conservar a ordem atual e acrescentar a alternativa web nos pontos que ainda não a têm. Comparar resultados por dispositivo e pela ativação posterior, não apenas por cliques.

Não usar “Escolher Essencial” em um botão que só abre a loja sem preservar a escolha do plano. Se não houver essa continuidade implementada, preferir “Abrir o app para escolher”. Da mesma forma, não prometer “salvar esta conta” se o resultado da calculadora ainda não é transferido para o aplicativo.

### Perguntas frequentes

As quatro perguntas atuais tratam de facilidade, teste gratuito, segmento e WhatsApp. Faltam respostas diretas para decisões importantes: o que é gratuito; o que muda na precificação completa; se funciona pelo navegador; como os limites do catálogo diferem dos limites de produtos; e onde gerenciar a assinatura. [1]

As respostas devem ser curtas e específicas. Não prometer ausência de cartão, suporte em determinado prazo, sincronização de todos os dados ou funcionamento offline sem confirmar o fluxo correspondente. As informações de cancelamento podem apontar para o suporte e para a plataforma utilizada na compra, em vez de alongar a landing com texto contratual.

## SEO técnico e apresentação nos buscadores

### Rastreamento: problema confirmado

O arquivo publicado contém `Allow: /landing` e `Disallow: /`. A regra mais específica permite as páginas sob `/landing`, portanto seria incorreto afirmar que todo o site está bloqueado. Entretanto, `/` e os recursos sob `/_next/` não possuem exceção e ficam proibidos para robôs que obedecem a essas regras. O DOM mostra CSS e JavaScript servidos precisamente sob `/_next/static/`. [2,17]

**Impacto.** O visitante humano abre a homepage, mas o robô não recebe permissão para rastrear a mesma URL. Também pode não renderizar as páginas permitidas como um navegador comum. Como parte do conteúdo já está no HTML, isso não prova ausência total de indexação; o problema é o acesso inconsistente ao conteúdo e aos seus recursos. O Google orienta permitir acesso a CSS, imagens e demais recursos necessários à renderização. [18]

**Correção recomendada.** Tratar as regras por host e intenção de página. No domínio público, permitir a raiz e os recursos estáticos usados pela landing, mantendo as rotas internas fora da busca. Uma estratégia de exceções pode conservar `Disallow: /` e acrescentar permissões específicas para `/$`, `/landing` e `/_next/`, além de outros assets públicos necessários. O desenho final deve ser validado contra todos os caminhos internos. `robots.txt` não substitui autenticação.

**Critério de aceite.** Googlebot permitido para a homepage e seus CSS/JS/imagens; rotas privadas continuam protegidas; inspeção ao vivo no Search Console apresenta a página renderizada corretamente.

### Raiz e `/landing`: consolidar a decisão

Ambas respondem HTTP 200 e apresentam o mesmo conteúdo. O canonical aponta para `/landing`, o sitemap usa `/landing` e a navegação também usa essa rota. Esses sinais são coerentes entre si. A fragilidade está na entrada pública `/`, bloqueada para rastreamento, e na manutenção de duas URLs para a mesma página. [1–4]

Se o endereço principal desejado é a raiz divulgada comercialmente, recomenda-se canonical em `/`, sitemap atualizado e redirecionamento permanente somente da rota exata `/landing` para `/`. As páginas `/landing/calculadora` e `/landing/guias/...` podem continuar onde estão. Alternativamente, manter `/landing` como canonical e redirecionar `/` para ela também é tecnicamente válido. Escolher uma opção e alinhar todos os sinais; não tratar o nome da pasta como um fator de ranking por si só. [19]

### Certificado do endereço com `www`

A consulta a `https://www.lucrocaseiro.com.br/` falhou com `ERR_TLS_CERT_ALTNAME_INVALID`. O domínio sem `www` respondeu normalmente, e `http://lucrocaseiro.com.br/` redirecionou com 301 para HTTPS. O problema é específico da variante verificada, não uma indisponibilidade geral do site. [4]

Configurar o hostname `www` na hospedagem e no certificado, validar o TLS e então aplicar um redirecionamento permanente para o hostname principal. O HTTPS precisa funcionar antes que o navegador possa receber o redirecionamento. Não foi ignorada a validação do certificado durante a análise.

### Metadados e compartilhamento

Há títulos e descrições individuais. A principal oportunidade é tornar o título da homepage mais descritivo. Na calculadora, a palavra-chave já aparece no título e no texto de introdução, mas o H1 é uma frase emocional. “Calculadora gratuita de preço de venda” seria um H1 mais explícito; “Seu trabalho tem valor. Coloque ele na conta.” pode permanecer como apoio. A mudança busca clareza de intenção, não uma regra de que toda palavra-chave precise obrigatoriamente estar em H1.

Não foi encontrado `og:image` no HTML das nove páginas, e a ausência foi confirmada no DOM da landing e da calculadora. O compartilhamento fica dependente das escolhas de cada plataforma. Definir uma imagem legível com marca e proposta, `og:url`, título e descrição por tipo de página. A descrição Open Graph da homepage menciona apenas Android, enquanto o conteúdo visível também promove navegador; atualizá-la. [1,4,16]

### Dados estruturados

Há `MobileApplication` na landing e `Article` nos três guias. Isso é um ponto positivo confirmado após renderização. O aplicativo é descrito como Android e inclui as ofertas mensais; a presença do navegador sugere revisar a modelagem, mantendo coerência com o produto efetivamente apresentado. [1,20]

A presença de JSON-LD não garante resultado enriquecido. É preciso validar elegibilidade e propriedades no Rich Results Test. A marcação observada não possui avaliações; não preencher `aggregateRating` ou depoimentos inventados para satisfazer validadores. Avaliar `WebSite`, identificação da organização e breadcrumbs somente quando correspondam a informações e navegação reais.

### Sitemap e desempenho

O sitemap contém as nove páginas esperadas, mas atribui a todas a mesma data de atualização, 16 de julho de 2026. A landing foi modificada posteriormente conforme seu histórico local. Usar a data da alteração significativa de cada página; não substituir todas por “hoje” em cada build. O Google utiliza `lastmod` quando ele é consistentemente confiável e ignora `priority` e `changefreq`. [3,21]

As respostas HTML das páginas públicas usam `private, no-cache, no-store`. O layout acessa headers para o nonce de CSP. Isso é uma pista de que a entrega pública merece avaliação de cache e renderização, sem concluir que a página seja lenta. Medir antes de propor mudanças: LCP, INP e CLS de campo quando disponíveis, além de um teste de laboratório reproduzível. Qualquer otimização deve preservar a política de segurança e separar conteúdo público de conteúdo autenticado. [4,22]

## Calculadora e guias

### Calculadora

É o melhor instrumento de demonstração do site: apresenta um exemplo editável, descreve os custos e mostra o destino do dinheiro. O termo “Lucro sobre o custo” é acompanhado de um exemplo claro. As mensagens sobre o pagamento do tempo de trabalho ajudam a separar remuneração e lucro. [16]

Foram verificados três comportamentos: o exemplo inicial resulta em custo R$ 49,50, preço R$ 74,25 e sobra R$ 24,75; com taxa de 10%, o preço muda para R$ 82,50 e a taxa para R$ 8,25, preservando a sobra; com gastos fixos positivos e produção mensal zero, o resultado é ocultado e a correção é solicitada. Restaurar o exemplo retorna os valores iniciais. Isso verifica esses cenários, sem equivaler a uma auditoria de todos os possíveis cálculos.

Recomendações: acrescentar saída para o navegador no resultado; explicar que a ferramenta pública é uma simulação e que os recursos adicionais do app variam por plano; manter o exemplo claramente identificado; não prometer transferência automática dos valores. O H1 descritivo ajudaria quem chega diretamente pela busca.

### Guia geral de preço de venda

O guia percorre custos diretos, embalagem, tempo, fixos e taxas, mas no passo 5 chama de “margem” o percentual somado ao custo. Com custo de R$ 20 e preço de R$ 30, o lucro de R$ 10 equivale a 50% do custo e a 33,33% do preço de venda. O cálculo é correto para acréscimo sobre o custo; o rótulo precisa distinguir os conceitos. [23]

Substituir por “Defina o lucro sobre o custo” e mostrar uma nota comparativa. Adicionar a fórmula de taxa sobre a venda e um exemplo fechado do começo ao fim. Para uma taxa de 10% e preço-base de R$ 30, o preço final é R$ 30 ÷ 0,90, aproximadamente R$ 33,33. Vincular a explicação à calculadora e aos guias de mão de obra e confeitaria. O Sebrae também distingue a aplicação de markup ao custo e a formação do preço de venda; a recomendação é explicitar a base percentual em toda fórmula. [24]

### Guia de confeitaria

O exemplo termina no custo de R$ 3,10 por brigadeiro. É útil para ficha técnica, mas incompleto para a promessa de precificação: faltam acréscimo, taxa, preço final e uma simulação de encomenda. Incluir o cálculo completo e esclarecer que uma caixa pode ter um custo de embalagem diferente do doce avulso. No tópico de quantidade, “preço por cento” é menos claro do que “preço por cento de doces” ou “preço para 100 unidades”. [25]

### Guia de mão de obra

A distinção entre remuneração do trabalho e lucro é forte. O exemplo de R$ 24 por hora e 45 minutos gera R$ 18, e há orientação sobre lotes. Completar o exemplo do lote com o resultado por unidade e mostrar como estimar horas produtivas usando uma rotina hipotética explicitamente identificada. Acrescentar links para o guia geral e para o cálculo correspondente. [26]

Os três guias têm aproximadamente 293 a 370 palavras no conteúdo principal visível, incluindo o convite final. O tamanho, isoladamente, não é defeito nem requisito de ranking. A limitação observada é que deixam dúvidas práticas sem resposta, não citam fontes no corpo e não encaminham diretamente uns aos outros. A solução é aumentar a utilidade, sem preencher uma meta artificial de palavras.

## Referências de mercado e oportunidades editoriais

O Kyte se apresenta principalmente por vendas, estoque e operação conectada, e dá caminhos para uso em diferentes dispositivos. A Patroa.ai concentra sua mensagem em produção de alimentos, receitas e apoio de inteligência artificial. Essas são as mensagens declaradas por suas próprias páginas, não uma avaliação independente da qualidade dos produtos. [27,28]

Para o Lucro Caseiro, a oportunidade é tornar explícita a continuidade entre custo, remuneração, preço e venda. Uma mensagem ampla como “organize seu negócio” é compartilhada por muitos sistemas; a demonstração de como uma conta vira produto e catálogo é mais concreta. Isso não sustenta afirmar que o fluxo seja exclusivo ou superior aos concorrentes.

As pautas abaixo são hipóteses editoriais ligadas ao produto. Não foram classificadas por volume, dificuldade ou retorno estimado, porque esses dados não foram obtidos.

| Pauta                        | Dúvida principal                                      | Evidência ou exemplo necessário       | Próxima ação                  |
| ---------------------------- | ----------------------------------------------------- | ------------------------------------- | ----------------------------- |
| Margem e lucro sobre o custo | “50% de lucro significa metade da venda?”             | Mesma conta com os dois denominadores | Abrir calculadora             |
| Preço de brigadeiro e caixa  | “Quanto cobrar por unidade e por caixa?”              | Receita, rendimento, embalagem e taxa | Reproduzir cálculo            |
| Mão de obra no preço         | “Quanto vale uma hora do meu trabalho?”               | Horas produtivas e cálculo por lote   | Calcular custo do tempo       |
| Desconto sem apagar o lucro  | “Quanto posso descontar?”                             | Preço, custo e taxa antes/depois      | Conferir preço                |
| Catálogo para WhatsApp       | “Como mostrar meus produtos sem mandar várias fotos?” | Demonstração autorizada do catálogo   | Começar catálogo no app       |
| Vendas, recebimentos e fiado | “Vendi, mas esse dinheiro já entrou?”                 | Exemplo de venda pendente e recebida  | Conhecer o controle de vendas |

Antes de publicar novos artigos, melhorar os três existentes e criar ligações contextuais. Cada pauta deve ter uma pessoa responsável por revisão, data de alteração real e uma fonte ou demonstração que sustente suas afirmações.

## Sugestão de texto para a landing

Os textos abaixo são propostas para revisão. Foram escritos para explicar melhor o produto sem acrescentar capacidades ou resultados prometidos.

### Hero

**Opção A — preservar a ideia atual:**

“Saiba quanto cobrar e o que sobra de cada venda.”

“O Lucro Caseiro ajuda quem produz, vende ou presta serviços a calcular preços e organizar o negócio. Aproveite a precificação para cadastrar seus produtos e usá-los no catálogo ou nas vendas.”

**Opção B — destacar o fluxo:**

“Do custo do produto à venda organizada.”

“Calcule seu preço, transforme a conta em produto e acompanhe suas vendas no Lucro Caseiro. Comece no plano gratuito, no Android ou no navegador.”

**Opção C — destacar o trabalho:**

“Seu trabalho tem valor. Seu preço precisa mostrar isso.”

“Entenda seus custos e veja quanto pode sobrar. Depois, organize produtos, catálogo e vendas no mesmo aplicativo.”

A opção A é a recomendação inicial por conservar a dor central e explicar a categoria. A opção B merece teste quando a origem do tráfego já conhece a precificação. A opção C funciona melhor acompanhada de uma demonstração do valor do tempo, sem sugerir que incluir mão de obra exija necessariamente uma assinatura.

**Chamadas:** “Começar grátis no navegador”; alternativa “Baixar para Android”; experimentação “Testar a calculadora sem cadastro”. Se Android continuar sendo o canal prioritário, inverter apenas a hierarquia das duas primeiras. O texto precisa indicar o destino real.

### Demonstração e funcionamento

**Título:** “Calcule uma vez. Use a informação no seu negócio.”

**Etapa 1 — Calcule o preço.** “Informe os custos e veja o preço sugerido e a sobra estimada.”

**Etapa 2 — Transforme em produto.** “Aproveite a precificação para cadastrar o produto sem repetir os mesmos valores.”

**Etapa 3 — Compartilhe ou registre a venda.** “Use o produto no catálogo para WhatsApp e no controle das suas vendas.”

**Nota para recursos avançados, após confirmar o alinhamento com a versão publicada:** “No Profissional, você também pode distribuir despesas pelo faturamento e salvar perfis de taxas para reutilizar.” A nota deve aparecer junto desses recursos, sem tornar a conta básica artificialmente dependente do plano pago.

### Planos

| Plano        | Frase de decisão proposta                                         | Informações a destacar                                                                                                                     |
| ------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Gratuito     | “Para fazer as primeiras contas e organizar as primeiras vendas.” | Precificação por unidade com os custos informados; 30 vendas/mês; 15 produtos; 20 clientes; vitrine básica com até 3 produtos por vez      |
| Essencial    | “Para o dia a dia, com vendas, produtos e clientes ilimitados.”   | R$ 29,90/mês; catálogo completo e personalizado; agenda e fiado; resumo mensal em PDF                                                      |
| Profissional | “Para ampliar o controle dos custos e do negócio.”                | R$ 69,90/mês; tudo do Essencial; rateio por faturamento e perfis de taxas; relatórios/exportações avançadas; compras, orçamentos e rótulos |

Mostrar o anual em uma linha comparável: “R$ 299 por ano no Essencial ou R$ 699 no Profissional”, após confirmar a oferta vigente no canal de contratação. Caso “Recomendado” permaneça no Essencial, explicar para quem: “Para quem precisa organizar as vendas do dia a dia”.

### FAQ sugerido

**O que posso fazer no Gratuito?** “Calcular o preço por unidade, cadastrar até 15 produtos e 20 clientes e registrar 30 vendas por mês. O catálogo básico exibe até 3 produtos por vez.”

**O que o Profissional acrescenta à precificação?** “Você pode distribuir despesas com base no faturamento e salvar perfis de taxas para reutilizar nas próximas contas.” Esta resposta corresponde às restrições explícitas do código atual e deve ser conferida no aplicativo publicado.

**Posso usar no computador?** “Sim. Você pode acessar o Lucro Caseiro pelo navegador. Também há aplicativo para Android.”

**O catálogo personalizado está em qual plano?** “Está disponível no Essencial e no Profissional. O Gratuito inclui a versão básica.”

**Serve para serviços e outros produtos?** “Sim. O Lucro Caseiro atende produção, vendas e serviços. Confeitaria, artesanato, revenda e beleza são exemplos.”

**Como gerencio minha assinatura?** “O gerenciamento depende da plataforma usada na contratação. Consulte as orientações de suporte para encontrar o caminho da sua compra.”

### Fechamento e metadados

**Fechamento:** “Comece pela próxima conta do seu negócio.”

**Apoio:** “Experimente a calculadora ou abra sua conta no Lucro Caseiro. O plano gratuito está disponível no Android e no navegador.”

**Título SEO:** “App de precificação e vendas | Lucro Caseiro”.

**Descrição proposta:** “Calcule preços e organize produtos, catálogo e vendas no Lucro Caseiro. Comece no plano gratuito pelo Android ou navegador.”

Esses metadados devem acompanhar a URL canônica escolhida. Para compartilhamento, usar uma imagem própria com a mesma promessa e uma captura legível, sem depoimentos ou métricas inventados.

## Medição e execução

Há eventos `data-analytics` previstos para Google Play, navegador e calculadora. O componente de analytics depende de `NEXT_PUBLIC_GA_ID`; nenhum script de GA foi observado no DOM ou HTML inspecionado. Isso indica ausência do mecanismo visível nessa sessão, não prova ausência de qualquer medição por infraestrutura ou outro sistema. [29]

Antes de testar textos, confirmar em uma ferramenta de analytics que os eventos chegam. Separar quatro etapas: leitura/alcance de uma seção; escolha de destino; cadastro ou instalação; ativação do negócio. A métrica de sucesso recomendada é completar uma precificação e aproveitá-la em produto, catálogo ou venda. Cliques e downloads sozinhos não comprovam esse resultado.

Eventos propostos para instrumentação: `pricing_section_view`, `calculator_first_edit`, `calculator_valid_result`, `calculator_to_app`, `start_web`, `start_android` e `business_activated`. São sugestões, não eventos confirmados no produto. Não enviar valores financeiros, nomes de clientes nem o conteúdo da calculadora para medir o funil. Definir sessões elegíveis e excluir o exemplo pré-preenchido ao contar cálculos concluídos.

| Sequência | Trabalho                                                           | Verificação de conclusão                                                             |
| --------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| 1         | Robots, certificado `www` e escolha da homepage canônica           | TLS válido; redirecionamento coerente; acesso do robô aos recursos; sitemap alinhado |
| 2         | Planos, limites e capacidades específicas da precificação          | Cada afirmação conferida contra a matriz, o fluxo atual e a versão publicada         |
| 3         | Caminho web nos planos/calculadora e metadados de compartilhamento | Todos os CTAs abrem o destino declarado; preview com imagem própria                  |
| 4         | Medição do funil                                                   | Eventos recebidos e definição de ativação documentada                                |
| 5         | Guia de margem, exemplos completos e links internos                | Fórmulas consistentes e leitura que termina em uma ação relevante                    |
| 6         | Teste de hero e redução da repetição                               | Comparação por dispositivo e ativação, com amostra e período explicitados            |

Nas primeiras semanas, priorizar correções objetivas. Depois, alterar uma hipótese principal de conversão por vez. Sem volume suficiente para um experimento estatístico, usar sessões observadas de leitura e tarefas concretas: identificar o plano adequado, explicar a diferença entre custo e lucro, encontrar o navegador e reproduzir o exemplo da calculadora.

## Fontes e evidências

As páginas e documentos abaixo foram consultados em 10 de setembro de 2026. Os dados de páginas externas representam o que elas publicam; não foram usados como prova independente de desempenho comercial.

1. Lucro Caseiro. [Landing pública](https://lucrocaseiro.com.br/) e [rota `/landing`](https://lucrocaseiro.com.br/landing). Conteúdo, FAQ, planos, links e DOM renderizado.
2. Lucro Caseiro. [Robots.txt publicado](https://lucrocaseiro.com.br/robots.txt).
3. Lucro Caseiro. [Sitemap XML](https://lucrocaseiro.com.br/sitemap.xml).
4. Registro da inspeção HTTP: [http-audit.json](C:/Users/maria/Documents/projects/lucro-caseiro/docs/auditoria-landing-2026-09-10/http-audit.json). Status, canonical, cabeçalhos e falha TLS da variante `www`.
5. Lucro Caseiro. [Suporte](https://lucrocaseiro.com.br/landing/suporte).
6. Lucro Caseiro. [Privacidade](https://lucrocaseiro.com.br/landing/privacidade).
7. Lucro Caseiro. [Termos](https://lucrocaseiro.com.br/landing/termos).
8. Lucro Caseiro. [Exclusão de conta](https://lucrocaseiro.com.br/landing/excluir-conta).
9. Projeto local. [PRODUCT.md](C:/Users/maria/Documents/projects/lucro-caseiro/apps/web/PRODUCT.md). Público, posicionamento e compromissos da marca. Algumas descrições de plataforma, animação e exemplo estão desatualizadas; a página publicada e o código prevaleceram nesses pontos.
10. Google Search Central. [Influencing title links](https://developers.google.com/search/docs/appearance/title-link).
11. Projeto local. [landing-page.module.css](C:/Users/maria/Documents/projects/lucro-caseiro/apps/web/src/features/landing/landing-page.module.css), `.journey[data-journey-ready]`; dimensões observadas no DOM em 1280 × 720.
12. Projeto local. [plans.ts](C:/Users/maria/Documents/projects/lucro-caseiro/packages/contracts/src/schemas/plans.ts). `PLAN_LIMITS`, `PLAN_FEATURES`, `PLAN_PRICING`.
13. Projeto local. [plan-features.test.ts](C:/Users/maria/Documents/projects/lucro-caseiro/apps/mobile/src/features/subscription/plan-features.test.ts). Expectativas da personalização do catálogo no Essencial.
14. Projeto local. [catalog.usecases.ts](C:/Users/maria/Documents/projects/lucro-caseiro/apps/api/src/features/catalog/catalog.usecases.ts). Limite e seleção de produtos do catálogo gratuito.
15. Projeto local. [unified-pricing-calculator.tsx](C:/Users/maria/Documents/projects/lucro-caseiro/apps/mobile/src/features/pricing/components/unified-pricing-calculator.tsx) e [pricing-cost-details.tsx](C:/Users/maria/Documents/projects/lucro-caseiro/apps/mobile/src/features/pricing/components/pricing-cost-details.tsx). Disponibilidade da modalidade detalhada.
16. Lucro Caseiro. [Calculadora pública](https://lucrocaseiro.com.br/landing/calculadora). Conteúdo, destinos e três cenários interativos.
17. Google Crawling Infrastructure. [Especificação de robots.txt](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec).
18. Google Search Central. [Technical SEO techniques](https://developers.google.com/search/docs/fundamentals/get-started).
19. Google Search Central. [Consolidação de URLs duplicadas](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).
20. Google Search Central. [SoftwareApplication structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app).
21. Google Search Central. [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
22. Projeto local. [layout.tsx](C:/Users/maria/Documents/projects/lucro-caseiro/apps/web/src/app/landing/layout.tsx) e [proxy.ts](C:/Users/maria/Documents/projects/lucro-caseiro/apps/web/src/proxy.ts). Nonces, headers e rewrite da homepage.
23. Lucro Caseiro. [Como calcular o preço de venda](https://lucrocaseiro.com.br/landing/guias/como-calcular-preco-de-venda).
24. Sebrae. [Saiba como fazer seu preço de venda](https://sebrae.com.br/Sebrae/Portal%20Sebrae/Arquivos/ebook_sebrae_saiba_como_fazer_seu_preco_de_venda.pdf). Formação de preço e aplicação de markup ao custo.
25. Lucro Caseiro. [Precificação para confeitaria](https://lucrocaseiro.com.br/landing/guias/precificacao-para-confeitaria).
26. Lucro Caseiro. [Mão de obra no preço](https://lucrocaseiro.com.br/landing/guias/como-colocar-mao-de-obra-no-preco).
27. Kyte. [Página oficial](https://www.kyte.com.br/). Mensagens de vendas, estoque e uso em dispositivos.
28. Patroa.ai. [Página oficial](https://patroa.ai/). Posicionamento em negócios de alimentação e IA.
29. Projeto local. [site-analytics.tsx](C:/Users/maria/Documents/projects/lucro-caseiro/apps/web/src/features/landing/site-analytics.tsx). Implementação condicional de GA e cliques.
30. Orionseven Software. [Ficha do Lucro Caseiro na Google Play](https://play.google.com/store/apps/details?id=br.com.orionseven.lucrocaseiro). Destino confirmado; nenhuma compra realizada.
31. Projeto local. [Provas e alegações](C:/Users/maria/Documents/projects/lucro-caseiro/docs/marketing/provas-e-alegacoes.md). Registro consultado sem biblioteca preenchida de depoimentos ou resultados autorizados.
32. Projeto local. [pricing.routes.ts](C:/Users/maria/Documents/projects/lucro-caseiro/apps/api/src/features/pricing/pricing.routes.ts). Restrição de cálculo por faturamento e das preferências avançadas.

## Inventário das páginas

| Página                                             | Estado observado                                                         | Próxima melhoria específica                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `/` e `/landing`                                   | HTTP 200; mesmo conteúdo; canonical `/landing`; raiz bloqueada no robots | Consolidar homepage, liberar recursos, corrigir planos e continuidade web           |
| `/landing/calculadora`                             | HTTP 200; cálculos amostrados corretos; canonical próprio                | H1 explícito, CTA web e explicação da continuidade no app                           |
| `/landing/guias/como-calcular-preco-de-venda`      | HTTP 200; Article; canonical próprio                                     | Distinguir margem/acréscimo, completar fórmula com taxas e links                    |
| `/landing/guias/precificacao-para-confeitaria`     | HTTP 200; Article; canonical próprio                                     | Levar exemplo do custo até o preço final e a encomenda                              |
| `/landing/guias/como-colocar-mao-de-obra-no-preco` | HTTP 200; Article; canonical próprio                                     | Completar cálculo por lote e ligar a conteúdos relacionados                         |
| `/landing/suporte`                                 | HTTP 200; quatro assuntos com e-mail                                     | Incluir orientações de autosserviço e identidade da operadora com dados confirmados |
| `/landing/privacidade`                             | HTTP 200; contato e finalidades descritos                                | Manter explicação de métricas alinhada à configuração real                          |
| `/landing/termos`                                  | HTTP 200; planos e cancelamento descritos                                | Manter plataformas e oferta atualizadas; revisão jurídica separada se necessária    |
| `/landing/excluir-conta`                           | HTTP 200; instruções e distinção da assinatura                           | Conferir periodicamente os nomes e o caminho das telas publicadas                   |

Nenhuma alteração no site ou no aplicativo foi aplicada nesta análise. Foram produzidos o relatório e o registro de evidências HTTP.
