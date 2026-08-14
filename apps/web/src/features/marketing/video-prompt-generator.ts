import {
  VideoPromptProjectInputSchema,
  type CharacterProfileInput,
  type SceneMovementAction,
  type SceneMovementPlan,
  type VideoPromptOutput,
  type VideoPromptProjectInput,
  type VideoPromptQualityWarning,
  type VideoPromptSimilarityWarning,
  type VideoPromptTool,
} from "@lucro-caseiro/contracts";

export const videoFormats = [
  { value: "short-vertical", label: "Vídeo curto vertical", meta: "9:16" },
  { value: "feed-vertical", label: "Feed vertical", meta: "4:5" },
  { value: "square", label: "Quadrado", meta: "1:1" },
  { value: "horizontal", label: "Horizontal", meta: "16:9" },
  { value: "custom", label: "Personalizado", meta: "livre" },
] as const;

export const videoDurations = [
  { value: 8, label: "6–8 s" },
  { value: 15, label: "10–15 s" },
  { value: 30, label: "20–30 s" },
  { value: 50, label: "40–50 s" },
] as const;

export const videoObjectives = [
  ["introduce-brand", "Apresentar o Lucro Caseiro"],
  ["demonstrate-feature", "Demonstrar uma funcionalidade"],
  ["explain-problem", "Explicar um problema"],
  ["teach-process", "Ensinar um processo"],
  ["show-in-action", "Mostrar produto ou serviço em ação"],
  ["ugc", "Criar conteúdo UGC"],
  ["advertisement", "Gerar anúncio"],
  ["authority", "Criar vídeo de autoridade"],
  ["call-to-action", "Fazer convite ou chamada para ação"],
  ["custom", "Personalizado"],
] as const;

export const visualModes = [
  [
    "consistent-character",
    "Com personagem consistente",
    "Reutiliza uma Ficha de Identidade e preserva os atributos bloqueados.",
  ],
  [
    "new-presenter",
    "Criar influenciadora com IA",
    "Cria uma identidade fictícia original, suas pranchas de referência e cenas consistentes.",
  ],
  [
    "one-off-character",
    "Com personagem pontual",
    "Usa uma pessoa fictícia apenas neste projeto.",
  ],
  [
    "no-character",
    "Sem personagem",
    "Constrói a narrativa com cena, objeto, tipografia e som.",
  ],
  [
    "product-environment",
    "Produto ou ambiente em ação",
    "O foco é a atividade real, sem apresentador.",
  ],
  [
    "real-interface",
    "Demonstração da interface",
    "Prioriza capturas ou gravações reais fornecidas.",
  ],
  [
    "hybrid-character-interface",
    "Personagem + interface real",
    "Abre e fecha com personagem e intercala a interface comprovada.",
  ],
] as const;

export const lucroCaseiroTopics = [
  "Precificação guiada",
  "Catálogo público",
  "Vendas, pedidos e clientes",
  "Estoque e compras",
  "Financeiro e lucro real",
  "Fiado e cobranças",
  "Custos, preço e margem",
  "Rotina do pequeno negócio",
  "Tema personalizado",
] as const;

export const environments = [
  "Escritório",
  "Ateliê",
  "Cozinha de produção",
  "Loja",
  "Balcão de atendimento",
  "Estoque",
  "Ambiente residencial",
  "Personalizado",
] as const;

export const scriptModes = [
  ["automatic", "Gerar roteiro automaticamente"],
  ["manual", "Escrever roteiro manual"],
  ["imported", "Importar roteiro"],
  ["visual-only", "Somente cenas visuais"],
  ["full", "Fala, narração e legendas"],
] as const;

export const movementCategories = [
  ["character", "Personagem"],
  ["expression-gaze", "Expressão e olhar"],
  ["gesture-hands", "Gestos e mãos"],
  ["camera", "Câmera"],
  ["object", "Objetos"],
  ["environment", "Ambiente"],
  ["frame-entry-exit", "Entrada e saída"],
  ["transition", "Transição"],
] as const;

export const movementIntensities = [
  ["almost-static", "Quase estático"],
  ["subtle-natural", "Sutil e natural"],
  ["conversational", "Conversacional"],
  ["dynamic", "Dinâmico"],
  ["energetic", "Enérgico"],
  ["custom", "Personalizado"],
] as const;

export const movementSpeeds = [
  ["very-slow", "Muito lenta"],
  ["slow", "Lenta"],
  ["natural", "Natural"],
  ["fast", "Rápida"],
  ["custom", "Personalizada"],
] as const;

export const movementPresets = [
  [
    "presenter-talking",
    "Apresentadora conversando",
    "Respiração natural, expressão responsiva, um gesto por frase e câmera quase estática.",
  ],
  [
    "phone-demo",
    "Demonstração no celular",
    "Olhar e toque plausíveis no aparelho antes de transferir a atenção para a câmera.",
  ],
  [
    "business-routine",
    "Rotina do negócio",
    "Uma ação funcional central: organizar, conferir, posicionar ou consultar.",
  ],
  [
    "character-interface",
    "Personagem + interface",
    "Encerra o gesto antes do corte e preserva posição para a gravação real seguinte.",
  ],
  [
    "no-character",
    "Vídeo sem personagem",
    "Movimento concentrado em objetos, câmera, luz e ambiente.",
  ],
  [
    "spontaneous-ugc",
    "UGC espontâneo",
    "Handheld mínimo, ajustes posturais discretos, pausas humanas e gestos curtos.",
  ],
] as const;

export const movementSuggestions: Record<
  SceneMovementAction["category"],
  readonly string[]
> = {
  character: [
    "permanece parada e respira naturalmente",
    "transfere suavemente o peso entre as pernas",
    "caminha em direção à câmera",
    "caminha lateralmente",
    "entra no ambiente",
    "senta-se",
    "levanta-se",
    "vira o tronco",
    "inclina-se levemente para frente",
    "aproxima-se da bancada",
    "pega um objeto",
    "apoia um objeto",
    "usa o celular",
    "aponta para um elemento real",
    "organiza produtos ou materiais",
    "interage com outra pessoa",
    "movimento personalizado",
  ],
  "expression-gaze": [
    "olha diretamente para a câmera",
    "olha para o objeto",
    "alterna entre objeto e câmera",
    "acompanha um elemento em movimento",
    "desvia o olhar brevemente",
    "sorri de forma gradual",
    "demonstra dúvida",
    "demonstra concentração",
    "reage a uma informação",
    "expressão personalizada",
  ],
  "gesture-hands": [
    "gesto curto de palma aberta",
    "toque único e plausível no objeto",
    "deslize curto no celular",
    "mãos relaxadas junto ao corpo",
    "gesto personalizado",
  ],
  camera: [
    "câmera fixa",
    "handheld sutil de smartphone",
    "aproximação lenta",
    "afastamento lento",
    "pan para esquerda",
    "pan para direita",
    "tilt para cima",
    "tilt para baixo",
    "travelling lateral",
    "acompanhamento da personagem",
    "órbita curta",
    "mudança de foco",
    "movimento personalizado",
  ],
  object: [
    "objeto é levantado e apoiado com controle",
    "produto é reposicionado sobre a bancada",
    "embalagem reage ao toque",
    "movimento personalizado",
  ],
  environment: [
    "cortina reage suavemente ao ar",
    "folhas se movimentam discretamente",
    "vapor realista sobe lentamente",
    "luz natural varia sutilmente",
    "tecido acompanha o corpo",
    "objetos reagem ao toque",
    "pessoas desfocadas passam ao fundo",
    "movimento personalizado",
  ],
  "frame-entry-exit": [
    "permanece enquadrada durante toda a cena",
    "entra pela esquerda",
    "entra pela direita",
    "sai pela esquerda",
    "sai pela direita",
    "movimento personalizado",
  ],
  transition: [
    "encerra o gesto antes do corte",
    "mantém a posição para o próximo plano",
    "direciona o olhar para motivar o corte",
    "transição personalizada",
  ],
};

export type VideoPromptVersionRecord = {
  id: string;
  projectId: string;
  version: number;
  canonicalPrompt: VideoPromptOutput;
  adaptedPrompt: string | null;
  targetTool: string | null;
  qualityWarnings: VideoPromptQualityWarning[];
  similarityWarnings: VideoPromptSimilarityWarning[];
  generationContext: Record<string, unknown>;
  createdAt: string;
};

export type VideoPromptProjectRecord = VideoPromptProjectInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
  versions: VideoPromptVersionRecord[];
};

export type CharacterProfileRecord = CharacterProfileInput & {
  id: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  projects?: Array<{ id: string; title: string; status: string; updatedAt: string }>;
};

export type VideoPromptGenerationResult =
  | {
      needsSimilarityDecision: true;
      similarityWarnings: VideoPromptSimilarityWarning[];
      qualityWarnings: VideoPromptQualityWarning[];
    }
  | {
      needsSimilarityDecision: false;
      version: VideoPromptVersionRecord;
      similarityWarnings: VideoPromptSimilarityWarning[];
      qualityWarnings: VideoPromptQualityWarning[];
      telemetry: { model: string; parseSucceeded: boolean };
    };

export type SceneMovementGenerationResult = {
  movementPlan: SceneMovementPlan;
  qualityWarnings: VideoPromptQualityWarning[];
  telemetry: { model: string; parseSucceeded: boolean };
};

export type { VideoPromptOutput, VideoPromptProjectInput, VideoPromptTool };
export type { SceneMovementAction, SceneMovementPlan };

export function createEmptyVideoPromptProject(
  brandId = "lucro-caseiro",
): VideoPromptProjectInput {
  return {
    brandId,
    title: "Novo vídeo do Lucro Caseiro",
    format: "short-vertical",
    aspectRatio: "9:16",
    duration: 50,
    objective: "introduce-brand",
    customObjective: "",
    visualMode: "hybrid-character-interface",
    topicId: null,
    offerId: null,
    featureId: null,
    audienceId: null,
    funnelStage: "consideração",
    angle: "",
    cta: "Conheça o Lucro Caseiro",
    destinationChannels: ["Instagram Reels"],
    targetTool: null,
    characterProfileId: null,
    voiceProfileId: null,
    contextVersion: new Date().toISOString().slice(0, 10),
    status: "draft",
    scriptMode: "automatic",
    creativeBrief: {
      topic: "Apresentar como o Lucro Caseiro apoia a rotina do pequeno negócio",
      audience: "Quem empreende e precisa organizar a rotina sem perder simplicidade",
      painOrDesire: "Ter mais clareza sobre custos, vendas e próximos passos",
      supportingFacts: [],
      restrictions: ["Não prometer resultado financeiro", "Não inventar interface"],
      productEvidenceIds: [],
    },
    direction: {
      character: {
        expression: "natural e responsiva",
        energy: "próxima",
        eyeContact: "alternado entre ação e câmera",
        gestures: "gestos naturais ligados à demonstração",
        posture: "relaxada e ativa",
        movementSpeed: "moderada",
      },
      voice: {
        language: "português brasileiro",
        vocalGender: "",
        apparentAge: "adulta",
        warmth: "calorosa",
        energy: "próxima",
        speed: "moderada",
        pauses: "pausas e respiração naturais",
        intonation: "conversacional, sem entonação de locutora publicitária",
        savedVoice: "",
      },
      environment: "Cozinha de produção",
      camera: {
        focalLength: "35 mm equivalente",
        shot: "plano médio",
        height: "altura dos olhos",
        angle: "frontal levemente lateral",
        movement: "movimento suave e motivado pela ação",
        depthOfField: "fundo levemente desfocado",
        stability: "estável com respiração natural",
        speed: "moderada",
        perspective: "smartphone editorial plausível",
      },
      lighting: "luz natural lateral, suave e difusa",
      realism: "editorial",
    },
    scenes: defaultScenes(50, true),
  };
}

export function createEmptyCharacterProfile(
  brandId = "lucro-caseiro",
): CharacterProfileInput {
  return {
    brandId,
    internalName: "",
    sourceType: "original-description",
    consentMode: "aesthetic-reference-only",
    immutableTraits: {
      apparentAge: "adulta, entre 28 e 38 anos",
      faceShape: "",
      skinTone: "",
      eyes: "",
      eyebrows: "",
      nose: "",
      lips: "",
      jaw: "",
      hair: "",
      skinTexture: "natural, com pequenas variações de tonalidade",
      approximateHeight: "",
      bodyProportions: "humanas e plausíveis",
      visualPersonality: "brasileira, acessível, segura e espontânea",
      distinctiveFeatures: "",
    },
    variableTraits: {
      clothing: "",
      accessories: "",
      allowedHairstyle: "",
      expression: "natural e responsiva",
      bodyPosition: "postura relaxada e ativa",
      action: "",
      environment: "",
      lighting: "luz natural lateral",
      framing: "plano médio",
    },
    lockedTraits: [],
    referenceAssets: [],
    identityPrompt: "",
    negativePrompt: "",
  };
}

export type InfluencerReferenceKitStep = {
  id: "base" | "face-board" | "body-board" | "complete-scene" | "animate";
  number: string;
  title: string;
  purpose: string;
  aspectRatio: string;
  references: string;
  prompt: string;
};

const influencerPhotographicRealismPrompt = `REALISMO FOTOGRÁFICO OBRIGATÓRIO: aparência de pessoa real fotografada, não de avatar, render 3D ou campanha de cosméticos. Pele com microtextura irregular visível, poros discretos, pequenas diferenças naturais de tonalidade, leves marcas de expressão, sombra suave abaixo dos olhos e assimetrias faciais sutis. Preservar a identidade e a idade aparente da personagem.

Controlar os reflexos da pele: brilho natural localizado e muito discreto, sem efeito oleoso, acetinado, encerado ou plastificado. Não produzir “glow” artificial nas maçãs do rosto, testa, nariz ou queixo. Não aplicar suavização de pele, filtro de beleza, retoque glamour, HDR, nitidez excessiva ou acabamento publicitário.

Iluminação fotográfica lateral ampla e difusa, com contraste moderado e preenchimento reduzido. Evitar ring light, beauty dish frontal, luz simétrica, reflexos especulares intensos e luz de recorte brilhante. Balanço de branco neutro, cores contidas e tons de pele naturais, sem saturação alaranjada.

Cabelo com fios individualizados, volume plausível e alguns fios soltos naturais; sem aparência moldada, excessivamente brilhante ou perfeitamente organizada. Maquiagem mínima e realista, sem iluminador aparente.

Fotografia editorial documental capturada em câmera full-frame, lente de 50 mm, exposição natural, profundidade de campo moderada e processamento semelhante a arquivo RAW com correção de cor discreta.

Evitar: pele de porcelana, pele encerada, brilho cosmético, face perfeitamente simétrica, olhos vítreos, cabelo plástico, glamour de banco de imagens, CGI, render 3D, filtro de beleza e aparência de influenciadora virtual genérica.`;

function removeGlossyQualityBuzzwords(prompt: string) {
  return prompt
    .replace(/hiper-realista/giu, "")
    .replace(/hiper realista/giu, "")
    .replace(/\b4k\b/giu, "")
    .replace(/\bpremium\b/giu, "")
    .replace(/qualidade extrema/giu, "")
    .replaceAll("  ", " ");
}

export function createInfluencerReferenceKit(
  character: CharacterProfileInput,
  options: { scene?: string } = {},
): InfluencerReferenceKitStep[] {
  const identity = characterIdentitySummary(character);
  const variableDirection = characterVariableSummary(character);
  const scene =
    options.scene?.trim() ||
    [
      character.variableTraits.action,
      character.variableTraits.environment,
      character.variableTraits.clothing,
    ]
      .filter(Boolean)
      .join(". ") ||
    "A influenciadora mostra uma situação cotidiana e plausível de um pequeno negócio brasileiro";
  const identitySource =
    character.consentMode === "authorized-identity"
      ? "As referências pertencem a uma identidade com autorização registrada. Preserve somente os traços autorizados na ficha."
      : "Crie uma pessoa adulta fictícia e original. Referências humanas servem apenas para direção estética geral; não copie rosto, biometria ou identidade de uma pessoa real.";
  const continuityContract = [
    identitySource,
    `IDENTIDADE FIXA: ${identity}.`,
    "A mesma pessoa deve aparecer em todos os quadros: preserve idade aparente, estrutura facial, pele, olhos, cabelo, altura e proporções corporais.",
    "Textura de pele natural, anatomia humana plausível, cinco dedos quando as mãos estiverem visíveis e nenhuma aparência plástica.",
  ].join(" ");
  const negativePrompt =
    "Evite mudança de identidade, mistura de rostos, rejuvenescimento, embelezamento automático, pele plástica, assimetria ocular, membros ou dedos extras, texto, marca-d'água, logotipo e interface inventada.";

  const steps: InfluencerReferenceKitStep[] = [
    {
      id: "base",
      number: "01",
      title: "Imagem-base",
      purpose: "Definir a identidade antes de criar variações.",
      aspectRatio: "9:16",
      references: "Nenhuma referência obrigatória",
      prompt: `${continuityContract}\n\n${influencerPhotographicRealismPrompt}\n\nCrie um retrato fotográfico vertical de corpo inteiro, da cabeça aos pés, com a personagem sozinha, em pé e voltada para a câmera. Postura neutra e relaxada, braços visíveis, roupa simples sem estampas, fundo liso claro, luz natural suave e câmera na altura dos olhos. A imagem deve funcionar como fonte de identidade, sem pose de moda, sem cenário narrativo e sem objetos cobrindo rosto ou corpo.\n\n${negativePrompt}`,
    },
    {
      id: "face-board",
      number: "02",
      title: "Prancha de rosto 3×3",
      purpose: "Fixar o rosto em ângulos diferentes.",
      aspectRatio: "16:9",
      references: "Anexe a imagem-base",
      prompt: `${continuityContract}\n\n${influencerPhotographicRealismPrompt}\n\nUse a imagem-base anexada como âncora. Crie uma única prancha horizontal 3×3 com nove retratos fechados da mesma personagem: frente neutra; três-quartos esquerdo; perfil esquerdo; três-quartos direito; perfil direito; olhar levemente para cima; olhar levemente para baixo; vista posterior com o rosto voltando sobre o ombro esquerdo; vista posterior com o rosto voltando sobre o ombro direito. Mesma lente, distância, luz, cabelo, roupa e expressão neutra em todos os quadros. Cada célula deve conter uma única cabeça completa e não pode mesclar traços entre ângulos.\n\n${negativePrompt}`,
    },
    {
      id: "body-board",
      number: "03",
      title: "Prancha de corpo",
      purpose: "Fixar altura, silhueta e proporções.",
      aspectRatio: "16:9",
      references: "Anexe a imagem-base e a prancha de rosto",
      prompt: `${continuityContract}\n\n${influencerPhotographicRealismPrompt}\n\nUse as referências anexadas como âncoras. Crie uma prancha horizontal de corpo inteiro com seis vistas da mesma personagem: frente; três-quartos esquerdo; perfil esquerdo; costas; perfil direito; três-quartos direito. Cabeça e pés inteiros em todos os quadros, postura neutra, braços relaxados, mesma roupa básica, escala, distância focal, luz e fundo. Preserve exatamente altura, silhueta e proporções; a prancha é técnica e não uma sessão de moda.\n\n${negativePrompt}`,
    },
    {
      id: "complete-scene",
      number: "04",
      title: "Cena completa com a influencer",
      purpose: "Gerar personagem, ambiente e ação juntos no arquivo final.",
      aspectRatio: "9:16",
      references:
        "Anexe as pranchas de rosto e corpo e, quando houver, referências reais do produto e do ambiente",
      prompt: `${continuityContract}\n\n${influencerPhotographicRealismPrompt}\n\nBRIEFING VISUAL COMPLETO: ${scene}. DIREÇÃO VARIÁVEL: ${variableDirection}.\n\nCrie uma única fotografia vertical 9:16 final, nunca prancha, grade, colagem ou estudo. Construa a personagem e todo o cenário na mesma composição: a influencer deve estar fisicamente inserida no ambiente, com escala, perspectiva, sombras e luz coerentes, realizando a ação descrita com expressão, postura e gesto naturais. Ela não pode posar parada como retrato; deve interagir de modo visível com o produto, dispositivo, utensílio ou elemento central da cena.\n\nO cenário é parte da narrativa, não um fundo genérico. Mostre espaço suficiente para entender onde a ação acontece e componha arquitetura, superfícies, mobiliário, objetos de trabalho, sinais de uso cotidiano, primeiro plano, plano médio e profundidade. Complete apenas os detalhes ambientais plausíveis que estiverem ausentes do briefing, sem trocar a ação, a roupa ou o local definidos. Preserve a legibilidade das mãos e do objeto manipulado. Se houver tela ou interface, use somente referência real anexada, sem inventar telas, textos, logotipos ou funcionalidades.\n\nUse um único enquadramento editorial documental, espontâneo e funcional à ação. Entregue a cena pronta para ser usada como primeiro quadro de animação, com continuidade espacial clara e espaço de movimento plausível. Não inclua texto sobreposto na imagem.\n\n${negativePrompt}`,
    },
    {
      id: "animate",
      number: "05",
      title: "Animar a foto",
      purpose: "Gerar movimento curto sem deformar a personagem.",
      aspectRatio: "9:16 · 6 s",
      references: "Anexe a foto vertical extraída",
      prompt: `${influencerPhotographicRealismPrompt}\n\nUse a imagem anexada como primeiro quadro e âncora de identidade. Anime por 6 segundos com uma única ação dominante coerente com esta cena: ${scene}. A personagem respira, transfere o peso discretamente e executa apenas o gesto necessário; expressão e olhar respondem à ação. Pessoas, animais, roupa e objetos reagem com física sutil. Câmera fixa ou handheld mínimo de smartphone, sem movimento cinematográfico complexo. Preserve rosto, corpo, roupa, acessórios, iluminação e cenário do início ao fim. Sem pés deslizando, membros deformados, olhar congelado, sorriso artificial, objetos flutuando, teletransporte ou mudança de identidade.`,
    },
  ];
  return steps.map((step) => ({
    ...step,
    prompt: removeGlossyQualityBuzzwords(step.prompt),
  }));
}

function characterIdentitySummary(character: CharacterProfileInput) {
  const labels: Record<keyof CharacterProfileInput["immutableTraits"], string> = {
    apparentAge: "idade aparente",
    faceShape: "formato facial",
    skinTone: "pele",
    eyes: "olhos",
    eyebrows: "sobrancelhas",
    nose: "nariz",
    lips: "lábios",
    jaw: "mandíbula",
    hair: "cabelo",
    skinTexture: "textura da pele",
    approximateHeight: "altura",
    bodyProportions: "proporções corporais",
    visualPersonality: "personalidade visual",
    distinctiveFeatures: "características distintivas",
  };
  const summary = Object.entries(character.immutableTraits)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => `${labels[key as keyof typeof labels]}: ${value.trim()}`);
  return summary.join("; ") || "adulta brasileira, aparência natural e original";
}

function characterVariableSummary(character: CharacterProfileInput) {
  const labels: Record<keyof CharacterProfileInput["variableTraits"], string> = {
    clothing: "roupa",
    accessories: "acessórios",
    allowedHairstyle: "penteado",
    expression: "expressão",
    bodyPosition: "posição corporal",
    action: "ação",
    environment: "ambiente",
    lighting: "iluminação",
    framing: "enquadramento",
  };
  const summary = Object.entries(character.variableTraits)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => `${labels[key as keyof typeof labels]}: ${value.trim()}`);
  return summary.join("; ") || "expressão natural, postura relaxada e luz suave";
}

export function defaultScenes(duration: number, characterPresent: boolean) {
  const ratios =
    duration >= 40
      ? [0, 4, 12, 30, 40, duration]
      : [0, 0.1, 0.27, 0.6, 0.8, 1].map((value) => Math.round(value * duration));
  const roles = [
    "Gancho",
    "Contexto real",
    "Demonstração",
    "Benefício concreto",
    "Encerramento e CTA",
  ];
  return roles.map((narrativeRole, order) => {
    const sceneDuration = ratios[order + 1]! - ratios[order]!;
    const present = characterPresent && (order === 0 || order === 4);
    return {
      order,
      startTime: ratios[order]!,
      endTime: ratios[order + 1]!,
      narrativeRole,
      characterPresent: present,
      environment: "",
      action: "",
      characterDirection: characterPresent
        ? "expressão, postura e gesto ligados à ação"
        : "",
      cameraDirection: "",
      lightingDirection: "",
      dialogue: "",
      narration: "",
      onScreenText: "",
      transition: order === 4 ? "encerramento estável" : "corte limpo",
      productEvidenceIds: [],
      continuityNotes: "",
      movementPlan: createMovementPlan(
        present ? "presenter-talking" : "no-character",
        sceneDuration,
      ),
    };
  });
}

export function createMovementPlan(
  preset: SceneMovementPlan["preset"],
  duration: number,
): SceneMovementPlan {
  const safeDuration = Math.max(0.5, duration);
  const at = (ratio: number) => Math.round(safeDuration * ratio * 10) / 10;
  const action = (
    category: SceneMovementAction["category"],
    type: string,
    startTime: number,
    endTime: number,
    instruction: string,
    extra: Partial<SceneMovementAction> = {},
  ): SceneMovementAction => ({
    category,
    type,
    startTime,
    endTime: Math.max(startTime + 0.1, endTime),
    instruction,
    initialPosition: "",
    action: type,
    direction: "",
    speed: "natural",
    customSpeed: "",
    amplitude: "pequena e controlada",
    finalPosition: "",
    involvedSubject: "",
    intensity: "subtle-natural",
    customIntensity: "",
    continuity: "",
    hand: "none",
    handsInitialPosition: "relaxadas e visíveis somente quando necessárias",
    touchedObject: "",
    gesture: "",
    distance: "",
    stability: "estável",
    startPoint: "",
    endPoint: "",
    trackedObject: "",
    primary: false,
    ...extra,
  });

  let actions: SceneMovementAction[];
  if (preset === "no-character") {
    actions = [
      action(
        "object",
        "produto é reposicionado sobre a bancada",
        0,
        at(0.55),
        "Uma mão autorizada reposiciona o objeto lentamente e encerra o contato antes de sair do quadro.",
        { primary: true, involvedSubject: "objeto principal", hand: "right" },
      ),
      action(
        "camera",
        "aproximação lenta",
        at(0.1),
        at(0.9),
        "A câmera faz aproximação muito lenta, sem competir com o objeto.",
        { distance: "aproximadamente 10 cm", stability: "alta" },
      ),
    ];
  } else if (preset === "phone-demo") {
    actions = [
      action(
        "character",
        "usa o celular",
        0,
        at(0.45),
        "A personagem levanta o celular lentamente com a mão direita, mantendo o cotovelo próximo ao corpo.",
        { primary: true, hand: "right", involvedSubject: "celular" },
      ),
      action(
        "expression-gaze",
        "alterna entre objeto e câmera",
        at(0.4),
        at(0.65),
        "Transfere o olhar do aparelho para a câmera antes de iniciar a explicação.",
      ),
      action(
        "gesture-hands",
        "deslize curto no celular",
        at(0.15),
        at(0.3),
        "Executa um único toque ou deslize plausível, sem mostrar conteúdo fictício na tela.",
        { hand: "right", touchedObject: "celular", gesture: "toque ou deslize único" },
      ),
    ];
  } else {
    const primaryType =
      preset === "business-routine"
        ? "organiza produtos ou materiais"
        : "permanece parada e respira naturalmente";
    actions = [
      action(
        "character",
        primaryType,
        0,
        at(0.9),
        preset === "business-routine"
          ? "Executa uma única ação funcional, com contato coerente e sem movimentos concorrentes."
          : "Mantém postura relaxada, respiração discreta e pequenas transferências de peso.",
        { primary: true },
      ),
      action(
        "expression-gaze",
        "alterna entre objeto e câmera",
        0,
        at(0.9),
        "Alterna brevemente o olhar entre a ação e a câmera; não mantém olhar fixo artificial.",
      ),
      action(
        "gesture-hands",
        "gesto curto de palma aberta",
        at(0.45),
        at(0.65),
        "Faz um único gesto curto e compatível com a frase, com dedos relaxados.",
        { gesture: "palma aberta", hand: "left" },
      ),
      action(
        "camera",
        preset === "spontaneous-ugc" ? "handheld sutil de smartphone" : "câmera fixa",
        0,
        safeDuration,
        preset === "spontaneous-ugc"
          ? "Handheld mínimo de smartphone, sem tremor excessivo."
          : "A câmera permanece fixa na altura dos olhos.",
      ),
    ];
  }
  if (preset === "character-interface")
    actions.push(
      action(
        "transition",
        "encerra o gesto antes do corte",
        at(0.75),
        safeDuration,
        "Encerra o gesto e mantém posição corporal compatível antes do corte para a gravação real.",
      ),
    );

  return {
    preset,
    intensity: preset === "spontaneous-ugc" ? "conversational" : "subtle-natural",
    customIntensity: "",
    speed: "natural",
    customSpeed: "",
    actions,
    continuity: {
      initialBodyPosition: "postura relaxada e estável",
      finalBodyPosition: "postura relaxada e estável",
      initialGazeDirection: "câmera",
      finalGazeDirection: "câmera",
      entrySide: "none",
      exitSide: "none",
      heldObjectsStart: [],
      heldObjectsEnd: [],
      objectLocationsStart: "",
      objectLocationsEnd: "",
      clothingAndAccessories: "preservar roupa e acessórios",
      lightingDirection: "luz natural lateral",
      cameraAxis: "eixo frontal",
      movementSpeed: "natural",
    },
    movementPrompt: actions
      .map(
        (item) =>
          `Entre ${item.startTime.toFixed(1)} e ${item.endTime.toFixed(1)} segundos, ${item.instruction}`,
      )
      .join(" "),
    negativePrompt:
      "Sem movimentos bruscos, gestos repetitivos, olhar congelado, mãos atravessando objetos, troca involuntária de mão, câmera tremendo excessivamente ou teletransporte entre posições.",
  };
}

export function updateFormat(
  project: VideoPromptProjectInput,
  format: VideoPromptProjectInput["format"],
) {
  const aspectRatio =
    videoFormats.find((option) => option.value === format)?.meta ?? project.aspectRatio;
  return {
    ...project,
    format,
    aspectRatio: aspectRatio === "livre" ? project.aspectRatio : aspectRatio,
  };
}

export function adaptProjectDuration(project: VideoPromptProjectInput, duration: number) {
  const oldDuration = project.duration;
  return {
    ...project,
    duration,
    scenes: project.scenes.map((scene, order) => {
      const oldSceneDuration = scene.endTime - scene.startTime;
      const startTime = Math.round((scene.startTime / oldDuration) * duration);
      const endTime = Math.max(
        startTime + 1,
        Math.round((scene.endTime / oldDuration) * duration),
      );
      const movementScale = (endTime - startTime) / oldSceneDuration;
      return {
        ...scene,
        order,
        startTime,
        endTime,
        movementPlan: {
          ...scene.movementPlan,
          actions: scene.movementPlan.actions.map((movement) => ({
            ...movement,
            startTime: Math.round(movement.startTime * movementScale * 10) / 10,
            endTime: Math.round(movement.endTime * movementScale * 10) / 10,
          })),
        },
      };
    }),
  };
}

export function validateVideoPromptProject(project: VideoPromptProjectInput) {
  const result = VideoPromptProjectInputSchema.safeParse(project);
  const messages = result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
  if (project.objective === "custom" && !project.customObjective.trim())
    messages.push("Descreva o objetivo personalizado.");
  if (project.format === "custom" && !isValidAspectRatio(project.aspectRatio))
    messages.push("Informe a proporção personalizada como largura:altura.");
  if (project.visualMode === "consistent-character" && !project.characterProfileId)
    messages.push("Selecione uma personagem salva para a modalidade consistente.");
  return [...new Set(messages)];
}

function isValidAspectRatio(value: string) {
  const parts = value.split(":");
  return (
    parts.length === 2 &&
    parts.every((part) => part.trim() !== "" && Number.isFinite(Number(part)))
  );
}

export function serializePromptOutput(output: VideoPromptOutput) {
  return [
    ["RESUMO CRIATIVO", output.creativeSummary],
    ["PROMPT MESTRE", output.masterPrompt],
    ["IDENTIDADE FIXA DA PERSONAGEM", output.fixedCharacterIdentity],
    [
      "DIREÇÃO DE CADA CENA",
      output.sceneDirections
        .map((scene) => `${scene.time} — ${scene.direction}`)
        .join("\n\n"),
    ],
    [
      "MOVIMENTOS POR CENA",
      (output.movementDirections ?? [])
        .map(
          (scene) =>
            `${scene.time} — ${scene.prompt}\nRestrições: ${scene.negativePrompt}`,
        )
        .join("\n\n"),
    ],
    ["FALAS E NARRAÇÃO", output.speechAndNarration],
    ["DIREÇÃO DE CÂMERA", output.cameraDirection],
    ["DIREÇÃO DE ILUMINAÇÃO", output.lightingDirection],
    ["DIREÇÃO DE VOZ", output.voiceDirection],
    ["CONTINUIDADE", output.continuity],
    ["RESTRIÇÕES E PROMPT NEGATIVO", output.restrictionsAndNegativePrompt],
    [
      "MATERIAIS NECESSÁRIOS",
      output.requiredMaterials.map((item) => `- ${item}`).join("\n"),
    ],
    [
      "CHECKLIST ANTES DE GERAR",
      output.preGenerationChecklist.map((item) => `- ${item}`).join("\n"),
    ],
  ]
    .map(([title, body]) => `${title}\n${body}`)
    .join("\n\n");
}
