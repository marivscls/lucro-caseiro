# Prompt: esquete 2D em código (Dona Cida e Bia)

**Status:** Pronto para uso
**Data:** 12 de novembro de 2026
**Origem:** adaptado do prompt "Canal 3D em código" do Genie (farol-studio), trocando three.js por SVG no Remotion e incluindo as regras de marketing do Lucro Caseiro.
**Projeto de animação:** `C:\Users\maria\Documents\projects\lucro-caseiro-animacao` (motor das personagens em `src/engine/Personagem.tsx`)
**Folhas de referência:** [Dona Cida](personagens/dona-cida-2d.png) · [Bia](personagens/bia-2d.png)
**Roteiros:** [roteiros-animacao-personagens.md](roteiros-animacao-personagens.md), Série A

Cole o bloco abaixo numa sessão aberta na pasta do projeto de animação.

---

```text
<inputs>
Pergunte qual roteiro da Série A (A1 a A4) de docs/marketing/roteiros-animacao-personagens.md, no repositório lucro-caseiro, vamos produzir. Se eu pedir um novo, proponha 3 situações reais de quem vende (custo esquecido, desconto, cliente pedindo preço, cálculo que não vira produto), cada uma com o recurso do app que resolve, e deixe eu escolher. Leia antes docs/marketing/CONTEXT.md e provas-e-alegacoes.md.
</inputs>

<direction>
Um Short de 1080x1920 30 fps em 2D plano, construído inteiramente em código (SVG no Remotion). Sem imagem ou vídeo de IA e sem banco de imagens. A única imagem externa é a gravação de tela do app real.
- Personagens: Dona Cida e Bia, sempre pelo motor src/engine/Personagem.tsx (CIDA, BIA). Nunca redesenhar, mudar roupa, cor de pele, cabelo ou acessórios. Conferir contra as folhas de referência.
- Estilo: cores chapadas e quentes, contorno marrom-escuro #3a271d, sombra lateral simples, cabeça grande. Sem gradiente pesado, sem textura.
- Rosto: expressões pelas predefinições de EXPRS (feliz, desconfiada, surpresa, rindo, preocupada, confiante, ansiosa, sobrecarregada, animada, determinada). Para trocar de expressão, as sobrancelhas mudam primeiro e a boca acompanha 2 quadros depois. Piscar a cada 1,5–4 s.
- Fala: só a personagem que fala mexe a boca, pela intensidade da voz dentro dos tempos de cada palavra (aberta em A, redonda em O/U, fechada em M/B/P). Quem não fala fica com a boca parada.
- Cenário: a cozinha da Dona Cida é UM lugar montado uma vez (bancada, fogão, geladeira com ímãs, janela, prateleira com potes, mesa com bandeja). Todo plano é um enquadramento desse mesmo lugar, para nada mudar de posição entre cortes. A casa da Bia segue a mesma regra.
- Números são objetos: todo número dito aparece numa coisa real (celular, caderninho, etiqueta de preço, bandeja), nunca em rótulo solto.
- Tela do app: entra como gravação real dentro de um celular grande no quadro ou em tela cheia, com o selo "Exemplo" quando houver valores. Nunca desenhar ou simular a tela do app.
- Legenda: duas palavras por vez, Montserrat ExtraBold ~100 px, branca com contorno preto grosso, a 70% da altura, sem cobrir rostos.
- Vozes: VoiceStudio local (http://127.0.0.1:3900), uma voz por personagem e fixa entre episódios. Dona Cida: madura e calorosa. Bia: jovem e rápida. Os perfis escolhidos ficam em vozes/vozes.json do projeto de animação. Narração (quando houver) curta, sem dizer efeitos sonoros.
- Jeito de falar brasileiro: escrever como a personagem fala de verdade ("tô", "tá", "pra", "né", "minha filha", "Ih", "Hum"), com a pontuação guiando a entonação. Ponto final faz a voz descer e respirar, vírgula faz uma pausa curta, interrogação sobe no fim e exclamação dá ênfase. Nada de reticências (a voz trava), parênteses, siglas, %, R$ ou número em algarismo: tudo por extenso, como se fala ("sessenta reais", "cinco por cento"). Nenhuma grafia pode puxar sotaque de Portugal.
Proibido: personagem dizendo que é cliente real ou citando resultado próprio ("meu lucro dobrou", "faturei X"), qualquer número inventado na tela do app, setas e HUDs flutuantes, objeto que surge do nada (tudo é trazido, entregue ou desliza), plano parado sem movimento.
</direction>

<legal>
- Selo "Personagens fictícios · voz criada com IA" nos 3 primeiros segundos (a voz do VoiceStudio é sintética), com o rótulo de IA da plataforma ativado.
- Legenda do post: "Personagens fictícios com voz criada por inteligência artificial. As telas são do app real."
- Recurso mostrado precisa estar na versão publicada na Google Play.
- CTA único no fim: "Calcule seu primeiro produto grátis".
</legal>

<structure>
Duração de 25 a 35 s. Abrir já no conflito no quadro 0 (a mensagem da cliente, a conta nos dedos, o preço no olho). Escalar em 2 ou 3 falas, e a outra personagem traz a solução. A tela real do app resolve em 8 a 12 s. Fechar com a reação engraçada da personagem e o CTA.
Câmera em movimento quase sempre: aproximação lenta por padrão, afastamento para revelar, panorâmica entre as duas. A passagem entre planos é uma dissolução de 6 quadros ou um zoom que atravessa o celular e cai na tela do app. Corte seco só para a piada.
</structure>

<build>
1. Ferramentas: Node 20, Remotion (versão fixa no package.json), FFmpeg, faster-whisper (large-v3-turbo, int8 na CPU), fonte Montserrat, efeitos sonoros grátis (Pixabay/Mixkit): panela, colher, notificação de WhatsApp, pop, whoosh.
2. Roteiro e voz: me mostre as falas antes de gravar. Grave no VoiceStudio (abra o app se a API não responder) com POST /generate, profile_id da personagem, language "portuguese (brazil)" e num_step 32 (16 passos dá bugada). Cada fala com até 15 palavras por pedido; frase maior se divide na vírgula, e as partes se juntam com 300 ms de pausa entre frases e 120 ms na vírgula. Siga as regras da skill dublagem-voz-clonada: lint de texto antes, trocas de pronúncia só para a voz (a legenda fica com o texto certo), várias sementes por fala e conferência por whisper. Depois passe o detector-erros-voz e me mande os trechos suspeitos antes de montar. Nunca gravar voz junto com render ou outro whisper.
3. Tempo: faster-whisper com tempo por palavra na voz final, alinhado ao roteiro com difflib. Todo corte, expressão, gesto e efeito fica preso a uma palavra, nunca a um segundo fixo.
4. Motor: cada quadro é função pura do tempo (sem Date.now, aleatório só com semente). Cada plano é build(t) e reaproveita o cenário montado.
5. Animação: antecipação de 2–6 quadros, ação na palavra, 5–15% de passagem e acomodação. Nas pausas, respirar e piscar. Um objeto só se move quando uma mão o move.
6. Conferência: antes do render completo, um quadro parado por plano. Olhar cada um contra as folhas de referência (rosto, roupa, proporção).
7. Som: voz em -15 dB, um efeito por ação visível, ambiente da cozinha em -30 dB, música opcional em -24 dB abaixando sob as falas. Mixar em -14 LUFS. H.264 CRF 17, yuv420p, AAC 256k.
</build>

<gotchas>
IDs de clipPath precisam ser únicos por instância (useId), ou um rosto recorta o outro. Gravação de tela entra como vídeo do Remotion, com o volume zerado. Dissolução sobre rosto grande deixa um rosto fantasma, então um dos lados deve ser plano médio ou mais aberto. Renderize os quadros parados primeiro e refaça só os planos que mudaram.
</gotchas>

<start>
Pergunte qual roteiro (ou proponha 3), depois me mostre falas e decupagem antes de gerar voz.
</start>
```
