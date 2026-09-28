# Testes das alterações de aquisição e do ícone Android

Data: 28/09/2026. Escopo confirmado pela usuária: alterações desta tarefa e verificações de execução necessárias à otimização Android; não uma revisão manual geral do aplicativo.

## Ambiente e limites

- Emulador `lucro_e2e`, Android 35, `emulator-5554`.
- A instalação anterior era 26 (1.2.0), de desenvolvimento. Foi atualizada, preservando os dados, para o conteúdo do AAB 31 (1.2.2).
- O APK de teste foi gerado com Bundletool 1.18.3 a partir do AAB 31 e assinado com a chave local de desenvolvimento para permitir a atualização da instalação existente. O código permanece compilado para produção, com R8; `dumpsys package` confirma ausência da flag `DEBUGGABLE`.
- Esta instalação por ADB **não valida assinatura da Play, compras/restauração nem Install Referrer de uma instalação pela loja**.
- A versão 32 está sendo compilada no EAS para incorporar o ícone L. Até sua instalação e teste, as capturas da versão 31 não comprovam o novo ícone.

## Resultado obtido

| Verificação                                                               | Resultado                            | Evidência / limite                                                                                                                                                       |
| ------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Suíte automatizada mobile                                                 | 865 testes aprovados em 137 arquivos | Executada novamente às 11h28 de Brasília                                                                                                                                 |
| Regressões da API: cadastro, atribuição, aquisição, relatório e migrações | 20 testes aprovados em 5 arquivos    | Executada novamente às 11h29; banco isolado dos testes                                                                                                                   |
| Abertura da versão com R8                                                 | Aprovada no emulador                 | `01-abertura-31.png`                                                                                                                                                     |
| Entrada na precificação, digitação de custo e avanço à segunda etapa      | Aprovada                             | `release-smoke.xml`; `screenshots/02-primeira-acao-31.png`. Não foi salvo cálculo nem produto                                                                            |
| Fechamento e reabertura com sessão preservada                             | Aprovada                             | `screenshots/03-retorno-31.png`                                                                                                                                          |
| Nova tela de escolha de primeira tarefa                                   | Aprovada visualmente                 | `screenshots/04-onboarding-31.png`                                                                                                                                       |
| Acesso opcional à configuração do perfil                                  | Aprovado                             | `screenshots/05-perfil-opcional-31.png`; nenhum perfil de negócio foi editado                                                                                            |
| “Registrar minha primeira venda” sem exigir perfil                        | Aprovado                             | `onboarding-release.xml`; `screenshots/06-primeira-venda-31.png` mostra a tela “Para quem é a venda?”. Nenhuma venda foi salva                                           |
| Conclusão do primeiro uso preservada ao reabrir                           | Aprovada                             | `screenshots/07-primeiro-uso-preservado-31.png`                                                                                                                          |
| Tela de cadastro e botão de cadastro Google                               | Aprovados visualmente                | `screenshots/08-cadastro-31.png`. Não foi criada uma conta nova                                                                                                          |
| Abertura do login Google                                                  | Aprovada até a autenticação externa  | Abriu `accounts.google.com` com a identidade Lucro Caseiro. Retorno OAuth ainda pendente de entrada manual                                                               |
| Login por e-mail                                                          | Pendente                             | `E2E_PASSWORD` está vazio no arquivo local de testes; o fluxo não foi executado com credenciais                                                                          |
| Recebimento de dados de aquisição no backend                              | Confirmado                           | Consulta somente leitura em `aquisicao-emulador.json`: uma instalação Android 31, abertura atualizada e eventos de navegação; sem campanha nesta instalação fora da Play |
| Ícone branco com transparência e densidades Android                       | Aprovado no recurso e no plugin Expo | `../verificacao-icone-notificacao.json`                                                                                                                                  |
| Nova notificação com L na versão 32                                       | Pendente                             | Depende da compilação/instalação 32 e de notificação emitida por essa versão                                                                                             |
| Origem de campanha recebida pela Play                                     | Pendente                             | Exige instalação pela loja com link identificado                                                                                                                         |

O primeiro uso foi aberto por deep link na conta já existente, que ainda não tinha o novo registro de perfil. Isso permite verificar a tela e o encaminhamento, mas não representa um cadastro novo completo com confirmação de e-mail. O botão testado registrou a conclusão do onboarding pelo próprio aplicativo.

Os roteiros de teste foram ajustados após duas falhas do executor: centralizar o campo que estava abaixo da área visível e aguardar a inicialização da sessão antes de abrir o deep link. As execuções seguintes passaram; esses ajustes não alteraram código do app.

## Próxima compilação

Os testes no emulador foram interrompidos a pedido da usuária para aguardar as alterações do Claude. O snapshot 32 foi iniciado antes dessa integração; os resultados acima documentam a versão 31 e não validam a versão final integrada. A nova rodada no Android continua pendente do aviso da usuária.

- EAS: [32 (1.2.2)](https://expo.dev/accounts/marivscls/projects/lucro-caseiro/builds/ecdbc833-be2a-477d-9717-35d0aae1a21f).
- ID: `ecdbc833-be2a-477d-9717-35d0aae1a21f`.
- Origem: snapshot `tmp/release-20260928-32`, derivado da entrega 31, com os arquivos do ícone e a configuração atualizada.
- A geração do binário não envia uma versão à Google Play. A publicação continua pendente da validação.

Os YAMLs nesta pasta são registros da sessão. O roteiro de primeiro uso depende de uma conta sem registro de perfil; não deve ser repetido esperando a mesma tela depois de concluir o onboarding.
