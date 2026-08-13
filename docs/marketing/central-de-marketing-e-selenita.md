# Central de Marketing e Selenita — simplificação operacional

## Objetivo

Transformar a capacidade já existente na Central em um ciclo operacional único e fácil de percorrer: decidir, produzir, aprovar, publicar e aprender. A simplificação deve reduzir a quantidade de destinos concorrentes sem remover os motores de campanhas, conteúdo, calendário, biblioteca, resultados ou governança já implementados.

## Diagnóstico confirmado

- A navegação mistura trabalho diário, cadastros e infraestrutura da IA em muitos destinos equivalentes.
- Temas existe como rota e recurso, mas não aparece na navegação principal.
- A assistente é apresentada como “Consultoria IA”, opera sempre em modo consultivo e não assume o nome Selenita.
- Uma resposta da IA só pode ser salva genericamente como documento ou ideia; não existe confirmação estruturada para criar campanha, briefing, item de calendário ou resultado.
- O Estúdio de Campanhas já cobre pesquisa, estratégia, copy, revisão e publicação, mas funciona como ferramenta isolada.
- A tela Hoje privilegia contagens e painéis, não a próxima decisão operacional.
- Documentos importados podem ser copiados para a base de conhecimento, mas edições posteriores não mantêm essa cópia sincronizada.
- O aprendizado classe A aplica feedback explícito. A classe B registra apenas um candidato em `shadow`, sem ciclo de promoção, e classes B/C ocupam espaço na experiência comum.
- O contexto em JSON é uma ferramenta técnica e não deve competir com os campos de uso cotidiano.

## Arquitetura de navegação

| Área       | Responsabilidade                   | Ferramentas existentes                                             |
| ---------- | ---------------------------------- | ------------------------------------------------------------------ |
| Hoje       | Fila priorizada de próximas ações  | conteúdo, campanhas e resultados pendentes                         |
| Produzir   | Criar, planejar e publicar         | Posts, Campanhas e Calendário                                      |
| Biblioteca | Manter contexto reutilizável       | Documentos, Públicos, Funcionalidades, Temas, Entrevistas e Canais |
| Resultados | Registrar sinais e decidir testes  | Resultados e aprendizados                                          |
| Selenita   | Operar todas as áreas por intenção | Conversas e ações confirmáveis                                     |

Treinamento e configurações da inteligência continuam acessíveis a partir da Selenita, mas deixam a navegação diária.

## Ciclo operacional esperado

1. A tela Hoje apresenta primeiro o que está atrasado, pronto para publicar ou ainda sem peça.
2. Produzir concentra o acesso a posts, campanhas e calendário sem duplicar esses motores.
3. A Selenita usa o contexto persistido e propõe um plano em conversa.
4. A usuária escolhe uma ação estruturada, revisa título, destino e data quando aplicável, e confirma.
5. O item criado volta para a fila Hoje e para a ferramenta especializada correspondente.
6. Depois da publicação, a fila pede o registro do resultado.
7. Feedback explícito e resultados alimentam as próximas decisões.

## Decisões de implementação

- Reagrupar a navegação sem apagar rotas ou dados existentes.
- Criar páginas-hub leves para Produzir e Biblioteca, reutilizando as telas atuais.
- Derivar a fila Hoje dos recursos persistidos, com ordenação determinística e cobertura testada.
- Priorizar campanhas ativas ainda sem conteúdo rastreado por `sourceCampaignId`.
- Usar o nome Selenita em toda a interface.
- Oferecer ações confirmáveis para campanha, briefing, calendário e resultado; nenhuma ação externa é executada só porque a IA a escreveu.
- Sincronizar cada documento com sua entrada `sourceType=document` na base da IA ao criar, editar e excluir.
- Manter aprendizado explícito, conhecimento e exemplos na superfície principal de configurações; esconder classes B/C, instruções e avaliações em ferramentas avançadas.
- Manter o editor JSON recolhido e identificado como configuração avançada.

## Critérios de aceitação

- [x] A navegação principal tem cinco destinos e funciona em desktop e mobile.
- [x] Produzir e Biblioteca expõem todas as rotas hoje existentes, incluindo Temas.
- [x] Hoje apresenta uma fila ordenada de ações, não um painel de contagens.
- [x] Campanhas ativas sem post aparecem antes das campanhas já atendidas.
- [x] O nome Selenita substitui “Consultoria IA” na experiência.
- [x] Respostas da Selenita podem criar campanha, briefing, calendário ou resultado somente após confirmação.
- [x] Criar e editar documento atualiza o conhecimento correspondente; excluir o desativa.
- [x] Classes B/C e ferramentas de prompt ficam fora da experiência comum.
- [x] JSON aparece apenas como configuração avançada recolhida.
- [x] Testes, typecheck e lint das áreas alteradas passam.

## Fora de escopo

- Publicação automática em redes sociais.
- Promoção automática de candidatos de prompt classe B.
- Novo agente, novo provedor de IA ou novo banco de dados.
- Remoção definitiva das rotas especializadas ou migração destrutiva de dados.
