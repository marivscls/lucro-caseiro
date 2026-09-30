# Execução dos quatro pontos de alcance na Google Play

Data: 28/09/2026. Aplicativo: `br.com.orionseven.lucrocaseiro`.

Este documento registra a execução autorizada dos quatro próximos passos. Aumentar visitas, instalações e primeira utilização é o objetivo; nenhuma configuração garante exposição ou retenção.

## Entregas e critérios

| Ponto                  | Execução                                                                                          | Critério de conclusão                                                              | Estado inicial                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1. Apresentação visual | Reordenar e ampliar a galeria com catálogo, orçamentos, agenda e gestão financeira; revisar vídeo | Arquivos conferidos, ficha salva e enviada à análise                               | Enviada; análise do Google pendente                                              |
| 2. Android 31          | Conferir testes e relatório de pré-lançamento; preparar promoção para produção                    | Validação Android documentada e lançamento enviado; separar rascunho de publicação | Rascunho de produção preparado; liberação pendente do teste Android              |
| 3. Páginas por público | Criar páginas para confeitaria, artesanato e serviços, segmentadas por URL                        | Três páginas salvas, links registrados e alterações enviadas                       | Três páginas enviadas; análise do Google pendente                                |
| 4. Experimento         | Configurar uma variante visual de ordem da galeria                                                | Configuração e estado conferidos; hipótese e critérios registrados                 | Configurado e incluído no envio; verificações automáticas do Google em andamento |

## 1. Galeria e vídeo

Prioridade de mensagem: apresentar o negócio com catálogo próprio; acompanhar orçamento, encomenda e agenda; conhecer entradas, despesas e valores a receber; calcular preços com custos. As telas devem representar recursos existentes. Recursos dos planos Essencial e Profissional não devem ser apresentados como gratuitos.

Manter pelo menos quatro imagens de telefone em 1080 × 1920 px. Usar texto curto e interface legível. Conferir o vídeo já cadastrado (`https://youtu.be/2Zo-BacemKc`), principalmente os primeiros dez segundos. Arquivos e ordem efetivamente enviados serão registrados abaixo.

## 2. Versão Android

Pacote 1.2.2 (31) já disponível no teste interno. Produção atual: 1.2.1 (30). O lançamento deve preservar a validação prevista: instalação, login Google, primeiro produto ou venda e retorno ao app. Testes unitários e PWA não substituem teste Android.

O pacote contém mapa R8 e redução de código; o metadado `r8.json` informa `isOptimizationsEnabled: false`. A Console foi conferida diretamente nesta execução: **otimização de código DEX “Alta”, 95% de ofuscação, R8 em modo completo**, DEX descompactado de 19,3 MB e compatibilidade com páginas de memória de 16 KB. As porcentagens de otimização e redução aparecem como `-`; portanto, não afirmar que todas as otimizações estão habilitadas. O percentual de ofuscação da versão 31 supera o limite de 25% que gerou o aviso da versão 30. Isso não comprova estabilidade nem efeito causal sobre alcance.

O relatório de pré-lançamento está sem resultados: a página solicita upload de artefatos para gerar relatórios e sugere a faixa de teste fechado. Na versão 31, a Console exibe 0,00% da base instalada; não há evidência de teste completo em aparelho. Evidência técnica: `play-android31-dex.png`.

Foi usada a ação **Promover versão → Produção**, criando o rascunho da versão 31, faixa `4697296931800673416`, release `12`. A revisão informa **“Tudo pronto para o lançamento”** e estima instalação nova em **47 MB, 11,5 MB menor que a versão 30**. Pacote e notas já estão preenchidos. A página Produção confirma **“Versão de rascunho: 31 (1.2.2)”**; a versão pública continua sendo 30. Não houve envio desse rascunho à revisão nem liberação geral.

Pendência concreta: instalar o [teste interno](https://play.google.com/apps/internaltest/4701504234547381214) em Android e concluir login Google, primeiro produto ou venda, fechamento e reabertura. O ambiente desta execução não disponibiliza controle de um aparelho Android. Não é correto registrar esse teste como aprovado a partir dos testes de backend ou da PWA. Após a validação, retomar o release 12 já preparado. Evidências: `play-producao31-revisao.png` e `play-producao31-rascunho.png`.

**Tentativa de teste solicitada em seguida:** executado `adb devices -l`; a lista de dispositivos veio vazia. O inventário da ferramenta de interação também retornou `apps: []`, com apenas o navegador disponível, e o controle de aplicativos nativos está desativado nesta sessão. O AAB 31 permanece disponível localmente. Nenhum fluxo Android foi marcado como aprovado e nenhuma liberação de produção foi realizada nessa tentativa.

[Teste interno](https://play.google.com/apps/internaltest/4701504234547381214).

## 3. Páginas por público

Usar segmentação por URL para campanhas, mantendo a página padrão para descoberta geral. Proposta:

- `confeitaria`: catálogo de doces, custos de ingredientes, orçamentos e encomendas.
- `artesanato`: catálogo de peças, custos de materiais, pedidos e recebimentos.
- `servicos`: apresentação de serviços, orçamentos, agenda e controle financeiro.

Não anunciar funções setoriais específicas que o app não possui. Categoria, suporte e política de privacidade permanecem compartilhados pela Play. Registrar os links finais após salvar cada página.

### Ampliação solicitada em 28/09/2026

As três páginas iniciais são recortes de campanha, não o limite de atuação do Lucro Caseiro. A página padrão continua descrevendo o produto para quem produz, vende ou presta serviços. Cinco novas páginas foram preparadas em [paginas-por-publico-novas.json](paginas-por-publico-novas.json): alimentação, beleza, costura, papelaria e comércio/revenda. Cada uma tem nome interno, título, descrição curta, introdução e parâmetro de URL próprios. Os textos devem ser seguidos pelo conteúdo comum da descrição completa, a partir de “CATÁLOGO ONLINE COM A SUA MARCA”, conforme [play-listing-diferenciais.json](play-listing-diferenciais.json), que explica os limites dos planos.

**Execução:** as cinco páginas foram criadas na Play Console da ORIONSEVEN duplicando os recursos visuais da ficha padrão. Cada uma recebeu título, descrições e parâmetro de URL próprios. Foram configuradas para 100% de quem acessar o link específico, sem data de término. A Console confirmou a criação e exibiu todas como **Pronta para revisão**. Os IDs e links estão em [paginas-por-publico-novas.json](paginas-por-publico-novas.json).

Na Visão geral da publicação, foram enviadas **8 mudanças para revisão**: os cinco idiomas pt-BR das novas páginas e três ajustes automáticos de prioridade das páginas existentes (Serviços para a posição 6, Artesanato para a 7 e Confeitaria para a 8). A Console mostrou **Alterações em análise** e verificações rápidas ainda em andamento. Publicação gerenciada permanece desativada. Os links novos não devem ser divulgados até que cada página apareça como **No ar**; a aprovação e a disponibilização dependem do Google.

## 4. Experimento de primeira imagem

Hipótese: destacar o catálogo e a gestão do negócio na abertura aumenta a conversão em comparação com uma abertura centrada em precificação. O fator testado é a ordem da galeria: mover a captura existente de precificação para a primeira posição. Manter os mesmos sete arquivos, descrições, ícone, vídeo e capturas de tablet. Uma única variante; divisão equilibrada entre controle e variante.

Usar a métrica de conversão oferecida pela Console e o intervalo de confiança do experimento. Registrar amostra e estimativa de duração. Com o tráfego atual baixo, não escolher vencedor por poucos cliques nem por uma semana isolada. A página usada precisa estar publicada para iniciar o experimento; caso haja revisão pendente, registrar essa dependência explicitamente.

## Registro de execução

### Galeria salva

Nova ordem: catálogo → orçamentos → agenda → financeiro → insights → precificação → apresentação do negócio. As quatro imagens anteriores foram preservadas; foram acrescentadas duas artes de divulgação existentes e uma composição de orçamentos baseada na captura real do ambiente local de validação. A composição de orçamentos foi editada com IA e revisada visualmente, sem inventar valores ou controles.

- Orçamentos: `galeria/02-orcamentos.png`, 941 × 1672 px, aceita pela Console.
- O rótulo individual de recurso criado/editado com IA foi marcado para `02-orcamentos.png` e enviado pela ação “Rotular recursos e enviar”.
- Agenda e insights: `imagens/play-store-customizadas-2026-07-23/celular/04-agenda.png` e `08-insights.png`, 1080 × 1920 px.
- Seis das sete imagens são 1080 × 1920 px; o mínimo de quatro imagens nessa resolução continua atendido. As capturas antigas refletem a aparência das versões em que foram produzidas; não são uma comprovação visual da versão 31.
- Vídeo existente mantido: 27 segundos, não listado no YouTube, demonstração de vendas aos 5–7 s, precificação aos 15 s e financeiro/insights/exportações aos 20 s. Textos na tela permitem entender os benefícios sem áudio. Monetização e restrição etária não foram alteradas.

### Páginas personalizadas salvas

A ficha padrão e as três páginas foram enviadas juntas: a Console confirmou **“Alterações em análise”**. Publicação gerenciada desativada; a aprovação do Google ainda é necessária. Evidência: `play-quatro-alteracoes-em-analise.png`.

Segmentação por URL, 100% de quem acessa o link específico, sem prazo final. Os textos mantêm a distinção entre os planos Gratuito, Essencial e Profissional. Títulos, descrições curtas e introduções reproduzíveis em [paginas-por-publico.json](paginas-por-publico.json); o restante da descrição vem de `play-listing-diferenciais.json`, a partir de “CATÁLOGO ONLINE”.

Também foram gerados [nove links com atribuição por canal](links-paginas-por-publico.json): Instagram, WhatsApp e parcerias para cada público. Cada URL inclui `listing`, UTMs e `referrer` codificado, compatível com a atribuição Android implementada na versão 31. Usar após a aprovação da respectiva página. Nenhuma publicação social nem campanha paga foi disparada nesta etapa.

| Página                              | ID na Console         | Link de campanha                                                                                                |
| ----------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------- |
| Confeitaria — catálogo e encomendas | `4834732201876318446` | [Confeitaria](https://play.google.com/store/apps/details?id=br.com.orionseven.lucrocaseiro&listing=confeitaria) |
| Artesanato — catálogo e pedidos     | `4833772269663446434` | [Artesanato](https://play.google.com/store/apps/details?id=br.com.orionseven.lucrocaseiro&listing=artesanato)   |
| Serviços — orçamentos e agenda      | `4832387547479392411` | [Serviços](https://play.google.com/store/apps/details?id=br.com.orionseven.lucrocaseiro&listing=servicos)       |

### Experimento configurado e enviado

- ID: `8827334115993712664`.
- Nome: “Abertura: catálogo ou precificação — set 2026”.
- Experimento gráfico no idioma padrão; uma variante “Precificação na primeira imagem”.
- Distribuição: 50% controle, 50% variante.
- Métrica: cliques de instalação de usuários únicos.
- Confiança: 90%; efeito mínimo detectável: 5,0%.
- Estimativa exibida: **11.768 cliques de instalação de usuários únicos**; duração não estimada (`-`).
- Os sete arquivos da galeria atual e os quatro de cada tamanho de tablet foram importados. Apenas a ordem de abertura muda.
- O experimento foi primeiro salvo em rascunho. Como a Console permitiu sua inclusão com a nova ficha, a configuração foi concluída e o envio solicitado em seguida: a visão geral mostrou **“Iniciar experimento (Abertura: catálogo ou precificação — set 2026)”**. Foi confirmada a reinicialização da análise para reunir o experimento às quatro alterações anteriores.
- **O envio não comprova experimento ativo.** O início depende da aprovação do Google. O volume atual não sustenta uma conclusão rápida: não há vencedor nem ganho medido. Não alterar a ficha durante a coleta; avaliar estimativa de amostra e intervalo de confiança antes de adotar a variante.

### Estado final conferido

A visão geral mostra as **cinco alterações** no bloco “Alterações em análise”: galeria padrão, início do experimento e as três páginas por público. A Console está executando verificações automáticas e informa que encaminhará as mudanças à revisão ao terminá-las. A última indicação foi “até 13 minutos”; isso é uma estimativa da verificação automática, não prazo de aprovação. Evidência: [painel final](play-alcance-cinco-alteracoes.png).

O rascunho Android 31 não está nesse envio. Portanto, a execução operacional da loja foi realizada, mas **a promoção pública da versão 31 ainda não foi concluída**. Ela depende da validação Android descrita acima. O experimento também ainda não pode ser apresentado como ativo nem como resultado de aumento de alcance.

Verificação local: títulos e descrições dentro dos limites da Console; nove links com destino `play.google.com`, parâmetro `listing` e atribuição `referrer` conferidos; `git diff --check` sem erros nos documentos alterados. Nenhuma alteração adicional de código do aplicativo nesta etapa.

## Acompanhamento

**Teste Android retomado em 28/09:** o controle do emulador ficou disponível por outra ferramenta instalada. O conteúdo release 31 foi instalado e os testes de abertura, navegação inicial e retorno passaram. Os resultados e limites estão no [registro de testes Android](testes-android/README.md). A versão 32 está em compilação no EAS para validar o novo ícone; nenhuma versão nova foi enviada à Play nesta etapa.

### Correção do ícone de notificação

Após a captura enviada pela usuária, foi confirmado que o ícone de notificação ainda apontava para a casinha, enquanto o ícone principal já usava o L. A versão escolhida mantém o **L com o ponto da marca**, em branco sobre transparência. As propostas raster com bordas irregulares foram descartadas; a versão aplicada tem matriz vetorial limpa.

- Recurso da marca: `packages/brands/lucro-caseiro/assets/notification-icon.png`, com matriz `.svg` ao lado.
- O resolvedor de marca do `app.config.ts` já seleciona esse recurso. O caminho estático no `app.json` foi alinhado, inclusive a cor `#B65F72`.
- Verificado: PNG 96 × 96, canal alfa, todos os pixels visíveis brancos e geração das cinco densidades pelo próprio plugin Android do Expo. Evidência: `verificacao-icone-notificacao.json`.
- [Prévia em tamanho pequeno](previa-icone-notificacao-l.png): simulação, não captura de notificação do aparelho.
- O emulador `lucro_e2e` foi aberto e usado nos testes de execução da versão 31. A nova notificação depende da versão 32.
- **Próximo binário: 32 (1.2.2).** O código de versão foi avançado porque o AAB 31 já existe na Play e não pode ser substituído. O AAB 31 e seu rascunho de produção ainda contêm a casinha. A compilação EAS `ecdbc833-be2a-477d-9717-35d0aae1a21f` foi iniciada para incorporar a correção; é necessário instalar e verificar uma nova notificação antes de promover a versão pública.

Comparar períodos completos de 14 e 28 dias, mesmos país e origem, anotando mudanças de versão e divulgação. Separar visitantes da ficha, cliques em instalar, instalações, cadastros válidos, primeira ação e retorno D1/D7. Páginas específicas ajudam a adequar a mensagem e medir campanhas; não criam tráfego por si só.

## Referências oficiais

- [Recursos gráficos e vídeo](https://support.google.com/googleplay/android-developer/answer/9866151?hl=pt-BR).
- [Páginas personalizadas](https://support.google.com/googleplay/android-developer/answer/9867158?hl=pt-BR).
- [Experimentos de ficha](https://support.google.com/googleplay/android-developer/answer/12053285?hl=pt-BR).
- [Testes internos](https://support.google.com/googleplay/android-developer/answer/9845334?hl=pt-BR).
- [Otimização de código Android](https://developer.android.com/topic/performance/issues/code-optimization).
- [Declaração de recursos editados com IA](https://support.google.com/googleplay/android-developer/answer/17262077?hl=pt-BR).
