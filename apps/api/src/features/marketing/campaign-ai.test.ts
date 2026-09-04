import { describe, expect, it } from "vitest";

import { MarketingCreativeBundleSchema } from "@lucro-caseiro/contracts";

import {
  AI_CHARACTER_CAROUSEL_GUARDRAIL,
  CANONICAL_LOGO_GUARDRAIL,
  NON_HUMAN_VISUAL_GUARDRAIL,
} from "./marketing.system-prompt";

import {
  buildAdCopywriterPrompt,
  buildCampaignStrategistPrompt,
  CAROUSEL_LAYOUT_FAMILIES,
  carouselExecutionContract,
  composeCarouselProductionNotes,
  creativeBundleContractViolations,
  extractJsonObject,
  normalizeStoredCarouselProductionNotes,
  parseCampaignPlan,
  parseCreativeBundle,
  selectAutomaticCampaignDirection,
} from "./campaign-ai";

const plan = {
  name: "Preço sem chute",
  segment: "pme" as const,
  goal: "leads" as const,
  audienceSummary: "Confeiteiras que vendem por encomenda",
  offer: "Calculadora para formar preço com custos e margem",
  research: {
    audienceSlice: "Confeiteiras que vendem bolos por encomenda pelo WhatsApp",
    audienceLanguage: ["Não sei quanto realmente sobra"],
    realDesire: "Cobrar com segurança sem perder clientes",
    saturatedSolutions: ["Multiplique o custo por três"],
    problemMechanism: "Custos indiretos e tempo ficam fora da conta",
    solutionMechanism: "O cálculo reúne custos, margem e continuidade da venda",
    differentiators: ["O cálculo vira produto e catálogo sem recadastro"],
    proofs: ["Fluxo publicado do produto"],
    saturationNotes: "Evitar promessas genéricas de gestão completa",
  },
  creativeStrategy: {
    bigIdea: "O pedido parece lucro até a conta completa aparecer",
    angle: "Custo invisível",
    promise: "Enxergar quanto sobra e reaproveitar o cálculo",
    reasonToBelieve: "Demonstração do fluxo real",
    stickyName: "Preço sem chute",
    commonEnemy: "Conta incompleta",
    organicInsight: "Vídeos de bastidor de encomendas prendem esse público",
    avatar: "Confeiteira preparando um pedido real",
    format: "Vídeo curto de bastidor",
    carouselSlides: 4,
    visualHook: "Pedido pronto e custos aparecendo na tela",
    landing: "O valor da venda não é o valor que fica para você",
    retentionBeats: ["Revelar custo esquecido", "Mostrar o catálogo pronto"],
    productionNotes: ["Usar tela real", "Não inventar resultado"],
  },
  channels: ["instagram", "whatsapp"],
  messages: { instagram: "Calcule antes de vender", whatsapp: "Revise seu preço" },
  creativeNeeds: ["Carrossel educativo"],
  automation: "Levar para a calculadora",
  kpis: [{ label: "Cliques", target: "100" }],
  nextBestAction: "Publicar o carrossel",
};

const limeGestures = [
  "GESTO LIMA: forma=arco curto; posição=canto superior esquerdo; função=conduzir à headline.",
  "GESTO LIMA: forma=colchete vertical; posição=margem direita; função=delimitar a etapa.",
  "GESTO LIMA: forma=seta curva; posição=base da fotografia; função=indicar o foco.",
  "GESTO LIMA: forma=ponto expandido; posição=ao lado do CTA; função=marcar a conclusão.",
];

describe("campaign AI", () => {
  it("extracts balanced JSON from fences and surrounding text", () => {
    const text =
      'Resposta:\n```json\n{"name":"Plano {seguro}","channels":[],"messages":{},"creativeNeeds":[],"kpis":[]}\n```\nFim';
    expect(extractJsonObject(text)).toBe(
      '{"name":"Plano {seguro}","channels":[],"messages":{},"creativeNeeds":[],"kpis":[]}',
    );
    expect(parseCampaignPlan(text)?.name).toBe("Plano {seguro}");
  });

  it("builds the strategist from briefing and canonical context", () => {
    const built = buildCampaignStrategistPrompt(
      {
        segment: "pme",
        goal: "leads",
        audience: "Confeiteiras iniciantes",
        offer: "Calculadora de preço",
        budget: 300,
        carouselSlides: 4,
      },
      {
        instruction: "Não prometa renda.",
        knowledge: [{ title: "Mensagens", body: "Fale com clareza." }],
        resources: [],
      },
    );
    expect(built.promptId).toBe("campaign-strategist");
    expect(built.promptVersion).toBe("18");
    expect(built.prompt).toContain("Confeiteiras iniciantes");
    expect(built.prompt).toContain("R$ 300");
    expect(built.prompt).toContain("Não prometa renda.");
    expect(built.prompt).toContain("Big Idea");
    expect(built.prompt).toContain("saturatedSolutions");
    expect(built.prompt).toContain("Quantidade exata se houver carrossel: 4 slides");
    expect(built.prompt).toContain("não é exclusivo de confeiteiras");
    expect(built.prompt).toContain("público desta campanha");
    expect(built.prompt).toContain("três ângulos distintos");
  });

  it("uses canonical context when audience and offer are blank", () => {
    const built = buildCampaignStrategistPrompt(
      { segment: "pme", goal: "leads", audience: "", offer: "" },
      { instruction: "Priorize o produto atual.", knowledge: [], resources: [] },
    );

    expect(built.prompt).toContain(
      "Público: não informado; derive do contexto confirmado",
    );
    expect(built.prompt).toContain(
      "Oferta: não informada; derive do contexto confirmado",
    );
    expect(built.prompt).toContain("não invente dados para esconder lacunas");
    expect(built.prompt).toContain("não eleja confeitaria");
  });

  it("prioritizes the least covered strategic feature for automatic campaigns", () => {
    const resources = [
      {
        kind: "audience",
        slug: "beleza-e-servicos",
        title: "Profissionais de beleza e serviços",
        summary: "Atendem com hora marcada.",
        data: {},
      },
      {
        kind: "feature",
        slug: "servicos-e-agenda",
        title: "Serviços e agenda",
        summary: "Organiza serviços, atendimentos e a capacidade da agenda.",
        data: {
          audiences: ["beleza-e-servicos"],
          campaignTerms: ["serviço", "agenda"],
          strategicPriority: 12,
        },
      },
      {
        kind: "feature",
        slug: "precificacao",
        title: "Precificação guiada",
        summary: "Calcula custo, margem e preço de venda.",
        data: {
          campaignTerms: ["precificação", "preço"],
          strategicPriority: 11,
        },
      },
      {
        kind: "campaign",
        slug: "preco-sem-chute",
        title: "Preço sem chute",
        summary: "Campanha anterior de precificação.",
        data: {
          adStrategy: {
            name: "Preço sem chute",
            offer: "Precificação guiada",
            creativeStrategy: { angle: "Custos esquecidos" },
          },
        },
      },
    ];

    const direction = selectAutomaticCampaignDirection(
      { segment: "pme", goal: "leads", audience: "", offer: "" },
      resources,
    );

    expect(direction).toMatchObject({
      feature: "Serviços e agenda",
      audience: "Profissionais de beleza e serviços",
    });
    expect(direction?.recentCampaigns[0]).toContain("Preço sem chute");

    const built = buildCampaignStrategistPrompt(
      { segment: "pme", goal: "leads", audience: "", offer: "" },
      { instruction: "Não prometa renda.", knowledge: [], resources },
    );
    expect(built.prompt).toContain("DIREÇÃO AUTOMÁTICA OBRIGATÓRIA");
    expect(built.prompt).toContain(
      "Funcionalidade prioritária menos coberta: Serviços e agenda",
    );
    expect(built.prompt).toContain("Campanhas recentes a não repetir");
  });

  it("brings priority commerce audiences into automatic campaign rotation", () => {
    const resources = [
      {
        kind: "audience",
        slug: "empreendedoras-organizando-negocio",
        title: "Empreendedoras organizando o negócio",
        summary: null,
        data: {},
      },
      {
        kind: "audience",
        slug: "lojas-de-celulares-e-acessorios",
        title: "Lojas de celulares e acessórios",
        summary: null,
        data: { strategicPriority: 12 },
      },
      {
        kind: "audience",
        slug: "revendedores-de-importados",
        title: "Revendedores de importados",
        summary: null,
        data: { strategicPriority: 12 },
      },
      {
        kind: "feature",
        slug: "estoque-e-compras",
        title: "Estoque e compras",
        summary: "Acompanha itens, fornecedores e reposição.",
        data: {
          audiences: [
            "empreendedoras-organizando-negocio",
            "lojas-de-celulares-e-acessorios",
            "revendedores-de-importados",
          ],
          campaignTerms: ["estoque", "reposição"],
        },
      },
    ];

    expect(
      selectAutomaticCampaignDirection(
        { segment: "pme", goal: "leads", audience: "", offer: "" },
        resources,
      )?.audience,
    ).toBe("Lojas de celulares e acessórios");

    expect(
      selectAutomaticCampaignDirection(
        { segment: "pme", goal: "leads", audience: "", offer: "" },
        [
          ...resources,
          {
            kind: "campaign",
            title: "Campanha para lojas de celulares",
            summary: null,
            data: {
              audienceSummary: "Lojas de celulares e acessórios",
              creativeStrategy: { angle: "Margem por aparelho" },
            },
          },
        ],
      )?.audience,
    ).toBe("Revendedores de importados");
  });

  it("keeps explicit audience and offer above automatic rotation", () => {
    const direction = selectAutomaticCampaignDirection(
      {
        segment: "pme",
        goal: "sales",
        audience: "Artesãos",
        offer: "Catálogo público",
      },
      [
        {
          kind: "feature",
          slug: "servicos-e-agenda",
          title: "Serviços e agenda",
          summary: "Organiza serviços e atendimentos.",
          data: { strategicPriority: 12 },
        },
      ],
    );

    expect(direction).toBeNull();
  });

  it("locks approved strategy and forbids copying organic references", () => {
    const built = buildAdCopywriterPrompt(
      { plan, style: "organic" },
      {
        name: "Lucro Caseiro",
        voice: "Direta e acolhedora",
        valueProposition: "Preço calculado com segurança",
        restrictions: ["Não prometer renda"],
        approvedExamples: ["Exemplo aprovado"],
      },
    );
    expect(built.promptId).toBe("ad-copywriter");
    expect(built.promptVersion).toBe("18");
    expect(built.prompt).toContain("ESTRATÉGIA APROVADA E IMUTÁVEL");
    expect(built.prompt).toContain("nunca conteúdo a copiar");
    expect(built.prompt).toContain(plan.audienceSummary);
    expect(built.prompt).toContain(plan.offer);
    expect(built.prompt).toContain(plan.creativeStrategy.bigIdea);
    expect(built.prompt).toContain("qualityReview");
    expect(built.prompt).toContain("Visual DNA aprovado");
    expect(built.prompt).toContain("imagem separada por slide");
    expect(built.prompt).toContain("O slide 1 é a âncora visual imutável");
    expect(built.prompt).toContain("não a regenere");
    expect(built.prompt).toContain("`1/N`, `2/N`, `3/N`");
    expect(built.prompt).toContain("Nunca gere os slides 1..4 na mesma solicitação");
    expect(built.prompt).toContain("Para cada SLIDE ATIVO X");
    expect(built.prompt).toContain(
      "só encerre quando todos os slides 2..4 tiverem sido entregues",
    );
    expect(built.prompt).toContain("terminando em 4/4");
    expect(built.prompt).toContain("Este prompt total é um roteiro para o ORQUESTRADOR");
    expect(built.prompt).toContain("SLIDE ATIVO = 2");
    expect(built.prompt).toContain(
      '"GERE SOMENTE X/4; NÃO GERE 1/4" + esse bloco literal',
    );
    expect(built.prompt).toContain("Se a saída repetir 1/4");
    expect(built.prompt).toContain("nunca repita a mesma em slides consecutivos");
    expect(built.prompt).toContain("GESTO LIMA:");
    expect(built.prompt).toContain("nunca repita a mesma silhueta entre slides");
    expect(built.prompt).toContain("especialmente o mesmo “V”");
    expect(built.prompt).toContain(CANONICAL_LOGO_GUARDRAIL);
    expect(built.prompt).toContain("icone/logo-lucrocaseiro-l.png");
    expect(built.prompt).toContain("o antigo círculo com “lc”");
    expect(built.prompt).toContain("Nunca proponha uma segunda logo");
    expect(built.prompt).toContain("exatamente 4 slides, nem mais nem menos");
    expect(built.prompt).toContain(
      "não precisam aparecer sempre como duas metades lado a lado",
    );
    expect(built.prompt).toContain("como “vende”");
    expect(built.prompt).toContain(carouselExecutionContract(4));
    expect(built.prompt).toContain("Nunca corte copy com “...” ou “…”");
    expect(built.prompt).toContain("exatamente 4 itens em slidePrompts");
    expect(built.prompt).toContain('slidePrompts.join("\\n\\n")');
    expect(built.prompt).toContain("FAMÍLIA DE LAYOUT");
    expect(built.prompt).toContain("divisao-vertical no máximo uma vez");
    CAROUSEL_LAYOUT_FAMILIES.forEach((family) => {
      expect(built.prompt).toContain(family);
    });
  });

  it("rejects a carousel prompt that invents a logo, regenerates slide 1 or truncates copy", () => {
    const bundle = MarketingCreativeBundleSchema.parse({
      variants: [
        {
          channel: "instagram",
          format: "carrossel",
          headline: "Venda entrou hoje",
          body: "[APOIO] <<< Quando vendas e despesas ficam em anotações soltas… >>>",
          slidePrompts: [
            `SLIDE 1\nFAMÍLIA DE LAYOUT: foto-dominante\n${limeGestures[0]}\n${CANONICAL_LOGO_GUARDRAIL}\nLOGO: crie um círculo com as letras lc.\nPrompt 1.`,
            `SLIDE 2\nFAMÍLIA DE LAYOUT: campo-tipografico\n${limeGestures[1]}\n${CANONICAL_LOGO_GUARDRAIL}\nPrompt 2.`,
            `SLIDE 3\nFAMÍLIA DE LAYOUT: recorte-editorial\n${limeGestures[2]}\n${CANONICAL_LOGO_GUARDRAIL}\nPrompt 3.`,
            `SLIDE 4\nFAMÍLIA DE LAYOUT: encerramento-editorial\n${limeGestures[3]}\n${CANONICAL_LOGO_GUARDRAIL}\nPrompt 4.`,
          ],
          productionNotes:
            "Execute todas as 4 gerações nesta mesma solicitação. Não pare após o slide 1.",
          cta: "Organize agora.",
        },
      ],
    });

    expect(creativeBundleContractViolations(bundle, plan)).toEqual([
      "Variante 1: slidePrompts[0] propõe uma logo ou assinatura concorrente.",
      "Variante 1: productionNotes não contém somente o contrato literal.",
      "Variante 1: ordena gerar o carrossel inteiro de uma vez.",
      "Variante 1: contém copy on-canvas truncada por reticências.",
    ]);
  });

  it("accepts the two-state carousel execution contract with complete copy", () => {
    const parsed = MarketingCreativeBundleSchema.parse({
      variants: [
        {
          channel: "instagram",
          format: "carrossel",
          headline: "Venda entrou hoje",
          body: "[APOIO] <<< Organize cada movimento separadamente. >>>",
          slidePrompts: [
            `SLIDE 1\nFAMÍLIA DE LAYOUT: foto-dominante\n${limeGestures[0]}\n${CANONICAL_LOGO_GUARDRAIL}\nCrie a arte final do slide 1.`,
            `SLIDE 2\nFAMÍLIA DE LAYOUT: campo-tipografico\n${limeGestures[1]}\n${CANONICAL_LOGO_GUARDRAIL}\nCrie a arte final do slide 2.`,
            `SLIDE 3\nFAMÍLIA DE LAYOUT: divisao-horizontal\n${limeGestures[2]}\n${CANONICAL_LOGO_GUARDRAIL}\nCrie a arte final do slide 3.`,
            `SLIDE 4\nFAMÍLIA DE LAYOUT: encerramento-editorial\n${limeGestures[3]}\n${CANONICAL_LOGO_GUARDRAIL}\nCrie a arte final do slide 4.`,
          ],
          productionNotes: carouselExecutionContract(4),
          cta: "Organize agora.",
        },
      ],
    });

    expect(creativeBundleContractViolations(parsed, plan)).toEqual([]);
    const bundle = composeCarouselProductionNotes(parsed, plan);
    expect(bundle.variants[0]?.productionNotes).toBe(
      [carouselExecutionContract(4), ...parsed.variants[0]!.slidePrompts].join("\n\n"),
    );
    parsed.variants[0]!.slidePrompts.forEach((slidePrompt) => {
      expect(bundle.variants[0]?.productionNotes.split(slidePrompt)).toHaveLength(2);
    });
    expect(bundle.variants[0]?.productionNotes).toContain(
      "continue automaticamente após cada arquivo",
    );
    expect(bundle.variants[0]?.productionNotes).toContain(
      "não pare após o primeiro slide restante",
    );
    expect(bundle.variants[0]?.productionNotes).toContain("Nunca envie o prompt total");
    expect(bundle.variants[0]?.productionNotes).toContain(
      '"GERE SOMENTE X/4; NÃO GERE 1/4"',
    );
  });

  it("migrates a persisted carousel prompt without regenerating its slide copy", () => {
    const slidePrompts = [1, 2, 3, 4].map(
      (slide) =>
        `SLIDE ${slide}\nFAMÍLIA DE LAYOUT: foto-dominante\nASSINATURA VISUAL: use um círculo com lc e o nome lucro caseiro.\nCopy original ${slide}.`,
    );
    const data = {
      adStrategy: plan,
      copyBundle: {
        variants: [
          {
            channel: "instagram",
            format: "carrossel",
            headline: "Venda entrou hoje",
            body: "Organize cada movimento.",
            slidePrompts,
            productionNotes: "Contrato antigo que repete a capa.",
            cta: "Organize agora.",
          },
        ],
      },
    };

    const normalized = normalizeStoredCarouselProductionNotes(data);
    const bundle = MarketingCreativeBundleSchema.parse(normalized.copyBundle);

    expect(normalized).not.toBe(data);
    const migratedSlidePrompts = bundle.variants[0]!.slidePrompts;
    migratedSlidePrompts.forEach((slidePrompt, index) => {
      expect(slidePrompt).toContain(`Copy original ${index + 1}.`);
      expect(slidePrompt).toContain("GESTO LIMA: forma=");
      expect(slidePrompt).toContain("Este gesto é exclusivo deste slide");
      expect(slidePrompt).toContain(CANONICAL_LOGO_GUARDRAIL);
      expect(slidePrompt).not.toContain("círculo com lc");
    });
    const gestureLines = migratedSlidePrompts.map((slidePrompt) =>
      slidePrompt.split("\n").find((line) => line.startsWith("GESTO LIMA:")),
    );
    expect(new Set(gestureLines).size).toBe(4);
    expect(bundle.variants[0]?.productionNotes).toBe(
      [carouselExecutionContract(4), ...migratedSlidePrompts].join("\n\n"),
    );
    expect(data.copyBundle.variants[0]?.productionNotes).toBe(
      "Contrato antigo que repete a capa.",
    );
  });

  it("rejects a carousel that repeats the side-by-side photo and text template", () => {
    const bundle = MarketingCreativeBundleSchema.parse({
      variants: [
        {
          channel: "instagram",
          format: "carrossel",
          headline: "Venda entrou hoje",
          body: "[APOIO] <<< Organize cada movimento separadamente. >>>",
          slidePrompts: [1, 2, 3, 4].map(
            (slide) =>
              `SLIDE ${slide}\nFAMÍLIA DE LAYOUT: divisao-vertical\n${CANONICAL_LOGO_GUARDRAIL}\nFoto de um lado e texto do outro.`,
          ),
          productionNotes: carouselExecutionContract(4),
          cta: "Organize agora.",
        },
      ],
    });

    expect(creativeBundleContractViolations(bundle, plan)).toEqual(
      expect.arrayContaining([
        "Variante 1: deve usar ao menos 3 famílias de layout diferentes.",
        "Variante 1: repete a mesma família de layout em sequência.",
        "Variante 1: usa divisao-vertical mais de uma vez no mesmo carrossel.",
      ]),
    );
  });

  it("rejects a carousel that repeats the same lime V across slides", () => {
    const bundle = MarketingCreativeBundleSchema.parse({
      variants: [
        {
          channel: "instagram",
          format: "carrossel",
          headline: "Venda entrou hoje",
          body: "[APOIO] <<< Organize cada movimento separadamente. >>>",
          slidePrompts: CAROUSEL_LAYOUT_FAMILIES.slice(0, 4).map(
            (family, index) =>
              `SLIDE ${index + 1}\nFAMÍLIA DE LAYOUT: ${family}\nGESTO LIMA: forma=${index % 2 === 0 ? "V aberto" : "chevron inclinado"}; posição=canto ${index + 1}; função=conduzir a leitura.\n${CANONICAL_LOGO_GUARDRAIL}`,
          ),
          productionNotes: carouselExecutionContract(4),
          cta: "Organize agora.",
        },
      ],
    });

    expect(creativeBundleContractViolations(bundle, plan)).toContain(
      "Variante 1: repete a mesma forma do gesto lima entre slides.",
    );
  });

  it("rejects an AI character in every visual variation except the editorial one", () => {
    const bundle = MarketingCreativeBundleSchema.parse({
      variants: [
        {
          channel: "instagram",
          format: "carrossel",
          headline: "Venda com clareza",
          body: "VARIAÇÃO VISUAL: Produto ou serviço em ação",
          slidePrompts: [1, 2, 3, 4].map(
            (slide) =>
              `SLIDE ${slide}\nFAMÍLIA DE LAYOUT: ${CAROUSEL_LAYOUT_FAMILIES[slide - 1]}\n${CANONICAL_LOGO_GUARDRAIL}\nVARIAÇÃO VISUAL: Produto ou serviço em ação\nPersonagem consistente: pessoa brasileira jovem em seu negócio.`,
          ),
          productionNotes: carouselExecutionContract(4),
          cta: "Organize agora.",
        },
      ],
    });

    expect(creativeBundleContractViolations(bundle, plan)).toEqual(
      expect.arrayContaining([
        "Variante 1: slidePrompts[0] omite a proibição de pessoas geradas por IA da variação selecionada.",
        "Variante 1: a variação visual selecionada proíbe pessoa ou personagem gerada por IA.",
      ]),
    );
  });

  it("accepts object-led prompts with an explicit non-human variation contract", () => {
    const bundle = MarketingCreativeBundleSchema.parse({
      variants: [
        {
          channel: "instagram",
          format: "carrossel",
          headline: "Venda com clareza",
          body: "VARIAÇÃO VISUAL: Produto ou serviço em ação",
          slidePrompts: [1, 2, 3, 4].map(
            (slide) =>
              `SLIDE ${slide}\nFAMÍLIA DE LAYOUT: ${CAROUSEL_LAYOUT_FAMILIES[slide - 1]}\n${limeGestures.at(slide - 1)}\n${CANONICAL_LOGO_GUARDRAIL}\nVARIAÇÃO VISUAL: Produto ou serviço em ação\n${NON_HUMAN_VISUAL_GUARDRAIL}\nMostre o produto, o ambiente e as ferramentas indispensáveis.`,
          ),
          productionNotes: carouselExecutionContract(4),
          cta: "Organize agora.",
        },
      ],
    });

    expect(creativeBundleContractViolations(bundle, plan)).toEqual([]);
  });

  it("rejects an AI-character carousel made only of character portraits", () => {
    const bundle = MarketingCreativeBundleSchema.parse({
      variants: [
        {
          channel: "instagram",
          format: "carrossel",
          headline: "Venda com clareza",
          body: "VARIAÇÃO VISUAL: Editorial com personagem IA",
          slidePrompts: [
            "foto-dominante",
            "campo-tipografico",
            "recorte-editorial",
            "encerramento-editorial",
          ].map(
            (family, index) =>
              `SLIDE ${index + 1}\nFAMÍLIA DE LAYOUT: ${family}\n${CANONICAL_LOGO_GUARDRAIL}\nVARIAÇÃO VISUAL: Editorial com personagem IA\n${AI_CHARACTER_CAROUSEL_GUARDRAIL}\nRetrato editorial da mesma personagem.`,
          ),
          productionNotes: carouselExecutionContract(4),
          cta: "Organize agora.",
        },
      ],
    });

    expect(creativeBundleContractViolations(bundle, plan)).toEqual(
      expect.arrayContaining([
        "Variante 1: a variação Editorial com personagem IA exige ao menos um slide interface-real.",
        "Variante 1: a variação Editorial com personagem IA exige uma cena explícita de interação entre personagem e tela.",
      ]),
    );
  });

  it("accepts an AI-character carousel that alternates character, typography and screens", () => {
    const families = [
      "foto-dominante",
      "campo-tipografico",
      "recorte-editorial",
      "interface-real",
    ];
    const bundle = MarketingCreativeBundleSchema.parse({
      variants: [
        {
          channel: "instagram",
          format: "carrossel",
          headline: "Venda com clareza",
          body: "VARIAÇÃO VISUAL: Editorial com personagem IA",
          slidePrompts: families.map(
            (family, index) =>
              `SLIDE ${index + 1}\nFAMÍLIA DE LAYOUT: ${family}\n${limeGestures.at(index)}\n${CANONICAL_LOGO_GUARDRAIL}\nVARIAÇÃO VISUAL: Editorial com personagem IA\n${AI_CHARACTER_CAROUSEL_GUARDRAIL}\n${
                index === 2
                  ? "INTERAÇÃO PERSONAGEM-TELA: a mesma personagem usa um tablet com a tela real de cálculo confirmada."
                  : "Alterne a função narrativa deste slide dentro da campanha."
              }`,
          ),
          productionNotes: carouselExecutionContract(4),
          cta: "Organize agora.",
        },
      ],
    });

    expect(creativeBundleContractViolations(bundle, plan)).toEqual([]);
  });

  it("parses a creative bundle without requiring raw JSON UI", () => {
    const result = parseCreativeBundle(
      `Texto antes\n${JSON.stringify({
        variants: [
          {
            channel: "instagram",
            format: "carrossel",
            headline: "Pare de chutar o preço",
            hook: "Você sabe quanto sobra desta encomenda?",
            landing: "O preço parece certo até os custos invisíveis entrarem.",
            body: "Some custos, tempo e margem.",
            retentionBeats: ["Mostrar um custo esquecido"],
            productionNotes: "Usar uma encomenda e a tela real do produto.",
            evidence: "Demonstração do fluxo publicado.",
            cta: "Salve para calcular depois.",
          },
        ],
        reuseMap: ["Levar a headline para Stories"],
        qualityReview: {
          ready: true,
          score: 91,
          criteria: {
            congruence: 95,
            specificity: 90,
            novelty: 86,
            evidenceSafety: 96,
            concision: 88,
          },
          strengths: ["Demonstração específica"],
          warnings: [],
          nextTest: "Comparar bastidor com demonstração direta.",
        },
      })}\nTexto depois`,
    );
    expect(result?.variants).toHaveLength(1);
    expect(result?.reuseMap).toEqual(["Levar a headline para Stories"]);
    expect(result?.variants[0]?.landing).toContain("custos invisíveis");
    expect(result?.qualityReview.ready).toBe(true);
    expect(result?.qualityReview.criteria.evidenceSafety).toBe(96);
  });

  it("keeps legacy plans and creative bundles compatible through defaults", () => {
    const legacyPlan = parseCampaignPlan(
      '{"name":"Plano antigo","channels":[],"messages":{},"creativeNeeds":[],"kpis":[]}',
    );
    expect(legacyPlan?.research.audienceLanguage).toEqual([]);
    expect(legacyPlan?.creativeStrategy.bigIdea).toBe("");

    const legacyBundle = parseCreativeBundle(
      '{"variants":[{"channel":"instagram","format":"post","headline":"Teste","body":"Corpo","cta":"Saiba mais"}],"reuseMap":[]}',
    );
    expect(legacyBundle?.variants[0]?.retentionBeats).toEqual([]);
    expect(legacyBundle?.qualityReview.ready).toBe(false);
  });
});
