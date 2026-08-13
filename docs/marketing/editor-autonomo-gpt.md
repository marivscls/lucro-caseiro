# Editor Autônomo GPT — Selenita e Central de Marketing

## Objetivo

Transformar gravações brutas em vídeos publicáveis por meio de um editor audiovisual
autônomo operado pela Selenita. O GPT assume responsabilidade editorial real: entende a
campanha, analisa fala e imagem, escolhe takes, constrói a narrativa, renderiza, critica o
próprio resultado e corrige problemas antes de apresentar um preview.

O fluxo não é apenas um removedor de silêncios. A experiência desejada é equivalente a
entregar os materiais e um briefing a uma pessoa editora, mantendo a aprovação final com a
usuária.

## Origem e adaptação

O tutorial analisado apresenta a skill open source `browser-use/video-use`, instalada no
Claude Code. Ela usa a transcrição como mapa do vídeo, identifica erros e tentativas,
propõe alternativas de corte, espera a escolha da usuária, renderiza com FFmpeg e pode
adicionar legendas.

Na Central, o Claude é substituído por GPT. O modelo não processa o MP4 sozinho: recebe
transcrição por palavra, eventos de áudio, metadados e amostras visuais, toma decisões
editoriais e chama ferramentas controladas pelo backend.

## Princípios

1. **Autonomia editorial:** a usuária informa o resultado desejado; o GPT decide a montagem.
2. **Contexto antes de perguntas:** campanha, público, canal, CTA, marca e restrições já
   persistidos não devem ser perguntados novamente.
3. **Fontes intactas:** arquivos originais nunca são sobrescritos.
4. **Decisões reversíveis:** transcrição, plano, renders e revisões ficam versionados.
5. **Preview antes de publicar:** o GPT pode iterar sozinho, mas publicação exige confirmação.
6. **Custo limitado:** no máximo três ciclos automáticos de crítica e novo render.
7. **Honestidade:** materiais ausentes, falhas de infraestrutura e trechos ambíguos devem ser
   explicitados; o sistema não inventa interface, prova, fala ou footage.
8. **Segurança:** credenciais permanecem no servidor e o render só opera arquivos pertencentes
   à usuária autenticada.

## Escopo editorial

O editor pode decidir:

- melhores takes e trechos;
- remoção de falsos começos, repetições, vícios de linguagem e pausas improdutivas;
- preservação de risadas, reações, ênfases e pausas com função narrativa;
- ordem das falas, gancho, desenvolvimento, prova, CTA e duração;
- ritmo, jump cuts, margens de corte e reenquadramento para o canal;
- legendas, destaques de palavras e áreas seguras;
- B-roll fornecido ou gravações reais de interface autorizadas;
- zooms e cortes de cobertura para reduzir descontinuidades;
- trilha autorizada, redução de ruído, níveis e fades;
- correção de cor e consistência entre takes;
- cartelas e elementos da identidade oficial do Lucro Caseiro;
- versões derivadas para Reels, TikTok, Stories e YouTube.

O MVP prioriza talking heads, aulas, podcasts, tutoriais e demonstrações faladas. Montagem
musical, videoclipe, fashion film e narrativa guiada principalmente por movimento visual
exigem análise visual mais densa e permanecem marcadas como capacidade avançada.

## Fluxo da usuária

1. Abre **Produzir → Editor Autônomo** ou transforma uma resposta da Selenita em edição.
2. Seleciona campanha/conteúdo, canal e envia um ou mais vídeos.
3. Escreve uma missão curta, por exemplo:
   “Transforme estas gravações em um Reel de venda. Preserve o tom espontâneo, demonstre o
   produto e use o CTA da campanha.”
4. Inicia a edição.
5. A Central mostra progresso persistido: upload, transcrição, análise, montagem, render e
   revisão.
6. O GPT produz e revisa o preview autonomamente.
7. A usuária assiste, aprova ou envia um refinamento em linguagem natural.
8. Ao aprovar, a versão final vira recurso de conteúdo rastreável e retorna à fila Hoje.

## Pipeline técnico

```text
assets originais
  → inventário por FFprobe
  → transcrição com timestamps por palavra
  → detecção de silêncios e eventos de áudio
  → amostras visuais nos pontos relevantes
  → plano editorial estruturado (EDL)
  → render de preview com FFmpeg
  → legendas JSON compatíveis com Remotion
  → autocrítica multimodal
  → correção e novo render (máximo 3)
  → preview para aprovação
  → render final e publicação na Central
```

## Papel do GPT

O GPT recebe um contrato de saída estruturado e opera as seguintes ferramentas conceituais:

- `inspect_assets`: dimensões, duração, codecs, áudio e orientação;
- `transcribe_assets`: palavras, tempos, confiança, speakers e eventos;
- `sample_visuals`: quadros e tiras ao redor de momentos selecionados;
- `create_edit_plan`: estratégia e EDL;
- `render_preview`: montagem em resolução de revisão;
- `inspect_preview`: início, fim, pontos médios e fronteiras de corte;
- `revise_edit_plan`: correção de problemas objetivos;
- `render_final`: render de publicação;
- `publish_video`: criação do recurso de conteúdo após aprovação.

O modelo nunca recebe acesso irrestrito ao sistema operacional. Cada ferramenta valida a
propriedade do job e dos arquivos antes de executar.

## Plano editorial estruturado

Cada plano contém:

- resumo e justificativa editorial;
- duração e proporção de destino;
- segmentos com asset, início, fim, função narrativa e motivo da escolha;
- transições e tratamento de áudio;
- legendas no formato `Caption` (`text`, `startMs`, `endMs`, `timestampMs`, `confidence`);
- overlays, B-roll e cartelas autorizados;
- instruções de cor e mixagem;
- checklist de qualidade;
- avisos e limitações.

Nenhum corte pode ocorrer dentro de uma palavra. As bordas usam uma margem pequena e fades
de áudio para evitar cortes secos ou estalos.

## Autocrítica

Depois de cada preview, o editor verifica:

- palavras cortadas ou áudio com estalo;
- saltos visuais, flashes ou frames incorretos;
- clareza do gancho e da progressão narrativa;
- duração e enquadramento adequados ao canal;
- legibilidade e sincronização das legendas;
- sobreposição entre legendas, logo e grafismos;
- consistência de volume e cor;
- uso correto da logo, tipografia e paleta oficiais;
- alegações não sustentadas ou interfaces inventadas;
- aproveitamento de um take melhor disponível nas fontes.

Falhas corrigíveis geram novo plano e novo preview. Após três ciclos, pendências restantes
são apresentadas à usuária em vez de iniciar um loop ilimitado.

## Estados persistidos

```text
draft
→ uploaded
→ analyzing
→ strategy_ready
→ rendering
→ self_review
→ ready_for_review
→ approved
→ completed
```

Estados alternativos: `needs_input`, `failed`, `cancelled`.

## Integração com a Central

- **Produzir:** novo card “Editor Autônomo”.
- **Selenita:** nova ação confirmável “Editar vídeo”.
- **Campanhas e Posts:** o job pode guardar `sourceCampaignId` e `sourceContentId`.
- **Hoje:** jobs aguardando revisão ou com falha aparecem como próxima ação.
- **Calendário:** somente a versão aprovada pode ser agendada.
- **Biblioteca:** assets e decisões permanecem vinculados ao projeto; não viram conhecimento
  textual automaticamente.
- **Resultados:** conteúdo publicado preserva o ID do job e da versão final.

## Armazenamento e privacidade

- Bucket privado `marketing-video-editor`.
- Caminhos começam pelo ID da usuária e pelo ID do job.
- Upload direto autenticado para evitar trafegar arquivos grandes pelo processo da API.
- URLs assinadas e temporárias para preview e download.
- Chaves OpenAI e de outros fornecedores existem somente no ambiente da API.
- Arquivos temporários do worker são isolados por job e removidos após upload do resultado.

## Renderização

FFmpeg executa cortes, concatenação, áudio, reenquadramento e preview. Remotion é usado para
legendas e elementos editoriais parametrizados quando o projeto exigir acabamento de marca.
Legendas são sempre persistidas como JSON, separadas da mídia, e aplicadas por último para
que overlays não as escondam.

## Critérios de aceitação

- [x] Existe entrada visível em Produzir e na Selenita.
- [x] A usuária pode criar um job, subir vídeos e iniciar a edição.
- [x] O job persiste progresso, erros, plano, revisões e versões.
- [x] A análise devolve um plano editorial estruturado, não apenas texto livre.
- [x] O render usa somente segmentos autorizados do próprio job.
- [x] O sistema produz preview e executa autocrítica com limite de três ciclos.
- [x] A usuária pode pedir refinamento sem retranscrever os originais.
- [x] Aprovação cria um recurso de conteúdo rastreável.
- [x] Arquivos originais permanecem intactos.
- [x] Ausência de OpenAI, FFmpeg ou storage gera erro acionável sem falso sucesso.
- [x] Guardrails de corte, legendas, formatos e fila Hoje possuem testes determinísticos.

## Estado da implementação

Implementado em 12 de agosto de 2026: contratos compartilhados, três tabelas persistentes,
bucket privado com políticas por proprietária, API autenticada, worker recuperável após reinício,
transcrição por palavra, amostragem visual, EDL criada e revisada pelo GPT, corte e tratamento de
áudio com FFmpeg, legendas queimadas, preview, até três ciclos de autocrítica, refinamento em
linguagem natural, exportação final, histórico de versões, criação de Post rastreável e entrada na
fila Hoje quando a revisão humana é necessária.

Para ativar em um ambiente, execute a migration `055_autonomous_video_editor.sql`, configure
`OPENAI_API_KEY` e `SUPABASE_SERVICE_ROLE_KEY` e disponibilize `ffmpeg`/`ffprobe` nos caminhos
`VIDEO_EDITOR_FFMPEG_PATH` e `VIDEO_EDITOR_FFPROBE_PATH`. Na máquina usada para esta implementação,
os binários de FFmpeg não estavam instalados; por isso o render real com mídia não foi executado
nesta sessão.

## Fora de escopo inicial

- publicação automática em redes sociais;
- compra automática de música, stock footage ou créditos externos;
- clonagem de voz ou rosto;
- geração de depoimentos ou provas inexistentes;
- exclusão automática dos originais;
- colaboração simultânea em uma timeline tradicional.

## Referências

- Tutorial: `https://www.youtube.com/watch?v=jBn7zh9z_l0`
- Motor estudado: `https://github.com/browser-use/video-use`
- Estúdio atual: `apps/web/src/features/marketing/video-prompt-studio.tsx`
- Contrato atual: `packages/contracts/src/schemas/video-prompts.ts`
- Projeto Remotion existente: `apps/promo-video/`
