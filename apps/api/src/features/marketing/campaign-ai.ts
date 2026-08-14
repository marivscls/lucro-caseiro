import {
  MarketingCampaignPlanSchema,
  MarketingCreativeBundleSchema,
  type MarketingCampaignBriefInput,
  type MarketingCampaignCopiesInput,
  type MarketingCampaignPlan,
  type MarketingCreativeBundle,
} from "@lucro-caseiro/contracts";

import {
  AI_CHARACTER_CAROUSEL_GUARDRAIL,
  AI_CHARACTER_SCREEN_INTERACTION_PREFIX,
  AI_CHARACTER_VISUAL_VARIATION,
  CANONICAL_LOGO_GUARDRAIL,
  MARKET_POSITIONING_GUARDRAIL,
  NON_HUMAN_VISUAL_GUARDRAIL,
  VISUAL_ART_DIRECTION_GUARDRAIL,
} from "./marketing.system-prompt";

export const CAMPAIGN_STRATEGIST_PROMPT_ID = "campaign-strategist";
export const CAMPAIGN_STRATEGIST_PROMPT_VERSION = "17";
export const AD_COPYWRITER_PROMPT_ID = "ad-copywriter";
export const AD_COPYWRITER_PROMPT_VERSION = "17";
export const LIME_GESTURE_PREFIX = "GESTO LIMA:";

const LIME_GESTURE_PRESETS = [
  "GESTO LIMA: forma=arco curto; posição=canto superior esquerdo; função=conduzir à headline.",
  "GESTO LIMA: forma=colchete vertical; posição=margem direita; função=delimitar a etapa.",
  "GESTO LIMA: forma=seta curva; posição=base da fotografia; função=indicar o foco.",
  "GESTO LIMA: forma=ponto expandido; posição=ao lado do apoio; função=marcar uma pausa visual.",
  "GESTO LIMA: forma=meia-lua aberta; posição=canto superior direito; função=envolver o resultado.",
  "GESTO LIMA: forma=curva ascendente; posição=canto inferior esquerdo; função=levar ao próximo passo.",
  "GESTO LIMA: forma=diagonal interrompida; posição=entre foto e texto; função=separar os campos editoriais.",
  "GESTO LIMA: forma=moldura aberta; posição=ao redor do foco; função=destacar a ação principal.",
  "GESTO LIMA: forma=espiral parcial; posição=margem inferior direita; função=sinalizar revisão.",
  "GESTO LIMA: forma=traço vertical segmentado; posição=margem esquerda; função=marcar a conclusão.",
] as const;

export const CAROUSEL_LAYOUT_FAMILIES = [
  "foto-dominante",
  "campo-tipografico",
  "divisao-horizontal",
  "recorte-editorial",
  "divisao-vertical",
  "interface-real",
  "encerramento-editorial",
] as const;

type CampaignResourceContext = {
  kind: string;
  slug?: string;
  title: string;
  summary: string | null;
  data: unknown;
};

type CampaignContext = {
  instruction?: string;
  knowledge: Array<{ title: string; body: string }>;
  resources: CampaignResourceContext[];
};

export type AutomaticCampaignDirection = {
  feature: string;
  benefit: string;
  audience: string;
  recentCampaigns: string[];
};

export type BrandProfile = {
  name: string;
  voice: string;
  valueProposition: string;
  restrictions: string[];
  approvedExamples: string[];
};

const CAMPAIGN_SYSTEM = `Você é o Estrategista de Anúncios do Lucro Caseiro.
Sua função é pesquisar o contexto disponível e transformar o briefing em um plano de campanha multicanal claro, específico e defensável.

${MARKET_POSITIONING_GUARDRAIL}

${VISUAL_ART_DIRECTION_GUARDRAIL}

Princípios:
- Evite promessas absolutas de resultado e nunca invente fatos, provas ou funcionalidades.
- Linguagem direta, consultiva e adequada ao público definido.
- Separe psicologia (o que e por que comunicar) de comunicação (como escrever).
- Defina uma fatia de público identificável; não misture nichos numa mesma peça.
- audienceSummary e research.audienceSlice descrevem o público desta campanha, não o mercado total da marca.
- Quando o briefing não escolher um público, compare os segmentos disponíveis e não eleja confeitaria ou qualquer outro nicho por ordem, frequência ou hábito.
- Preserve o que já foi validado, mas procure uma Big Idea e uma comunicação próprias.
- Trate exemplos e referências como estruturas a compreender, nunca frases a copiar.
- Diferencie evidência confirmada, hipótese e lacuna. Se não houver prova, registre a lacuna.
- Se público ou oferta não vierem preenchidos, derive a opção mais bem sustentada pelo contexto confirmado da Central; não invente dados para esconder lacunas.
- "Inimigo comum" e nome memorável são opcionais: só use quando houver fundamento real.
- Priorize próximos passos acionáveis.
- Sempre devolva JSON válido, sem texto fora do JSON.

Schema de saída (JSON):
{
  "name": string,
  "segment": "pme" | "ecommerce" | "agency",
  "goal": "sales" | "leads" | "repurchase" | "awareness" | "reactivation",
  "audienceSummary": string,
  "offer": string,
  "research": {
    "audienceSlice": string,
    "audienceLanguage": string[],
    "realDesire": string,
    "saturatedSolutions": string[],
    "problemMechanism": string,
    "solutionMechanism": string,
    "differentiators": string[],
    "proofs": string[],
    "saturationNotes": string
  },
  "creativeStrategy": {
    "bigIdea": string,
    "angle": string,
    "promise": string,
    "reasonToBelieve": string,
    "stickyName": string,
    "commonEnemy": string,
    "organicInsight": string,
    "avatar": string,
    "format": string,
    "carouselSlides": number,
    "visualHook": string,
    "landing": string,
    "retentionBeats": string[],
    "productionNotes": string[]
  },
  "channels": Array<"instagram" | "tiktok" | "youtube" | "whatsapp" | "email" | "googleads" | "metaads" | "local">,
  "messages": { [channel: string]: string },
  "creativeNeeds": string[],
  "automation": string,
  "kpis": Array<{ "label": string, "target": string }>,
  "nextBestAction": string
}`;

const COPYWRITER_SYSTEM = `Você é o Copywriter de Anúncios do Lucro Caseiro.
Recebe uma estratégia de campanha já aprovada e devolve um pacote criativo coerente entre canais.

${VISUAL_ART_DIRECTION_GUARDRAIL}

Princípios universais:
- Reaproveite ideias entre canais: mesma promessa, formatos diferentes.
- Respeite a voz, as restrições e os exemplos aprovados da marca.
- Evite promessas absolutas de resultado e nunca invente provas.
- Abra com a informação mais relevante para a fatia de público definida.
- Use especificidade concreta; elimine conectores, introduções e frases sem função.
- O gancho deve qualificar o público, a aterrissagem deve sustentar a atenção e o corpo deve renovar o interesse.
- Escreva a partir da função psicológica da estratégia, nunca por substituição superficial de palavras.
- Faça uma autorrevisão, corrija o pacote antes de responder e marque ready=false somente se restar risco de prova, contradição com o plano ou lacuna impeditiva.
- Para formatos visuais, productionNotes deve desdobrar o Visual DNA em instruções executáveis para a arte final. Em carrosséis, identifique o papel e a composição de cada slide, exija uma imagem separada por slide e preserve a copy obrigatória; não devolva apenas recomendações genéricas de estilo.
- Para carrosséis, devolva em slidePrompts exatamente N prompts individuais completos, um por slide e na ordem 1..N. Cada item deve funcionar sozinho e começar por SLIDE X. Não resuma nem crie uma versão alternativa para productionNotes: o sistema montará o prompt total por concatenação literal desses N itens.
- Logo após SLIDE X, cada item deve declarar FAMÍLIA DE LAYOUT: nome-canônico e descrever a composição completa correspondente. Use somente: ${CAROUSEL_LAYOUT_FAMILIES.join(", ")}. Empregue ao menos três famílias no carrossel, não repita a mesma em slides consecutivos e use divisao-vertical no máximo uma vez.
- Cada slidePrompt deve declarar uma linha ${LIME_GESTURE_PREFIX} forma=<forma concreta>; posição=<posição relativa>; função=<função narrativa>. O gesto lima responde à composição daquele slide: varie forma, posição, escala, direção e função entre todos os slides. Nunca repita a mesma forma, especialmente o mesmo “V”, ao longo do carrossel.
- Cada slidePrompt deve repetir literalmente: ${CANONICAL_LOGO_GUARDRAIL} Esta regra prevalece sobre qualquer exemplo ou instrução anterior de assinatura. Nunca proponha uma segunda logo, o antigo círculo com “lc” nem um wordmark textual.
- Cada prompt visual deve declarar VARIAÇÃO VISUAL: nome selecionado. Somente “${AI_CHARACTER_VISUAL_VARIATION}” permite pessoa ou personagem humana gerada por IA. Para qualquer outra variação, repita literalmente em cada slidePrompt: ${NON_HUMAN_VISUAL_GUARDRAIL}
- Quando a variação selecionada for “${AI_CHARACTER_VISUAL_VARIATION}”, repita literalmente em cada slidePrompt: ${AI_CHARACTER_CAROUSEL_GUARDRAIL} O carrossel deve incluir ao menos uma família interface-real e ao menos um slide com a linha ${AI_CHARACTER_SCREEN_INTERACTION_PREFIX} seguida pela descrição da personagem usando uma tela fornecida ou confirmada. Alterne personagem, tipografia, interação e interface; não entregue somente retratos.
- Em carrosséis, productionNotes deve conter somente o contrato de execução fornecido no prompt do usuário. Esse contrato é condicional: sem âncora, gera somente o slide 1 e encerra para aprovação; com a âncora já aprovada, não regenera o slide 1, mantém um cursor de slide ativo e faz uma chamada de geração individual para cada slide 2..N. Em cada chamada, envie à ferramenta de imagem somente o bloco SLIDE X correspondente ao cursor — nunca o prompt total nem o bloco SLIDE 1 — e avance o cursor apenas depois de receber X/N. Nunca ordene gerar 1..N na mesma solicitação nem pule a aprovação visual da âncora.
- Toda copy delimitada por [HEADLINE], [APOIO] ou [CTA] deve aparecer completa. Nunca corte copy com “...” ou “…” e nunca use reticências como placeholder.
- A única logo é o asset oficial icone/logo-lucrocaseiro-l.png. Exija que ele seja anexado como referência em toda geração visual; se estiver ausente, reserve a área e não gere logo, símbolo ou assinatura substituta.
- Devolva JSON válido sem texto fora do JSON.

REGRA CRÍTICA SOBRE A ESTRATÉGIA:
- O público, a oferta, a promessa e os canais do plano aprovado são imutáveis.
- Você pode variar gancho, estrutura, ritmo e linguagem, mas não redefinir a estratégia.
- Se faltar algum dado, escreva de modo conservador; não invente nem substitua o público ou a promessa.

REGRA CRÍTICA SOBRE OS EXEMPLOS:
Os exemplos são REFERÊNCIA DE FORMATO E TOM, nunca conteúdo a copiar.
- Nunca reuse frases, hashtags, ofertas ou ângulos literais dos exemplos.
- Adapte somente o formato à voz e à oferta da marca atual.
- Hashtags e nomes de produto devem refletir a marca atual, nunca os exemplos.

Schema de saída:
{
  "variants": Array<{
    "channel": string,
    "format": string,
    "headline": string,
    "hook": string,
    "landing": string,
    "body": string,
    "retentionBeats": string[],
    "slidePrompts": string[],
    "productionNotes": string,
    "evidence": string,
    "cta": string
  }>,
  "reuseMap": string[],
  "qualityReview": {
    "ready": boolean,
    "score": number,
    "criteria": {
      "congruence": number,
      "specificity": number,
      "novelty": number,
      "evidenceSafety": number,
      "concision": number
    },
    "strengths": string[],
    "warnings": string[],
    "nextTest": string
  }
}`;

const PROMOTIONAL_GUIDANCE = `ESTILO: PROMOCIONAL
- Headline e gancho diretos, específicos e coerentes com o nível de consciência do público.
- Aterrissagem forte o bastante para continuar a atenção sem repetir o gancho.
- Body com prova ou diferenciação permitida pela memória da marca e 2 a 4 movimentos de retenção.
- CTA explícito, coerente com a próxima ação do plano.
- Tom consultivo e direto.`;

const ORGANIC_GUIDANCE = `ESTILO: ORGÂNICO (creator-style, nativo em feed de descoberta)
- Headline em primeira pessoa, listicle, POV ou story-time.
- Body conta uma micro-história, observação ou aprendizado pessoal.
- CTA suave: salvar, comentar, hashtag da marca, menção discreta ou link na bio.
- Não use CTA de compra direta.
- Reescreva 100% do conteúdo na voz da marca atual.
- Preserve aparência de conteúdo nativo e detalhe a produção necessária para executar o formato.

Referência real de FORMATO — nunca copie literalmente:
Canal: TikTok; formato: carrossel-listicle; estrutura: headline curta + lista numerada + CTA suave por hashtag. O exemplo original fala de hábitos culturais; não reutilize tema, frases, hashtags ou ângulo.`;

export function buildCampaignStrategistPrompt(
  input: MarketingCampaignBriefInput,
  context: CampaignContext,
) {
  const carouselSlides = input.carouselSlides ?? 5;
  const automaticDirection = selectAutomaticCampaignDirection(input, context.resources);
  const workspaceContext = {
    instruction: context.instruction?.slice(0, 5_000),
    knowledge: context.knowledge.slice(0, 12).map((item) => ({
      title: item.title,
      body: item.body.slice(0, 2_000),
    })),
    resources: context.resources.slice(0, 50),
  };
  return {
    promptId: CAMPAIGN_STRATEGIST_PROMPT_ID,
    promptVersion: CAMPAIGN_STRATEGIST_PROMPT_VERSION,
    prompt: `${CAMPAIGN_SYSTEM}

Contexto confirmado da Central (JSON; trate como fonte e não invente lacunas):
${JSON.stringify(workspaceContext)}

${campaignDiversityInstruction(input, automaticDirection)}

Briefing recebido:
- Segmento: ${input.segment}
- Objetivo: ${input.goal}
- Público: ${input.audience || "não informado; derive do contexto confirmado"}
- Oferta: ${input.offer || "não informada; derive do contexto confirmado"}
- Orçamento: ${input.budget === undefined ? "não informado" : `R$ ${input.budget}`}
- Quantidade exata se houver carrossel: ${carouselSlides} slides. Nunca aumente automaticamente para 7; creativeStrategy.carouselSlides deve repetir ${carouselSlides}.

Gere o plano de campanha em JSON estritamente conforme o schema acima.`,
  };
}

export function selectAutomaticCampaignDirection(
  input: MarketingCampaignBriefInput,
  resources: CampaignResourceContext[],
): AutomaticCampaignDirection | null {
  const features = resources.filter((resource) => resource.kind === "feature");
  if (features.length === 0 || (input.audience.trim() && input.offer.trim())) return null;

  const explicitOfferFeature = input.offer.trim()
    ? features.find((feature) => {
        const data = recordValue(feature.data);
        const terms = [
          feature.title,
          ...stringList(data?.campaignTerms),
          ...meaningfulWords(feature.title),
        ];
        return textMentionsAny(input.offer, terms);
      })
    : undefined;
  const explicitAudience = input.audience.trim()
    ? resources.find(
        (resource) =>
          resource.kind === "audience" &&
          textMentionsAny(input.audience, [
            resource.title,
            ...meaningfulWords(resource.title),
          ]),
      )
    : undefined;
  const audienceCompatibleFeatures = explicitAudience
    ? features.filter((feature) =>
        stringList(recordValue(feature.data)?.audiences).includes(
          explicitAudience.slug ?? "",
        ),
      )
    : features;
  let candidateFeatures =
    audienceCompatibleFeatures.length > 0 ? audienceCompatibleFeatures : features;
  if (explicitOfferFeature) candidateFeatures = [explicitOfferFeature];

  const history = resources
    .filter((resource) => resource.kind === "campaign")
    .map((resource) => campaignPlanData(resource.data))
    .filter((plan): plan is Record<string, unknown> => Boolean(plan))
    .slice(0, 12);
  const recentHistory = history.slice(0, 3);

  const rankedFeatures = candidateFeatures
    .map((feature) => {
      const data = recordValue(feature.data);
      const configuredTerms = stringList(data?.campaignTerms);
      const coverageTerms =
        configuredTerms.length > 0 ? configuredTerms : meaningfulWords(feature.title);
      return {
        feature,
        data,
        totalCoverage: history.filter((plan) => mentionsAny(plan, coverageTerms)).length,
        recentCoverage: recentHistory.filter((plan) => mentionsAny(plan, coverageTerms))
          .length,
        priority:
          typeof data?.strategicPriority === "number" ? data.strategicPriority : 0,
      };
    })
    .sort(
      (left, right) =>
        left.recentCoverage - right.recentCoverage ||
        left.totalCoverage - right.totalCoverage ||
        right.priority - left.priority ||
        left.feature.title.localeCompare(right.feature.title, "pt-BR"),
    );

  const selected = rankedFeatures[0];
  if (!selected) return null;
  const audienceSlugs = stringList(selected.data?.audiences);
  const audienceOptions = audienceSlugs
    .map((slug) =>
      resources.find(
        (resource) => resource.kind === "audience" && resource.slug === slug,
      ),
    )
    .filter((resource): resource is CampaignResourceContext => Boolean(resource));
  const audience =
    audienceOptions
      .map((resource) => {
        const priority = recordValue(resource.data)?.strategicPriority;
        return {
          resource,
          coverage: history.filter((plan) =>
            mentionsAny(plan, meaningfulWords(resource.title)),
          ).length,
          priority: typeof priority === "number" ? priority : 0,
        };
      })
      .sort(
        (left, right) =>
          left.coverage - right.coverage ||
          right.priority - left.priority ||
          left.resource.title.localeCompare(right.resource.title, "pt-BR"),
      )[0]?.resource.title ??
    audienceSlugs[0]?.replaceAll("-", " ") ??
    "";

  return {
    feature: selected.feature.title,
    benefit: selected.feature.summary ?? selected.feature.title,
    audience,
    recentCampaigns: recentHistory.map(campaignHistoryLabel),
  };
}

function campaignDiversityInstruction(
  input: MarketingCampaignBriefInput,
  direction: AutomaticCampaignDirection | null,
) {
  if (!direction) {
    return `DIVERSIDADE ESTRATÉGICA:
- Respeite o público e a oferta informados pelo usuário.
- Não repita nome, Big Idea, ângulo, gancho ou promessa de uma campanha anterior do contexto.
- Escolha um único problema estratégico por campanha; não faça uma lista de funcionalidades.`;
  }
  const recent = direction.recentCampaigns.length
    ? direction.recentCampaigns.map((item) => `- ${item}`).join("\n")
    : "- Nenhuma campanha anterior identificada.";
  return `DIREÇÃO AUTOMÁTICA OBRIGATÓRIA:
- Funcionalidade prioritária menos coberta: ${direction.feature}.
- Benefício confirmado a comunicar: ${direction.benefit}.
- Público recomendado: ${input.audience.trim() || direction.audience || "escolha o recorte mais aderente à funcionalidade"}.
- ${input.offer.trim() ? "A oferta informada pelo usuário é imutável." : `A oferta deve levar à funcionalidade ${direction.feature}, sem transformá-la numa lista genérica de recursos.`}
- Esta campanha deve ter um único assunto central, uma dor ou oportunidade concreta e um próximo passo coerente com o objetivo ${input.goal}.
- Não repita nome, Big Idea, ângulo, gancho, promessa nem a mesma situação prática das campanhas recentes.

Campanhas recentes a não repetir:
${recent}`;
}

function campaignPlanData(value: unknown) {
  const data = recordValue(value);
  if (!data) return null;
  return recordValue(data.adStrategy) ?? ("creativeStrategy" in data ? data : null);
}

function campaignHistoryLabel(plan: Record<string, unknown>) {
  const creative = recordValue(plan.creativeStrategy);
  return [plan.name, plan.offer, creative?.angle]
    .filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    )
    .join(" — ")
    .slice(0, 240);
}

function mentionsAny(plan: Record<string, unknown>, terms: string[]) {
  return textMentionsAny(JSON.stringify(plan), terms);
}

function textMentionsAny(value: string, terms: string[]) {
  const text = normalizeCampaignText(value);
  return terms.some((term) => text.includes(normalizeCampaignText(term)));
}

function meaningfulWords(value: string) {
  return normalizeCampaignText(value)
    .split(/\s+/)
    .filter(
      (word) => word.length >= 5 && !["publico", "guiada", "historico"].includes(word),
    );
}

function normalizeCampaignText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function deriveBrandProfile(
  context: CampaignContext & {
    examples: Array<{ input: string; output: string; approved: boolean }>;
  },
): BrandProfile {
  const features = context.resources
    .filter((item) => item.kind === "feature")
    .slice(0, 8);
  return {
    name: "Lucro Caseiro",
    voice:
      context.knowledge
        .filter((item) => /mensagem|copy|linguagem|posicionamento/i.test(item.title))
        .map((item) => `${item.title}: ${item.body}`)
        .join("\n\n")
        .slice(0, 5_000) ||
      context.instruction?.slice(0, 5_000) ||
      "Direta, acolhedora, prática e sem promessas de renda.",
    valueProposition: features
      .map((item) => item.summary || item.title)
      .join("; ")
      .slice(0, 2_000),
    restrictions: context.knowledge
      .filter((item) => /prova|alegação|governança|ética|qualidade/i.test(item.title))
      .slice(0, 5)
      .map((item) => `${item.title}: ${item.body}`.slice(0, 2_000)),
    approvedExamples: context.examples
      .filter((item) => item.approved)
      .slice(0, 5)
      .map((item) =>
        `Entrada: ${item.input}\nSaída aprovada: ${item.output}`.slice(0, 1_500),
      ),
  };
}

export function buildAdCopywriterPrompt(
  input: MarketingCampaignCopiesInput,
  brand: BrandProfile,
) {
  const guidance = input.style === "organic" ? ORGANIC_GUIDANCE : PROMOTIONAL_GUIDANCE;
  const carouselSlides = input.plan.creativeStrategy.carouselSlides ?? 5;
  const executionContract = carouselExecutionContract(carouselSlides);
  return {
    promptId: AD_COPYWRITER_PROMPT_ID,
    promptVersion: AD_COPYWRITER_PROMPT_VERSION,
    prompt: `${COPYWRITER_SYSTEM}

${guidance}

ESTRATÉGIA APROVADA E IMUTÁVEL:
${JSON.stringify(input.plan, null, 2)}

MEMÓRIA DA MARCA:
${JSON.stringify(brand, null, 2)}

QUANTIDADE DO CARROSSEL:
Se alguma variante for carrossel, ela deve ter exatamente ${carouselSlides} slides, nem mais nem menos. Estruture body nessa quantidade e devolva exatamente ${carouselSlides} itens em slidePrompts; nunca expanda automaticamente para 7.

COMPOSIÇÃO DETERMINÍSTICA DO PROMPT TOTAL:
- slidePrompts[0] deve ser o prompt individual completo do slide 1; slidePrompts[${carouselSlides - 1}] deve ser o prompt individual completo do slide ${carouselSlides}.
- Cada item deve conter todas as instruções necessárias àquele slide, inclusive copy on-canvas integral, cena, composição, continuidade, identidade e restrições aplicáveis.
- Cada item deve declarar uma FAMÍLIA DE LAYOUT canônica e descrever uma composição estruturalmente diferente. Use ao menos três famílias, nunca repita a mesma em slides consecutivos e limite divisao-vertical — foto de um lado e texto do outro — a um único slide.
- Cada item deve declarar ${LIME_GESTURE_PREFIX} forma=<forma concreta>; posição=<posição relativa>; função=<função narrativa>. A forma deve ser diferente em cada slide; não aceite descrições distintas para repetir a mesma silhueta em “V”.
- Cada item deve repetir literalmente ${CANONICAL_LOGO_GUARDRAIL} A logo oficial deve ser anexada como referência de imagem em cada chamada; sem o asset, não improvise nem gere uma substituta.
- Não escreva um resumo geral no lugar dos prompts individuais e não omita regras repetidas entre slides.
- Na resposta JSON, mantenha productionNotes somente com o contrato literal. Depois da validação, productionNotes será reconstruído pelo sistema como contrato literal + slidePrompts.join("\\n\\n"). Portanto, os blocos do prompt total devem ser exatamente os mesmos de slidePrompts, sem paráfrase, condensação ou nova geração.

CONTRATO LITERAL DE EXECUÇÃO DO CARROSSEL:
Quando a variante for carrossel, productionNotes deve ser exatamente o bloco abaixo, sem texto anterior ou posterior:

${executionContract}

Depois desse bloco, preserve a copy integral de todos os slides em slidePrompts. A presença dos demais blocos no prompt total não autoriza executá-los quando o contrato mandar gerar somente o slide 1.

Gere uma variante para cada canal da estratégia aprovada. Preserve exatamente o público, a oferta e a promessa do plano.
Antes de responder, revise congruência, especificidade, novidade, segurança das evidências e concisão; corrija as variantes e só então preencha qualityReview.
Responda somente com o JSON do schema.`,
  };
}

export function carouselExecutionContract(carouselSlides: number) {
  return `ESTADO DE EXECUÇÃO DO CARROSSEL — ${carouselSlides} SLIDES
- Este prompt total é um roteiro para o ORQUESTRADOR, não o texto de uma única geração de imagem. Nunca envie o prompt total, dois blocos SLIDE X ou a sequência completa de blocos para a ferramenta de imagem.
- Se a imagem aprovada do slide 1 ainda NÃO existe no histórico nem está anexada, gere SOMENTE o slide 1, entregue um único arquivo e encerre a tarefa para aprovação visual.
- Se a imagem aprovada do slide 1 JÁ existe no histórico ou está anexada, considere o slide 1 concluído, NÃO o regenere e inicie o cursor em SLIDE ATIVO = 2.
- Para cada SLIDE ATIVO X, selecione somente o bloco que começa em SLIDE X e termina antes do próximo cabeçalho SLIDE. Faça uma única chamada de imagem contendo uma instrução curta "GERE SOMENTE X/${carouselSlides}; NÃO GERE 1/${carouselSlides}" + esse bloco literal + a imagem real do slide 1 e o arquivo oficial icone/logo-lucrocaseiro-l.png como referências. Não inclua na chamada o bloco SLIDE 1 nem qualquer outro bloco.
- Só marque X como concluído e avance o cursor para X + 1 quando a saída exibir X/${carouselSlides} e aplicar a copy e a cena do bloco SLIDE X. Se a saída repetir 1/${carouselSlides}, a headline, a copy ou a cena da capa, descarte-a como falha e refaça o mesmo X; nunca aceite outra capa como próximo slide.
- No estado pós-aprovação, continue automaticamente após cada arquivo válido e só encerre quando todos os slides 2..${carouselSlides} tiverem sido entregues, terminando em ${carouselSlides}/${carouselSlides}; não pare após o primeiro slide restante.
- Nunca gere os slides 1..${carouselSlides} na mesma solicitação. A pausa para aprovação acontece somente depois da criação inicial do slide 1.`;
}

export function composeCarouselProductionNotes(
  bundle: MarketingCreativeBundle,
  plan: MarketingCampaignPlan,
) {
  const carouselSlides = plan.creativeStrategy.carouselSlides ?? 5;
  const planIsCarousel = /carrossel/i.test(plan.creativeStrategy.format);

  return {
    ...bundle,
    variants: bundle.variants.map((variant) => {
      if (!planIsCarousel && !/carrossel/i.test(variant.format)) return variant;
      return {
        ...variant,
        productionNotes: [
          carouselExecutionContract(carouselSlides),
          ...variant.slidePrompts,
        ].join("\n\n"),
      };
    }),
  };
}

export function normalizeStoredCarouselProductionNotes(data: Record<string, unknown>) {
  const plan = MarketingCampaignPlanSchema.safeParse(data.adStrategy);
  const bundle = MarketingCreativeBundleSchema.safeParse(data.copyBundle);
  if (!plan.success || !bundle.success) return data;

  const planIsCarousel = /carrossel/i.test(plan.data.creativeStrategy.format);
  const bundleWithCurrentVisualContract = {
    ...bundle.data,
    variants: bundle.data.variants.map((variant) => {
      if (!planIsCarousel && !/carrossel/i.test(variant.format)) return variant;
      return {
        ...variant,
        slidePrompts: variant.slidePrompts.map((slidePrompt, slideIndex) =>
          addCanonicalLogoGuardrail(addStoredLimeGesture(slidePrompt, slideIndex)),
        ),
      };
    }),
  };
  const normalizedBundle = composeCarouselProductionNotes(
    bundleWithCurrentVisualContract,
    plan.data,
  );
  const changed = normalizedBundle.variants.some(
    (variant, index) =>
      variant.productionNotes !== bundle.data.variants.at(index)?.productionNotes,
  );
  return changed ? { ...data, copyBundle: normalizedBundle } : data;
}

export function creativeBundleContractViolations(
  bundle: MarketingCreativeBundle,
  plan: MarketingCampaignPlan,
) {
  const carouselSlides = plan.creativeStrategy.carouselSlides ?? 5;
  const executionContract = carouselExecutionContract(carouselSlides);
  const planIsCarousel = /carrossel/i.test(plan.creativeStrategy.format);
  const violations: string[] = [];

  bundle.variants.forEach((variant, index) => {
    if (!planIsCarousel && !/carrossel/i.test(variant.format)) return;
    const label = `Variante ${index + 1}`;
    const production = variant.productionNotes;
    const fullText = `${variant.body}\n${production}\n${variant.slidePrompts.join("\n")}`;
    const visualVariation = selectedVisualVariation(fullText);
    const forbidsAiPeople =
      visualVariation !== null &&
      !visualVariation.startsWith(
        AI_CHARACTER_VISUAL_VARIATION.toLocaleLowerCase("pt-BR"),
      );
    const usesAiCharacter =
      visualVariation !== null &&
      visualVariation.startsWith(
        AI_CHARACTER_VISUAL_VARIATION.toLocaleLowerCase("pt-BR"),
      );

    if (variant.slidePrompts.length !== carouselSlides)
      violations.push(
        `${label}: deve conter exatamente ${carouselSlides} prompts individuais em slidePrompts.`,
      );
    const layoutFamilies: string[] = [];
    const limeGestureShapes: Array<string | null> = [];
    variant.slidePrompts.forEach((slidePrompt, slideIndex) => {
      const headingNumber = /^SLIDE\s+(\d+)(?:\s|$)/iu.exec(slidePrompt)?.[1];
      if (headingNumber !== String(slideIndex + 1))
        violations.push(
          `${label}: slidePrompts[${slideIndex}] não começa por SLIDE ${slideIndex + 1}.`,
        );
      const layoutFamily = /^FAMÍLIA DE LAYOUT:\s*([a-z-]+)\s*$/imu.exec(
        slidePrompt,
      )?.[1];
      if (!layoutFamily) {
        violations.push(
          `${label}: slidePrompts[${slideIndex}] não declara FAMÍLIA DE LAYOUT.`,
        );
      } else if (!CAROUSEL_LAYOUT_FAMILIES.some((family) => family === layoutFamily)) {
        violations.push(
          `${label}: slidePrompts[${slideIndex}] usa uma família de layout inválida.`,
        );
      } else {
        layoutFamilies.push(layoutFamily);
      }
      const limeGestureShape = parseLimeGestureShape(slidePrompt);
      if (!limeGestureShape) {
        limeGestureShapes.push(null);
        violations.push(
          `${label}: slidePrompts[${slideIndex}] não declara forma, posição e função em ${LIME_GESTURE_PREFIX}`,
        );
      } else {
        limeGestureShapes.push(limeGestureShape);
      }
      if (!slidePrompt.includes(CANONICAL_LOGO_GUARDRAIL))
        violations.push(
          `${label}: slidePrompts[${slideIndex}] omite a única logo canônica permitida.`,
        );
      if (hasCompetingLogoDirection(slidePrompt))
        violations.push(
          `${label}: slidePrompts[${slideIndex}] propõe uma logo ou assinatura concorrente.`,
        );
      const slideVisualVariation = selectedVisualVariation(slidePrompt);
      if (visualVariation && slideVisualVariation !== visualVariation)
        violations.push(
          `${label}: slidePrompts[${slideIndex}] não repete a variação visual selecionada.`,
        );
      if (forbidsAiPeople && !slidePrompt.includes(NON_HUMAN_VISUAL_GUARDRAIL))
        violations.push(
          `${label}: slidePrompts[${slideIndex}] omite a proibição de pessoas geradas por IA da variação selecionada.`,
        );
      if (usesAiCharacter && !slidePrompt.includes(AI_CHARACTER_CAROUSEL_GUARDRAIL))
        violations.push(
          `${label}: slidePrompts[${slideIndex}] omite o contrato de personagem IA com telas.`,
        );
    });

    if (
      limeGestureShapes.every((shape): shape is string => shape !== null) &&
      new Set(limeGestureShapes).size !== limeGestureShapes.length
    )
      violations.push(`${label}: repete a mesma forma do gesto lima entre slides.`);

    if (forbidsAiPeople && hasPositiveHumanDirection(fullText))
      violations.push(
        `${label}: a variação visual selecionada proíbe pessoa ou personagem gerada por IA.`,
      );

    if (usesAiCharacter) {
      if (!layoutFamilies.includes("interface-real"))
        violations.push(
          `${label}: a variação Editorial com personagem IA exige ao menos um slide interface-real.`,
        );
      if (
        !variant.slidePrompts.some((slidePrompt) =>
          slidePrompt
            .split("\n")
            .some(
              (line) =>
                line.trim().startsWith(AI_CHARACTER_SCREEN_INTERACTION_PREFIX) &&
                line.trim().length > AI_CHARACTER_SCREEN_INTERACTION_PREFIX.length,
            ),
        )
      )
        violations.push(
          `${label}: a variação Editorial com personagem IA exige uma cena explícita de interação entre personagem e tela.`,
        );
    }

    if (layoutFamilies.length === carouselSlides) {
      const requiredVariety = Math.min(3, carouselSlides);
      if (new Set(layoutFamilies).size < requiredVariety)
        violations.push(
          `${label}: deve usar ao menos ${requiredVariety} famílias de layout diferentes.`,
        );
      if (layoutFamilies.some((family, slide) => family === layoutFamilies[slide - 1]))
        violations.push(`${label}: repete a mesma família de layout em sequência.`);
      if (layoutFamilies.filter((family) => family === "divisao-vertical").length > 1)
        violations.push(
          `${label}: usa divisao-vertical mais de uma vez no mesmo carrossel.`,
        );
    }

    if (production !== executionContract)
      violations.push(`${label}: productionNotes não contém somente o contrato literal.`);
    if (
      /execute todas as \d+ gerações|não pare após o slide 1|tarefa só termina quando houver exatamente \d+ arquivos/iu.test(
        fullText,
      )
    )
      violations.push(`${label}: ordena gerar o carrossel inteiro de uma vez.`);
    const copyBlocks = fullText.matchAll(
      /\[(?:HEADLINE|APOIO|CTA)\]\s*<<<([\s\S]*?)>>>/giu,
    );
    for (const match of copyBlocks) {
      if (/(?:\.{3}|…)\s*$/u.test(match[1]?.trim() ?? "")) {
        violations.push(`${label}: contém copy on-canvas truncada por reticências.`);
        break;
      }
    }
  });

  return violations;
}

function selectedVisualVariation(text: string) {
  const prefixes = ["VARIAÇÃO VISUAL:", "VARIAÇÃO:"];
  for (const line of text.split("\n")) {
    const normalizedLine = line.trim();
    const upperLine = normalizedLine.toLocaleUpperCase("pt-BR");
    const prefix = prefixes.find((candidate) => upperLine.startsWith(candidate));
    if (prefix)
      return normalizedLine.slice(prefix.length).trim().toLocaleLowerCase("pt-BR");
  }
  return null;
}

function addCanonicalLogoGuardrail(slidePrompt: string) {
  const lines = slidePrompt.split("\n").filter((line) => {
    if (line.trim() === CANONICAL_LOGO_GUARDRAIL) return true;
    const normalized = normalizeSearchText(line);
    return !(
      (normalized.includes("assinatura") &&
        /lucro caseiro|wordmark|logo|logotipo/u.test(normalized)) ||
      (normalized.includes("logo") &&
        /\blc\b|circulo|estrela|selo|wordmark|texto|minusc|empilh|icone|simbolo/u.test(
          normalized,
        ))
    );
  });
  if (lines.some((line) => line.trim() === CANONICAL_LOGO_GUARDRAIL))
    return lines.join("\n");

  const gestureIndex = lines.findIndex((line) =>
    line.trim().startsWith(LIME_GESTURE_PREFIX),
  );
  lines.splice(gestureIndex >= 0 ? gestureIndex + 1 : 1, 0, CANONICAL_LOGO_GUARDRAIL);
  return lines.join("\n");
}

function hasCompetingLogoDirection(slidePrompt: string) {
  const normalized = normalizeSearchText(
    slidePrompt.replaceAll(CANONICAL_LOGO_GUARDRAIL, ""),
  );
  return (
    /(?:logo|logotipo|wordmark|assinatura visual)[^\n]{0,180}(?:\blc\b|circulo|estrela|selo|nome digitado|texto|minusc|empilh|outro icone|outro simbolo)/u.test(
      normalized,
    ) ||
    /(?:\blc\b|circulo|estrela|selo|wordmark)[^\n]{0,180}(?:logo|logotipo|assinatura)/u.test(
      normalized,
    )
  );
}

function normalizeSearchText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase("pt-BR");
}

function addStoredLimeGesture(slidePrompt: string, slideIndex: number) {
  if (parseLimeGestureShape(slidePrompt)) return slidePrompt;

  const lines = slidePrompt.split("\n");
  const preset =
    LIME_GESTURE_PRESETS.at(slideIndex % LIME_GESTURE_PRESETS.length) ??
    LIME_GESTURE_PRESETS[0];
  const existingGesture = lines.findIndex((line) =>
    line.trim().startsWith(LIME_GESTURE_PREFIX),
  );
  let gestureIndex = existingGesture;
  if (existingGesture >= 0) lines.splice(existingGesture, 1, preset);
  else {
    const layoutFamily = lines.findIndex((line) =>
      line.trim().startsWith("FAMÍLIA DE LAYOUT:"),
    );
    gestureIndex = layoutFamily >= 0 ? layoutFamily + 1 : 1;
    lines.splice(gestureIndex, 0, preset);
  }
  lines.splice(
    gestureIndex + 1,
    0,
    "Este gesto é exclusivo deste slide; não reutilize a silhueta nem o mesmo V dos demais slides.",
  );
  return lines.join("\n");
}

function parseLimeGestureShape(slidePrompt: string) {
  const line = slidePrompt
    .split("\n")
    .map((candidate) => candidate.trim())
    .find((candidate) => candidate.startsWith(LIME_GESTURE_PREFIX));
  if (!line) return null;

  const fields = line
    .slice(LIME_GESTURE_PREFIX.length)
    .split(";")
    .map((field) => field.trim());
  if (fields.length !== 3) return null;
  const [shapeField, positionField, functionField] = fields;
  if (
    !shapeField?.startsWith("forma=") ||
    !positionField?.startsWith("posição=") ||
    !functionField?.startsWith("função=")
  )
    return null;

  const shape = shapeField.slice("forma=".length).trim();
  const position = positionField.slice("posição=".length).trim();
  const narrativeFunction = functionField.slice("função=".length).trim();
  if (!shape || !position || !narrativeFunction) return null;
  return normalizeLimeGestureShape(shape);
}

function normalizeLimeGestureShape(shape: string) {
  const normalized = shape
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/gu, " ");
  return /\b(?:v|chevron)\b/u.test(normalized) ? "v" : normalized;
}

function hasPositiveHumanDirection(text: string) {
  const normalized = text
    .replaceAll(NON_HUMAN_VISUAL_GUARDRAIL, "")
    .toLocaleLowerCase("pt-BR");
  return [
    "personagem consistente",
    "fotografia humana",
    "retrato editorial de pessoa",
    "retrato editorial de uma pessoa",
    "retrato de pessoa",
    "retrato de uma pessoa",
    "pessoa brasileira",
    "pessoa jovem",
    "pessoa adulta",
    "mostre pessoa",
    "mostre uma pessoa",
    "mãos trabalhando",
    "mãos humanas trabalhando",
    "mãos segurando",
    "mãos humanas segurando",
    "mãos operando",
    "mãos humanas operando",
    "rosto humano",
    "corpo inteiro",
  ].some((instruction) => normalized.includes(instruction));
}

export function buildCreativeBundleRepairPrompt(
  originalPrompt: string,
  previousResponse: string,
  violations: string[],
) {
  return `${originalPrompt}

CORREÇÃO OBRIGATÓRIA DA RESPOSTA ANTERIOR:
O pacote abaixo foi rejeitado pelo contrato executável:
${violations.map((violation) => `- ${violation}`).join("\n")}

Reescreva o pacote JSON completo. Corrija os problemas listados, preserve toda copy sem cortes e não acrescente instruções que contradigam o contrato literal.

RESPOSTA REJEITADA:
${previousResponse.slice(0, 50_000)}`;
}

export function parseCampaignPlan(text: string): MarketingCampaignPlan | null {
  const raw = tryParseJson(text);
  if (!raw) return null;
  const result = MarketingCampaignPlanSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export function parseCreativeBundle(text: string): MarketingCreativeBundle | null {
  const raw = tryParseJson(text);
  if (!raw) return null;
  const result = MarketingCreativeBundleSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export function extractJsonObject(text: string): string | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < cleaned.length; index += 1) {
    const character = cleaned.charAt(index);
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (character === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return cleaned.slice(start, index + 1);
    }
  }
  return null;
}

function tryParseJson(text: string): unknown {
  const object = extractJsonObject(text);
  if (!object) return null;
  try {
    return JSON.parse(object) as unknown;
  } catch {
    return null;
  }
}
