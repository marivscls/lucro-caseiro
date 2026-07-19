import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

import {
  buildAdCopywriterPrompt,
  buildCampaignStrategistPrompt,
  parseCampaignPlan,
  parseCreativeBundle,
  type BrandProfile,
} from "./campaign-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey)
  throw new Error("Configure GOOGLE_GENERATIVE_AI_API_KEY para rodar ai:eval.");

const google = createGoogleGenerativeAI({ apiKey });
const model = google("gemini-2.5-flash");
const brand: BrandProfile = {
  name: "Lucro Caseiro",
  voice: "Direta, acolhedora, prática e sem promessas de renda.",
  valueProposition: "Ajuda a calcular preços considerando custos, tempo e margem.",
  restrictions: ["Não prometer renda ou resultado garantido", "Não inventar provas"],
  approvedExamples: [],
};

const strategyCases = [
  {
    segment: "pme" as const,
    goal: "leads" as const,
    audience: "Confeiteiras iniciantes que ainda calculam preços no chute",
    offer: "Calculadora do Lucro Caseiro para considerar custos, tempo e margem",
    budget: 300,
  },
  {
    segment: "pme" as const,
    goal: "reactivation" as const,
    audience: "Empreendedoras que criaram a conta, mas não calcularam o primeiro produto",
    offer: "Retomar o primeiro cálculo de preço no Lucro Caseiro",
  },
];

let failures = 0;
for (const [index, input] of strategyCases.entries()) {
  const built = buildCampaignStrategistPrompt(input, {
    instruction: "Não invente funcionalidades, provas ou resultados.",
    knowledge: [],
    resources: [],
  });
  const result = await generateText({ model, prompt: built.prompt });
  const parsed = parseCampaignPlan(result.text);
  const passed = Boolean(
    parsed?.channels.length && parsed.audienceSummary && parsed.offer,
  );
  console.warn(`strategy ${index + 1}: ${passed ? "PASS" : "FAIL"}`);
  if (!passed) failures += 1;
}

const approvedPlan = {
  name: "Preço sem chute",
  segment: "pme" as const,
  goal: "leads" as const,
  audienceSummary: "Confeiteiras iniciantes que calculam preços no chute",
  offer: "Calculadora para considerar custos, tempo e margem",
  research: {
    audienceSlice: "Confeiteiras iniciantes que vendem por encomenda",
    audienceLanguage: ["Não sei quanto sobra"],
    realDesire: "Cobrar com segurança",
    saturatedSolutions: ["Multiplique o custo por três"],
    problemMechanism: "Custos indiretos e tempo ficam fora da conta",
    solutionMechanism: "O cálculo reúne custos, tempo e margem",
    differentiators: ["O cálculo pode virar produto e catálogo"],
    proofs: ["Fluxo publicado do produto"],
    saturationNotes: "Evitar promessas genéricas",
  },
  creativeStrategy: {
    bigIdea: "O valor da venda não é o valor que fica",
    angle: "Custos invisíveis",
    promise: "Enxergar quanto sobra antes de vender",
    reasonToBelieve: "Demonstração do cálculo real",
    stickyName: "Preço sem chute",
    commonEnemy: "Conta incompleta",
    organicInsight: "Bastidores de encomendas geram identificação",
    avatar: "Confeiteira preparando um pedido",
    format: "Vídeo curto de bastidor",
    visualHook: "Pedido pronto e custos surgindo na tela",
    landing: "O preço parece certo até a conta completa aparecer",
    retentionBeats: ["Revelar custo esquecido", "Mostrar o próximo passo"],
    productionNotes: ["Usar a tela real do produto"],
  },
  channels: ["instagram", "whatsapp"],
  messages: { instagram: "Calcule antes de vender", whatsapp: "Revise seu preço" },
  creativeNeeds: ["Carrossel educativo", "Mensagem curta"],
  automation: "Levar para o primeiro cálculo",
  kpis: [{ label: "Cliques", target: "100" }],
  nextBestAction: "Publicar a primeira peça",
};

for (const style of ["promotional", "organic"] as const) {
  const built = buildAdCopywriterPrompt({ plan: approvedPlan, style }, brand);
  const result = await generateText({ model, prompt: built.prompt });
  const parsed = parseCreativeBundle(result.text);
  const output = result.text.toLocaleLowerCase("pt-BR");
  const passed = Boolean(
    parsed?.variants.length === approvedPlan.channels.length &&
    parsed.variants.every((variant) => approvedPlan.channels.includes(variant.channel)) &&
    !output.includes("#boraapp") &&
    !output.includes("foquinhaia"),
  );
  console.warn(`copy ${style}: ${passed ? "PASS" : "FAIL"}`);
  if (!passed) failures += 1;
}

if (failures > 0) {
  throw new Error(`${failures} caso(s) de ai:eval falharam.`);
}
console.warn("ai:eval: todos os casos passaram.");
