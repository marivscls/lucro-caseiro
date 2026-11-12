# Roteiros de animação: personagens e comida falando

**Status:** Pronto para produção e teste
**Versão:** 2.0
**Data:** 12 de novembro de 2026
**Campanha:** Preço certo. Venda pronta.

Este documento traz dois formatos de animação para testar ao lado da [apresentadora IA](roteiros-apresentadora-ia.md):

- **Série A, "Dona Cida e Bia":** pessoas animadas em 2D, em esquetes curtas de ficção.
- **Série B, "Comida falando":** doces e marmitas em 3D fofo que reclamam do preço que recebem.

Nos dois formatos, a animação faz o gancho e conta a história. **Quem resolve é sempre a tela real do app.**

## O que mudou na versão 2.0

- Todo roteiro abre com a dor já na tela no quadro 0, e a tela do app entra até o segundo 10.
- Cada vídeo trata de **uma dor só** e mostra **um recurso só**.
- O número importante é **visto na tela do app**, nunca falado. Assim a voz pode ser gravada antes da tela e nunca fica diferente da gravação.
- As duas personagens se ajudam: ora a Bia socorre a Dona Cida, ora o contrário. Nenhuma das duas é "a que não sabe".
- O último quadro repete o primeiro, para o vídeo emendar quando o aplicativo repete sozinho.
- As falas já estão escritas do jeito que a voz precisa (ver "Como ler as falas").

## A fórmula de cada vídeo

| Parte            | Quando      | O que acontece                                                                                 |
| ---------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| Gancho           | 0 a 2 s     | A situação aparece pronta: a mensagem da cliente, a conta nos dedos, a comida reclamando.      |
| Erro com carinho | 2 a 6 s     | A personagem resolve do jeito antigo. Quem vende se reconhece e ri, sem ser chamada de errada. |
| Virada           | 6 a 9 s     | Alguém pergunta pelo custo esquecido. Essa pergunta é a mensagem do vídeo.                     |
| Tela real        | até 10 s    | O app entra e fica de 8 a 10 s. O número aparece grande, com o selo "Exemplo".                 |
| Reação           | 3 a 4 s     | A personagem reage ao número. É a piada que faz a pessoa compartilhar.                         |
| Chamada          | últimos 3 s | "Calcule seu primeiro produto grátis", enquanto a cena volta ao primeiro quadro.               |

## Como ler as falas

- Cada fala tem até 15 palavras. Uma barra ( / ) separa duas falas da mesma personagem, gravadas separadas.
- Não há reticências, parênteses, "%" ou "R$". Número falado vem por extenso.
- Números da tela do app não são falados. A personagem reage ("Cada um custa isso tudo?") e o número aparece na gravação.
- Palavras que a voz erra têm troca de pronúncia em `vozes/vozes.json`, no projeto de animação. A legenda usa sempre a grafia certa.

## Por que animação de pessoas pode (e depoimento não)

Uma personagem desenhada é ficção evidente. Ninguém acha que a Dona Cida é uma cliente real. Por isso ela pode **viver** a situação e **usar** o app dentro da história.

Mesmo na ficção, valem os limites de [provas-e-alegacoes.md](provas-e-alegacoes.md), porque a peça é publicidade:

- **Sem resultado inventado:** nada de "meu lucro dobrou", "faturei X a mais" ou "economizei X horas". A personagem descobre um número na tela, mas não promete resultado.
- **Sem depoimento disfarçado:** a personagem não fala para a câmera como se fosse cliente real ("eu uso há 6 meses e recomendo").
- **Sem pessoa realista:** o estilo é claramente desenhado. Nada de humano fotorrealista, porque aí volta a valer o formato da apresentadora, com as regras dela.
- **Sem copiar estúdio:** o visual é próprio. Não usar nomes de filmes, estúdios ou personagens existentes nos prompts.
- **Palpite não é dado:** o preço que a personagem chuta ("sessenta reais") é fala de ficção e fica no caderninho dela. Nunca aparece na tela do app.

## Aviso obrigatório em toda peça

1. **Na tela, nos 3 primeiros segundos:**
   - Série A (2D feito em código, voz sintética): selo "Personagens fictícios · voz criada com IA".
   - Série B (3D gerado com IA): selo "Animação criada com IA · personagens fictícios".
2. **Na legenda do post:** a frase de aviso da série (ver cada série), sempre na última linha.
3. **Na plataforma:** ativar o rótulo nativo de conteúdo gerado por IA.
4. **Em anúncio pago:** os três itens acima, mais revisão contra as políticas de anúncio da plataforma.

## Regras de produção (iguais às da apresentadora)

- **Tela real:** toda demonstração é gravação de tela da versão publicada do app. Nunca gerar a tela do app com IA.
- **Valores:** use a [tabela de dados de gravação](roteiros-apresentadora-ia.md#dados-para-a-gravação-de-tela), com o selo "Exemplo" sempre que um valor aparecer.
- **Formato:** vertical 9:16, legenda queimada e app na tela até o segundo 10.
- **Final:** um único CTA, sempre "Calcule seu primeiro produto grátis".
- **Recursos:** só mostrar o que já está na Google Play. Os roteiros marcados com "depende do build" esperam a versão com o commit 6b7d1ddd.

---

# Série A: Dona Cida e Bia

**Aviso na legenda do post:** "Personagens fictícios com voz criada por inteligência artificial. As telas são do app real."

## As personagens (bíblia curta)

Mantenha as duas iguais em todos os episódios.

- **2D em código (versão oficial):** [Dona Cida](personagens/dona-cida-2d.png) · [Bia](personagens/bia-2d.png). Motor no projeto `lucro-caseiro-animacao`; produção pelo [prompt 2D em código](prompt-2d-em-codigo.md).
- 3D gerado com IA (referência alternativa): [Dona Cida](personagens/dona-cida-folha.png) · [Bia](personagens/bia-folha.png)

|         | Dona Cida                                                                                | Bia                                                                     |
| ------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Idade   | cerca de 58 anos                                                                         | cerca de 24 anos                                                        |
| Negócio | doces e bolos por encomenda, em casa                                                     | marmitas da semana, entregues pelo WhatsApp                             |
| Visual  | cabelo grisalho preso em coque, óculos de armação vermelha, avental amarelo com bolinhas | cabelo cacheado volumoso, bandana verde, camiseta lisa, fone no pescoço |
| Jeito   | calorosa, desconfiada de "aplicativo", fala com ditados                                  | rápida, ansiosa, faz conta de cabeça e erra                             |
| Bordão  | "Na minha época, preço era no olho."                                                     | "Calma que eu tô contando."                                             |
| Papel   | representa quem tem medo de tecnologia                                                   | representa quem tem pressa                                              |
| Voz     | Roberta (VoiceStudio)                                                                    | Jully (VoiceStudio)                                                     |

**A história das duas ao longo da série:** na A1 a Bia mostra o app para a Dona Cida. Na A2 é a Dona Cida quem socorre a Bia, já sem medo do celular. Nas A3 e A4 as duas usam o app juntas. Quem assiste em ordem vê a Dona Cida perder o medo, sem ninguém precisar dizer isso.

## A1: "Preço no olho"

**Duração:** cerca de 26 s · **Nicho:** confeitaria
**Dor:** dar o preço no chute e esquecer o ingrediente que subiu e a embalagem.
**Recurso:** passo **Produto e custos** e **Preço sugerido por unidade**.

| Tempo   | Imagem                                                                                                                                    | Fala                                                                                                     |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 0–2 s   | Dona Cida enrolando brigadeiro. O celular vibra com a mensagem grande: "Quanto o cento?". Selo de IA.                                     | Dona Cida: "Ih, deixa eu ver."                                                                           |
| 2–6 s   | Ela aperta os olhos para a bandeja e escreve "100 = 60" no caderninho.                                                                    | Dona Cida: "Na minha época, preço era no olho." / "Cem brigadeiros? Sessenta reais!"                     |
| 6–9 s   | Bia entra e põe na bancada a lata de leite condensado e a caixinha.                                                                       | Bia: "Cida, você colocou o leite condensado que subiu?" / "E a caixinha?"                                |
| 9–19 s  | Tela real: **Produto e custos** com ingredientes e embalagem; depois o custo e o **Preço sugerido por unidade**, grandes. Selo "Exemplo". | Bia: "Olha. Coloca o custo de cada coisa, e ele mostra o preço." / Dona Cida: "Cada um custa isso tudo?" |
| 19–23 s | Dona Cida de óculos na ponta do nariz. Risca o "100 = 60" do caderninho.                                                                  | Dona Cida: "Hum. O olho tava míope."                                                                     |
| 23–26 s | As duas. O celular vibra de novo com outra mensagem, igual ao primeiro quadro.                                                            | Bia: "Calcule seu primeiro produto grátis."                                                              |

**Tela a gravar:** brigadeiro gourmet da conta de exemplo, com "leite condensado" entre os ingredientes e "caixinha" na embalagem.
**Primeira linha do post:** "Quanto o cento?" e você responde no olho?

## A2: "Calma que eu tô contando"

**Duração:** cerca de 26 s · **Nicho:** marmitas
**Dor:** somar só a comida e deixar de fora o gás, a sacola e o próprio tempo.
**Recurso:** passo **Trabalho e despesas** (seu trabalho e despesas do mês).

| Tempo   | Imagem                                                                                                                | Fala                                                                                                    |
| ------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 0–2 s   | Bia diante de 20 marmitas em fila, contando nos dedos. Na tela: "Quanto custa UMA marmita?". Selo de IA.              | Bia: "Arroz, feijão, frango. Calma que eu tô contando."                                                 |
| 2–7 s   | A cada pergunta ela esbarra no objeto: o botijão, a pilha de sacolas, o relógio da parede. Os dedos acabam.           | Bia: "E o gás? E a sacola?" / "E a hora que eu passei no fogão?"                                        |
| 7–9 s   | Bia desaba na cadeira. Dona Cida entra, já com o celular na mão.                                                      | Bia: "Perdi a conta." / Dona Cida: "Menina, larga esses dedos."                                         |
| 9–19 s  | Tela real: **Trabalho e despesas** com o tempo do lote e as despesas do mês; depois o preço sugerido. Selo "Exemplo". | Dona Cida: "Aqui você põe o seu tempo e as contas do mês." / "E ele divide por marmita."                |
| 19–23 s | Bia olha para a Dona Cida, espantada. Dona Cida ajeita os óculos, toda orgulhosa.                                     | Bia: "Dona Cida ensinando aplicativo?" / Dona Cida: "Preço no olho era na minha época. A época passou." |
| 23–26 s | Bia volta para a fila de marmitas, agora com o celular na mão em vez dos dedos.                                       | Dona Cida: "Calcule seu primeiro produto grátis."                                                       |

**Tela a gravar:** marmita 500 g da conta de exemplo, com "Calcular pelo tempo" preenchido e as despesas do mês.
**Primeira linha do post:** Você conta o gás e a sua hora no preço da marmita?

## A3: "Faz um descontinho?"

**Duração:** cerca de 25 s · **Nicho:** confeitaria
**Dor:** dar desconto por simpatia, sem saber quanto sobra depois.
**Recurso:** **Simular outro preço**, na tela de resultado.

| Tempo   | Imagem                                                                                                           | Fala                                                                                               |
| ------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 0–2 s   | Mensagem grande no celular da Dona Cida: "Faz um descontinho?". Selo de IA.                                      | Dona Cida: "Ai, ela é tão boazinha."                                                               |
| 2–5 s   | Ela já digita "Claro! Vinte por cento pra você". Bia segura o dedo dela no ar.                                   | Bia: "Pera! Vê quanto sobra antes."                                                                |
| 5–15 s  | Tela real: resultado; depois **Simular outro preço** com o preço com desconto e o ganho mudando. Selo "Exemplo". | Bia: "Põe o preço com desconto, e ele mostra quanto sobra pra você." / Dona Cida: "Sobra só isso?" |
| 15–21 s | Dona Cida apaga a mensagem e digita de novo, decidida.                                                           | Dona Cida: "Te faço cinco por cento." / "E um brigadeiro de brinde."                               |
| 21–25 s | Bia levanta um brigadeiro e aponta para ele. O celular vibra de novo, igual ao primeiro quadro.                  | Bia: "O brinde também tem custo, Cida." / "Calcule seu primeiro produto grátis."                   |

**Cuidado:** os valores do desconto e do ganho são os da simulação gravada. O "vinte" e o "cinco por cento" são decisões da personagem, não recomendação de desconto.
**Tela a gravar:** resultado do brigadeiro gourmet e a simulação com o preço 20% menor.
**Primeira linha do post:** Antes de dar o descontinho, veja quanto sobra.

## A4: "E agora, onde eu anoto?"

**Duração:** cerca de 25 s · **Nicho:** marmitas · **Depende do build com "Cadastrar produto" após salvar.**
**Dor:** calcular o preço e depois ter de anotar e cadastrar tudo de novo.
**Recurso:** **Salvar cálculo** e **Cadastrar produto** com preço e custo já preenchidos.

| Tempo   | Imagem                                                                                                                        | Fala                                                                                               |
| ------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 0–2 s   | Bia com o celular para o alto, comemorando. A cozinha atrás dela está coberta de bilhetes colados. Selo de IA.                | Bia: "Calculei o preço da marmita fit!"                                                            |
| 2–6 s   | Ela procura onde anotar e cola um bilhete na testa da Dona Cida.                                                              | Bia: "E agora eu anoto onde? No caderno? Na planilha?" / Dona Cida: "Na minha testa não."          |
| 6–16 s  | Tela real: **Salvar cálculo** → "Cálculo salvo!" → **Cadastrar produto** → formulário com preço e custo preenchidos → salvar. | Bia: "Salvou o cálculo, já cadastra o produto." / "Preço e custo vão juntos, sem digitar de novo." |
| 16–21 s | Bia amassa o bilhete, joga de longe e acerta o lixo.                                                                          | Bia: "Cesta!" / Dona Cida: "Agora cata os outros."                                                 |
| 21–25 s | Bia catando bilhetes pela cozinha, com o celular para o alto de novo.                                                         | Dona Cida: "Calcule seu primeiro produto grátis."                                                  |

**Tela a gravar:** cálculo da marmita 500 g, do botão de salvar até o produto cadastrado.
**Primeira linha do post:** Calculou o preço. E agora, anota onde?

---

# Série B: Comida falando

**Aviso na legenda do post:** "Personagens fictícios, animação criada com inteligência artificial. As telas são do app real."

## Os personagens

Doces e pratos em 3D fofo, com olhos grandes e boca expressiva, no cenário de uma cozinha de casa. A voz é exagerada e indignada. O humor vem de a comida saber o próprio custo melhor do que quem vende.

Nesta série, a comida **fala direto com quem vende** ("Ei, você que me vende"). Em dois segundos, a pessoa que faz aquele produto sabe que o vídeo é para ela. O tom é de bronca carinhosa, nunca de "você faz tudo errado".

**Prompt-base de estilo:** personagem 3D fofo feito de [comida], olhos grandes e brilhantes, boca expressiva, textura apetitosa e realista da comida, em cima de uma bancada de cozinha brasileira de casa, luz quente, fundo desfocado, sem texto na imagem.

## B1: Brigadeiro indignado

**Duração:** cerca de 20 s · **Nicho:** confeitaria
**Dor:** vender no chute, sem somar tudo o que vai no doce.
**Recurso:** **Produto e custos** e preço sugerido.

| Tempo   | Imagem                                                                                                            | Fala                                                                                                |
| ------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 0–2 s   | Brigadeiro de braços cruzados na forminha, olhando para a câmera. Selo de IA.                                     | Brigadeiro: "Ei, você que me vende. Sabe quanto eu custo?"                                          |
| 2–7 s   | A cada item, o ingrediente cai na bancada atrás dele: lata, chocolate, granulado, forminha. Por último, a panela. | Brigadeiro: "Leite condensado, chocolate, granulado, forminha." / "E meia hora de braço na panela!" |
| 7–16 s  | Tela real: custos preenchidos e o preço sugerido, grande. Selo "Exemplo".                                         | Narração: "Coloca tudo no Lucro Caseiro e vê quanto ele vale de verdade."                           |
| 16–20 s | Brigadeiro põe óculos escuros. O texto do CTA entra ao lado dele.                                                 | Brigadeiro: "Agora sim. Me respeita." / Texto: "Calcule seu primeiro produto grátis."               |

**Primeira linha do post:** Seu brigadeiro quer ter uma conversinha com você.

## B2: Marmita e o gás

**Duração:** cerca de 20 s · **Nicho:** marmitas
**Dor:** as contas do mês (gás, luz) não entram no preço de cada marmita.
**Recurso:** **Despesas do mês** divididas pela produção.

| Tempo   | Imagem                                                                                     | Fala                                                                            |
| ------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| 0–2 s   | Marmita aberta, suando, ao lado do botijão. Selo de IA.                                    | Marmita: "Ninguém lembra do gás. Ninguém!"                                      |
| 2–6 s   | O botijão concorda com a cabeça, triste.                                                   | Botijão: "Eu queimo o dia inteiro e não entro no preço."                        |
| 6–15 s  | Tela real: **Despesas do mês** divididas pela produção e o preço sugerido. Selo "Exemplo". | Narração: "No Lucro Caseiro, as contas do mês entram no preço de cada marmita." |
| 15–18 s | Marmita e botijão batem as mãos. A lâmpada do teto pisca.                                  | Os dois: "Entramos!" / Lâmpada: "E eu?"                                         |
| 18–20 s | Os três olham para a câmera. Texto na tela.                                                | Texto: "Calcule seu primeiro produto grátis."                                   |

**Primeira linha do post:** O gás trabalha o dia inteiro. Ele entra no seu preço?

## B3: A caixinha esquecida

**Duração:** cerca de 18 s · **Nicho:** confeitaria ou artesanato
**Dor:** a embalagem fica de fora da conta.
**Recurso:** campo **Embalagem**.

| Tempo   | Imagem                                                             | Fala                                                                                          |
| ------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| 0–2 s   | Caixinha de presente com laço, sozinha num canto. Selo de IA.      | Caixinha: "Todo mundo elogia o bolo. E eu?"                                                   |
| 2–6 s   | O bolo de pote dá de ombros. A caixinha fica de boca aberta.       | Caixinha: "Eu também custo, tá?" / Bolo de pote: "Ela nem te colocou na conta."               |
| 6–14 s  | Tela real: campo **Embalagem** e o preço sugerido. Selo "Exemplo". | Narração: "A embalagem tem campo próprio, e o custo dela entra no preço."                     |
| 14–18 s | Caixinha fazendo pose, ajeitando o laço. Texto na tela.            | Caixinha: "Entrei na conta. Com laço e tudo." / Texto: "Calcule seu primeiro produto grátis." |

**Primeira linha do post:** A caixinha também custa. Ela está no seu preço?

## B4: O bolo de pote e o prejuízo

**Duração:** cerca de 20 s · **Nicho:** bolo de pote · **Depende do build com o preço mínimo no passo 3.**
**Dor:** não saber abaixo de qual preço a venda dá prejuízo.
**Recurso:** **Para não ter prejuízo**, no passo **Preço e resultado**.

| Tempo   | Imagem                                                                                          | Fala                                                                                      |
| ------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 0–2 s   | Bolo de pote tremendo numa vitrine. A plaquinha de preço dele está em branco. Selo de IA.       | Bolo de pote: "Por menos de quanto eu dou prejuízo?"                                      |
| 2–6 s   | Ele olha para os lados. Os outros doces da vitrine fazem que não sabem.                         | Bolo de pote: "Ninguém sabe? Nem ela?"                                                    |
| 6–15 s  | Tela real: passo **Preço e resultado** com "Para não ter prejuízo" em destaque. Selo "Exemplo". | Narração: "O Lucro Caseiro mostra o mínimo antes de você escolher quanto quer ganhar."    |
| 15–20 s | Bolo de pote aliviado, enxugando a testa. Texto na tela.                                        | Bolo de pote: "Ufa. Agora eu tenho piso." / Texto: "Calcule seu primeiro produto grátis." |

**Primeira linha do post:** Você sabe o preço mínimo do seu bolo de pote?

---

## Ordem de produção sugerida

1. **A1** (já em produção): apresenta as duas personagens e o bordão.
2. **B1**: mesmo tema da A1 em outro formato, para a primeira comparação justa.
3. **A2** e **B2**: custos esquecidos.
4. **A3**: desconto. É o roteiro com mais chance de ser compartilhado, porque toda vendedora já recebeu essa mensagem.
5. **B3**, e depois **A4** e **B4** quando o build estiver publicado.

## Teste entre formatos

Completa o teste do documento da [apresentadora IA](roteiros-apresentadora-ia.md#teste-contra-outros-formatos). Usar o mesmo tema nas variantes, para a comparação ser justa:

| Tema              | Apresentadora IA | Série A (pessoas) | Série B (comida) | Tela + voz real |
| ----------------- | ---------------- | ----------------- | ---------------- | --------------- |
| Preço no chute    | —                | A1                | B1               | sim             |
| Custos esquecidos | Roteiro 2        | A2                | B2               | sim             |
| Desconto          | Roteiro 6        | A3                | —                | sim             |
| Embalagem         | Roteiro 5        | A1                | B3               | sim             |

- **Métrica principal:** precificações concluídas atribuídas (`pricing_completed`). Com o build de 6b7d1ddd, olhar também `pricing_started` e `pricing_result_viewed`.
- **Métrica de alcance:** taxa de retenção nos 3 primeiros segundos. Serve para escolher o **gancho**, não o vencedor.
- **Métricas de proteção:** comentários negativos sobre IA e denúncias.
- **Janela:** 2 semanas por rodada. Não declarar vencedor por alcance ou curtidas (ver [experimentos-e-metricas.md](experimentos-e-metricas.md)).
- **Série:** se a Série A vencer, manter Dona Cida e Bia como personagens fixas. Personagem recorrente cria hábito de assistir.

## Checklist antes de publicar

- [ ] Selo de IA da série nos 3 primeiros segundos
- [ ] Rótulo de IA da plataforma ativado e aviso na última linha da legenda
- [ ] A dor aparece no quadro 0 e a tela do app entra até o segundo 10
- [ ] Uma dor e um recurso por vídeo
- [ ] Estilo claramente desenhado, sem humano fotorrealista
- [ ] Nenhum resultado inventado (lucro, faturamento, tempo economizado)
- [ ] Nenhuma fala de depoimento para a câmera
- [ ] Telas gravadas da versão publicada, nunca geradas por IA
- [ ] Nenhum número da tela do app é falado; valores na tela levam o selo "Exemplo"
- [ ] Recurso mostrado já está na Google Play
- [ ] Personagens iguais à folha de referência
- [ ] Um único CTA, e o último quadro emenda com o primeiro
