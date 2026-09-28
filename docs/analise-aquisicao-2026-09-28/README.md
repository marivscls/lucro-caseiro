# Investigação da queda de cadastros — 28/09/2026

Consulta de produção em 28/09/2026, por volta de 08h18 de São Paulo. Apenas consultas de leitura; nenhuma alteração no produto ou na base. Os arquivos deste diretório contêm resultados agregados, sem nomes, e-mails, identificadores de usuários ou credenciais.

Complementado com a Play Console autenticada na mesma manhã, após a usuária abrir a conta administradora.

## Conclusão com a Play Console

A onda de agosto teve forte participação da descoberta dentro da Play Store. No comparativo dos **dias 1 a 25** de cada mês, o canal **Navegação no Google Play** gerou 19 aquisições em agosto e 3 em setembro: **queda de 84,2%**. Esse canal respondeu por 16 das 20 aquisições perdidas na comparação, ou 80% da diferença total.

| Play Console, dias 1–25                 | Agosto | Setembro | Variação |
| --------------------------------------- | -----: | -------: | -------: |
| Impressões do dispositivo, soma diária  |    629 |      396 |   −37,0% |
| Aquisições de dispositivos, total       |     26 |        6 |   −76,9% |
| Aquisições por navegação no Google Play |     19 |        3 |   −84,2% |
| Aquisições pagas e diretas              |      6 |        2 |   −66,7% |
| Aquisições não atribuídas               |      1 |        1 |       0% |

O corte em 25/09 evita tratar como zero os dias 26 e 27, ainda ausentes na tabela de impressões consultada. Os números são somas das linhas diárias da tabela; o calendário é o apresentado pela Play Console e não foi realinhado individualmente com os horários do banco.

Entre 1 e 25, o banco registrou 16 contas novas sem administradores em agosto e 3 em setembro. Mais duas contas foram criadas em 26/09, elevando setembro a 5. As métricas da loja e as contas do banco medem etapas diferentes e não são a mesma população.

**Interpretação:** o volume de visualizações da ficha diminuiu, e a queda das aquisições foi ainda maior. Há evidência de perda antes do cadastro e de menor rendimento da aquisição na loja. A diferença entre as duas quedas justifica investigar a composição do público e a ficha do app, mas não fornece uma taxa oficial de conversão: as aquisições abrangem superfícies que não exigem abrir a ficha, e as impressões diárias podem contar o mesmo aparelho em mais de um dia.

Navegação/Explorar inclui páginas iniciais, sugestões, listas e buscas por categoria. “Pagas e diretas” também inclui referências e buscas pelo nome/marca do aplicativo; não prova que houve anúncio pago. A Play Console mostrou ainda 28 aquisições de usuários por Explorar nos últimos 90 dias, corroborando a existência desse canal, em uma unidade e janela distintas da tabela acima.

O relatório não mostra o motivo interno de mudanças de distribuição do Google. Não há evidência suficiente para afirmar promoção de lançamento, punição do algoritmo, perda de posição em um termo específico ou que a retenção causou a redução do alcance. A causa localizada é a perda de volume de aquisição, principalmente na descoberta orgânica da loja; o mecanismo que provocou essa perda permanece aberto.

Dados diários e links reproduzíveis: `play-console.json`.

## O que os dados já mostram

A queda é real. Ao comparar os dias 1 a 27 de cada mês, as contas novas fora da lista de administradores passaram de **16 em agosto para 5 em setembro: queda de 68,8%**. A chegada registrada de novas instalações Android também diminuiu: **44 para 16, queda de 63,6%**, retirando instalações vinculadas a administradores conhecidos.

Esses dados sustentam uma redução de aquisição registrada, confirmada pelo relatório independente da Play Console acima. Não excluem problemas adicionais em algum caminho de autenticação.

| Indicador                                                                     | Agosto, dias 1–27 | Setembro, dias 1–27 |
| ----------------------------------------------------------------------------- | ----------------: | ------------------: |
| Contas novas, sem administradores                                             |                16 |                   5 |
| Primeiras aberturas de instalações Android, sem administradores identificados |                44 |                  16 |
| Primeiras aberturas no navegador, sem administradores identificados           |               134 |                  16 |

“Instalação” é o identificador criado pelo aplicativo e observado pela API. Pode incluir reinstalação, troca/limpeza do armazenamento, desenvolvimento e testes anônimos. **Não equivale a pessoa única nem a download validado pela Play Store.** A remoção de administradores só elimina instalações que chegaram a se vincular a essas contas.

## Qual foi a onda de agosto

- Agosto completo: 17 contas novas sem administradores; julho completo: 16. Portanto, o salto mensal de contas genuinamente novas entre julho e agosto foi pequeno.
- Entre 8 e 16 de agosto houve 8 contas novas sem administradores, quase metade do mês. Esse agrupamento ajuda a explicar a sensação de uma onda.
- 16 das 17 contas novas de agosto tiveram Android como primeira plataforma identificada; uma teve navegador. Isso identifica a plataforma observada, não o canal de descoberta.
- 15 das 17 contas novas de agosto foram criadas pelo Google; duas por e-mail. Entrar pelo Google **não significa** ter encontrado o aplicativo na busca do Google.
- Setembro teve novas contas nos dias 7 (uma), 9 (duas) e 26 (duas). Houve 16 dias completos sem novas contas entre 10 e 25/09. O cadastro não ficou zerado durante o mês inteiro.

## Por que o painel e as contagens divergem

| Fonte                                                       | Julho completo | Agosto completo | Setembro até a consulta |
| ----------------------------------------------------------- | -------------: | --------------: | ----------------------: |
| Perfis criados em `public.users`, incluindo administradores |              9 |              25 |                       6 |
| Contas criadas em `auth.users`, incluindo administradores   |             17 |              18 |                       5 |
| Contas criadas em `auth.users`, sem administradores         |             16 |              17 |                       5 |

`public.users.created_at` mede criação do perfil da aplicação. O middleware pode criar esse perfil quando uma conta de autenticação já existente usa a API. Assim, 25 perfis em agosto não significam 25 pessoas que acabaram de criar uma conta. Contas excluídas não podem ser reconstruídas a partir das tabelas atuais, e não existe uma classificação completa de todas as contas de teste.

O evento `signup_completed` apareceu apenas três vezes em todo o histórico coletado. No código atual, ele é emitido em `apps/mobile/src/app/(auth)/register.tsx` no caminho de cadastro por e-mail; não há emissão correspondente no caminho do Google. A contagem de contas usa `auth.users.created_at`, não esse evento incompleto.

## Retorno dos usuários de agosto

Entre as 17 contas novas de agosto sem administradores:

- 10 possuem pelo menos um produto registrado;
- 6 possuem pelo menos uma venda registrada;
- 3 tiveram atividade autenticada registrada em setembro;
- nenhuma teve atividade autenticada registrada desde 21/09 até a consulta.

Produtos e vendas são o estado atual das tabelas, e não necessariamente criações dentro de agosto. “Atividade registrada em setembro” não é retenção D30: as datas de entrada e o tempo de acompanhamento variam. Ausência de evento não prova abandono. Mesmo assim, o baixo retorno observado merece investigação própria e não explica, sozinho, a origem da queda de novos cadastros.

## Atribuição e próximos pontos de investigação

Nenhuma das 423 instalações registradas possui `utm_source` ou `referrer` preenchido. O Google Analytics do site público só foi configurado em 10/09, conforme o registro em `docs/auditoria-landing-2026-09-10/IMPLEMENTACAO.md`. Ele não reconstrói a origem de agosto.

A usuária abriu a conta administradora e a origem foi consultada na Play Console. A maior perda foi localizada em Navegação no Google Play. Para investigar o mecanismo e orientar uma intervenção:

1. Comparar composição do público, termos e ficha do app entre os períodos, antes de alterar textos ou imagens.
2. Corrigir a medição de cadastro pelo Google e guardar atribuição quando disponível, para acompanhar o caminho até a ativação.
3. Investigar por que poucas contas novas de agosto voltaram em setembro; o dado de retenção é um problema separado da aquisição.
4. Verificar a conclusão da autenticação das duas contas de 26/09, que não têm vínculo de instalação na coleta, sem assumir que o login falhou.

A documentação atual do Google distingue métricas de intenção (cliques/CTR) das aquisições efetivas: [relatórios de desempenho da ficha](https://support.google.com/googleplay/android-developer/answer/9859173?hl=en) e [visão geral de crescimento](https://support.google.com/googleplay/android-developer/answer/16394358?hl=en).

**Confirmado:** houve mais aquisições por descoberta/navegação no Google Play em agosto. **Não confirmado:** uma promoção temporária pelo algoritmo, a motivação de alterações de ranking ou um erro de cadastro como causa principal da queda.

## Limites da verificação técnica

As cinco contas novas de setembro possuem confirmação e registro de login no Supabase. As duas criadas em 26/09 ainda não têm vínculo com uma instalação nos dados coletados, portanto não é possível confirmar que concluíram a entrada no aplicativo. Não foi criado usuário de teste nem executado cadastro completo nesta investigação.

O site público, a origem do aplicativo e o endpoint `/api/v1/health` da API responderam HTTP 200 em 28/09; a API informou `status: ok`. Isso confirma disponibilidade naquele momento, não o funcionamento completo de cadastro ou autenticação, nem disponibilidade histórica.

## Reprodução

Executar na raiz do projeto, com a Railway autenticada e vinculada ao projeto correto:

```powershell
node docs/analise-aquisicao-2026-09-28/consultar.cjs
```

O script lê a configuração do serviço `@lucro-caseiro/api` em memória, abre uma transação `READ ONLY` com limite de 20 segundos por consulta e salva `dados-agregados.json`. Não grava credenciais em arquivo. Cada nova execução substitui o retrato agregado deste diretório.

Datas de criação são agrupadas no fuso `America/Sao_Paulo`; os dias de atividade vêm da instrumentação do aplicativo, que usa UTC. A comparação principal exclui o dia 28/09, ainda incompleto.
