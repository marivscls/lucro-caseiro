import type {
  MarketingAiResourceDraft,
  MarketingDocumentInput,
  MarketingLearningPolicy,
  MarketingResourceInput,
  MarketingResourceKind,
} from "@lucro-caseiro/contracts";
import { MarketingAiResourceDraftSchema } from "@lucro-caseiro/contracts";
import { readFile } from "node:fs/promises";

import { NotFoundError, ServiceUnavailableError } from "../../shared/errors";
import { initialMarketingResources } from "./marketing.seed";
import { DEFAULT_MARKETING_SYSTEM_PROMPT } from "./marketing.system-prompt";
import type { MarketingRepoPg } from "./marketing.repo.pg";

export type MarketingAiGenerator = (input: {
  system: string;
  prompt: string;
}) => Promise<{ text: string; model: string }>;

type InitialMarketingDocumentDefinition = {
  slug: string;
  title: string;
  fileName: string;
  tags: readonly string[];
  aiKnowledge: boolean;
};

export const initialMarketingDocumentDefinitions = [
  {
    slug: "estrategia-marketing-vendas",
    title: "Estratégia de marketing e vendas — Lucro Caseiro",
    fileName: "estrategia-marketing-vendas.md",
    tags: ["estratégia", "conteúdo", "vendas", "públicos"],
    aiKnowledge: false,
  },
  {
    slug: "guia-de-mensagens",
    title: "Guia de mensagens e copy",
    fileName: "guia-de-mensagens.md",
    tags: ["mensagens", "copy", "posicionamento", "cta"],
    aiKnowledge: true,
  },
  {
    slug: "publicos-e-contextos",
    title: "Públicos, contextos e linguagem por nicho",
    fileName: "publicos-e-contextos.md",
    tags: ["públicos", "nichos", "linguagem", "pesquisa"],
    aiKnowledge: true,
  },
  {
    slug: "objecoes-e-respostas",
    title: "Objeções e respostas comerciais",
    fileName: "objecoes-e-respostas.md",
    tags: ["vendas", "objeções", "respostas", "conversão"],
    aiKnowledge: true,
  },
  {
    slug: "playbook-de-conteudo",
    title: "Playbook de conteúdo por canal",
    fileName: "playbook-de-conteudo.md",
    tags: ["conteúdo", "canais", "social", "produção"],
    aiKnowledge: true,
  },
  {
    slug: "experimentos-e-metricas",
    title: "Experimentos, funil e métricas",
    fileName: "experimentos-e-metricas.md",
    tags: ["growth", "funil", "métricas", "experimentos"],
    aiKnowledge: true,
  },
  {
    slug: "provas-e-alegacoes",
    title: "Provas, alegações e autorização de uso",
    fileName: "provas-e-alegacoes.md",
    tags: ["provas", "alegações", "governança", "ética"],
    aiKnowledge: true,
  },
  {
    slug: "briefings-e-qualidade",
    title: "Briefings e critérios de qualidade para a IA",
    fileName: "briefings-e-qualidade.md",
    tags: ["ia", "briefing", "qualidade", "checklist"],
    aiKnowledge: true,
  },
] as const satisfies readonly InitialMarketingDocumentDefinition[];

export class MarketingUseCases {
  constructor(
    private repo: MarketingRepoPg,
    private generate?: MarketingAiGenerator,
  ) {}

  listResources(
    userId: string,
    filters?: { kind?: string; status?: string; from?: Date; to?: Date },
  ) {
    return this.repo.listResources(userId, filters);
  }

  createResource(userId: string, input: MarketingResourceInput) {
    return this.repo.createResource(userId, {
      ...input,
      scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
    });
  }

  async updateResource(
    userId: string,
    id: string,
    input: Partial<MarketingResourceInput>,
  ) {
    const { scheduledFor, ...rest } = input;
    const row = await this.repo.updateResource(userId, id, {
      ...rest,
      ...(scheduledFor !== undefined
        ? { scheduledFor: scheduledFor ? new Date(scheduledFor) : null }
        : {}),
    });
    if (!row) throw new NotFoundError("Item de marketing não encontrado");
    return row;
  }

  async deleteResource(userId: string, id: string) {
    if (!(await this.repo.deleteResource(userId, id)))
      throw new NotFoundError("Item de marketing não encontrado");
  }

  async seed(userId: string) {
    const items = await Promise.all(
      initialMarketingResources.map((item) =>
        this.repo.seedResource(userId, { ...item, scheduledFor: null }),
      ),
    );
    const instruction = await this.repo.activeInstruction(userId);
    if (!instruction) {
      const created = await this.repo.createInstruction(
        userId,
        DEFAULT_MARKETING_SYSTEM_PROMPT,
        "Treinamento inicial informado pela fundadora",
      );
      await this.repo.publishInstruction(userId, created.id);
    }
    const existingDocuments = await this.repo.listDocuments(userId);
    const seededDocuments = await Promise.all(
      initialMarketingDocumentDefinitions.map(async (definition) => {
        const existing = existingDocuments.find((doc) => doc.slug === definition.slug);
        const document =
          existing ??
          (await this.repo.createDocument(userId, {
            slug: definition.slug,
            title: definition.title,
            body: await loadInitialMarketingDocument(definition.fileName),
            tags: [...definition.tags],
            source: "imported",
          }));
        return { definition, document };
      }),
    );
    const knowledge = await this.repo.listKnowledge(userId);
    await Promise.all(
      seededDocuments
        .filter(({ definition }) => definition.aiKnowledge)
        .map(async ({ definition, document }) => {
          const alreadyLinked = knowledge.some(
            (item) => item.sourceType === "document" && item.sourceId === document.id,
          );
          if (alreadyLinked) return;
          await this.repo.addKnowledge(userId, {
            title: definition.title,
            body: document.body,
            sourceType: "document",
            sourceId: document.id,
            tags: [...definition.tags],
            canonical: true,
            active: true,
          });
        }),
    );
    return {
      imported: items.length,
      instructionReady: true,
      documentReady: true,
      knowledgeReady: true,
    };
  }

  listDocuments(userId: string) {
    return this.repo.listDocuments(userId);
  }

  async getDocument(userId: string, id: string) {
    const row = await this.repo.getDocument(userId, id);
    if (!row) {
      throw new NotFoundError("Documento não encontrado");
    }
    return row;
  }

  createDocument(userId: string, input: MarketingDocumentInput) {
    return this.repo.createDocument(userId, input);
  }

  async updateDocument(
    userId: string,
    id: string,
    input: Partial<MarketingDocumentInput> & { versionNote?: string },
  ) {
    const row = await this.repo.updateDocument(userId, id, input);
    if (!row) {
      throw new NotFoundError("Documento não encontrado");
    }
    return row;
  }

  async deleteDocument(userId: string, id: string) {
    if (!(await this.repo.deleteDocument(userId, id))) {
      throw new NotFoundError("Documento não encontrado");
    }
  }

  async addAttachment(
    userId: string,
    documentId: string,
    input: { name: string; mimeType: string; storagePath: string; sizeBytes: number },
  ) {
    const row = await this.repo.addAttachment(userId, documentId, input);
    if (!row) {
      throw new NotFoundError("Documento não encontrado");
    }
    return row;
  }

  async chat(
    userId: string,
    input: {
      message: string;
      sessionId?: string;
      context: Record<string, unknown>;
      mode: string;
    },
  ) {
    if (!this.generate)
      throw new ServiceUnavailableError(
        "Configure GOOGLE_GENERATIVE_AI_API_KEY para usar a IA",
      );
    let sessionId = input.sessionId;
    if (sessionId) {
      const existing = await this.repo.getSession(userId, sessionId);
      if (!existing) throw new NotFoundError("Conversa não encontrada");
    } else {
      const session = await this.repo.createSession(userId, input.message.slice(0, 72));
      sessionId = session.id;
    }
    await this.repo.addMessage(sessionId, "user", input.message, input.context);
    const [session, instruction, knowledge, examples, resources] = await Promise.all([
      this.repo.getSession(userId, sessionId),
      this.repo.activeInstruction(userId),
      this.repo.listKnowledge(userId),
      this.repo.listExamples(userId),
      this.repo.listResources(userId),
    ]);
    const history = session!.messages
      .slice(-10)
      .map(
        (message) =>
          `${message.role === "user" ? "Usuário" : "Consultoria"}: ${message.body}`,
      )
      .join("\n\n");
    const knowledgeContext = knowledge
      .slice(0, 12)
      .map((item) => `- ${item.title}: ${item.body}`)
      .join("\n");
    const examplesContext = examples
      .slice(0, 5)
      .map((item) => `Entrada: ${item.input}\nSaída: ${item.output}`)
      .join("\n\n");
    const resourcesContext = resources
      .slice(0, 60)
      .map(
        (item) =>
          `- [${item.kind}] ${item.title}: ${item.summary ?? ""} ${JSON.stringify(item.data)}`,
      )
      .join("\n");
    const context = [
      `MODO: ${input.mode}`,
      `CONTEXTO INFORMADO: ${JSON.stringify(input.context)}`,
      `CONHECIMENTO CANÔNICO:\n${knowledgeContext}`,
      `EXEMPLOS APROVADOS:\n${examplesContext}`,
      `DADOS DO PLANO:\n${resourcesContext}`,
      `HISTÓRICO:\n${history}`,
      `PEDIDO ATUAL:\n${input.message}`,
    ].join("\n\n");
    const result = await this.generate({
      system: instruction?.body ?? DEFAULT_MARKETING_SYSTEM_PROMPT,
      prompt: context,
    });
    const message = await this.repo.addMessage(
      sessionId,
      "assistant",
      result.text,
      { mode: input.mode },
      result.model,
    );
    return { sessionId, message };
  }

  async draftResource(
    userId: string,
    input: {
      kind: MarketingResourceKind;
      prompt: string;
      current?: {
        title: string;
        summary: string;
        status: string;
        scheduledFor: string | null;
        data: Record<string, unknown>;
      };
    },
  ): Promise<MarketingAiResourceDraft> {
    if (!this.generate)
      throw new ServiceUnavailableError(
        "Configure GOOGLE_GENERATIVE_AI_API_KEY para usar a IA",
      );
    const [instruction, knowledge, examples, resources] = await Promise.all([
      this.repo.activeInstruction(userId),
      this.repo.listKnowledge(userId),
      this.repo.listExamples(userId),
      this.repo.listResources(userId),
    ]);
    const result = await this.generate({
      system: `${instruction?.body ?? DEFAULT_MARKETING_SYSTEM_PROMPT}\n\nAo preencher cadastros, responda somente com o JSON solicitado, sem markdown ou comentários.`,
      prompt: [
        `Crie um único rascunho de ${resourceKindLabel(input.kind)} para o Lucro Caseiro.`,
        `PEDIDO: ${input.prompt}`,
        `CAMPOS ATUAIS: ${JSON.stringify(input.current ?? {})}`,
        `CONHECIMENTO CANÔNICO: ${knowledge
          .slice(0, 12)
          .map((item) => `${item.title}: ${item.body}`)
          .join("\n")}`,
        `EXEMPLOS APROVADOS: ${examples
          .slice(0, 5)
          .map((item) => `Entrada: ${item.input}\nSaída: ${item.output}`)
          .join("\n\n")}`,
        `ITENS JÁ CADASTRADOS: ${resources
          .filter((item) => item.kind === input.kind)
          .slice(0, 30)
          .map((item) => `${item.title}: ${item.summary ?? ""}`)
          .join("\n")}`,
        'FORMATO EXATO: {"title":"...","summary":"...","status":"...","scheduledFor":null,"data":{}}',
        `STATUS PERMITIDOS: ${statusOptions(input.kind).join(", ")}.`,
        "Use scheduledFor em ISO 8601 apenas se o pedido definir uma data; caso contrário, use null. Em data, inclua somente contexto estruturado útil e específico para este tipo de item.",
      ].join("\n\n"),
    });
    return parseMarketingResourceDraft(result.text, input.kind);
  }

  listSessions(userId: string) {
    return this.repo.listSessions(userId);
  }

  async getSession(userId: string, id: string) {
    const row = await this.repo.getSession(userId, id);
    if (!row) {
      throw new NotFoundError("Conversa não encontrada");
    }
    return row;
  }

  training(userId: string) {
    return this.repo.training(userId);
  }

  createInstruction(userId: string, body: string, note?: string) {
    return this.repo.createInstruction(userId, body, note);
  }

  async publishInstruction(userId: string, id: string) {
    const row = await this.repo.publishInstruction(userId, id);
    if (!row) {
      throw new NotFoundError("Versão de instrução não encontrada");
    }
    return row;
  }
  addKnowledge(
    userId: string,
    input: {
      title: string;
      body: string;
      sourceType: string;
      sourceId?: string | null;
      tags: string[];
      canonical: boolean;
    },
  ) {
    return this.repo.addKnowledge(userId, { ...input, active: true });
  }
  addExample(userId: string, input: { input: string; output: string; tags?: string[] }) {
    return this.repo.addExample(userId, {
      ...input,
      tags: input.tags ?? [],
      approved: true,
    });
  }
  addEvaluation(
    userId: string,
    input: { title: string; prompt: string; expected: string; tags: string[] },
  ) {
    return this.repo.addEvaluation(userId, input);
  }

  async runEvaluation(userId: string, id: string) {
    if (!this.generate)
      throw new ServiceUnavailableError(
        "Configure GOOGLE_GENERATIVE_AI_API_KEY para executar avaliações",
      );
    const evaluation = (await this.repo.listEvaluations(userId)).find(
      (item) => item.id === id,
    );
    if (!evaluation) throw new NotFoundError("Avaliação não encontrada");
    const instruction = await this.repo.activeInstruction(userId);
    const result = await this.generate({
      system: instruction?.body ?? DEFAULT_MARKETING_SYSTEM_PROMPT,
      prompt: evaluation.prompt,
    });
    const score = overlapScore(evaluation.expected, result.text);
    return this.repo.setEvaluationResult(userId, id, result.text, score);
  }

  async addFeedback(
    userId: string,
    input: { messageId: string; rating: "positive" | "negative"; note?: string },
  ) {
    const feedback = await this.repo.addFeedback(
      userId,
      input.messageId,
      input.rating,
      input.note,
    );
    const settings = await this.repo.getSettings(userId);
    if (settings.classAEnabled && input.note) {
      await this.repo.addKnowledge(userId, {
        title: `Preferência aprendida em ${new Date().toLocaleDateString("pt-BR")}`,
        body: input.note,
        sourceType: "feedback",
        sourceId: feedback.id,
        tags: ["aprendizado-automatico", input.rating],
        canonical: false,
        active: true,
      });
      await this.repo.addLearning(userId, {
        learningClass: "A",
        action: "feedback_to_preference",
        status: "applied",
        reason: "Feedback explícito convertido em preferência recuperável",
        after: { note: input.note, rating: input.rating },
        score: 100,
      });
    }
    const samples = await this.repo.countFeedback(userId);
    if (
      settings.classBEnabled &&
      samples >= settings.minimumSamples &&
      samples % settings.minimumSamples === 0
    ) {
      await this.repo.addLearning(userId, {
        learningClass: "B",
        action: "prompt_optimization_candidate",
        status: "shadow",
        reason: `${samples} feedbacks disponíveis; candidato criado para avaliação antes da promoção`,
        score: settings.minimumScore,
      });
    }
    return feedback;
  }

  async updateSettings(userId: string, policy: MarketingLearningPolicy) {
    return this.repo.updateSettings(userId, {
      ...policy,
      minimumScore: Math.round(policy.minimumScore * 100),
    });
  }

  dashboard(userId: string) {
    return this.repo.dashboard(userId);
  }
}

export function overlapScore(expected: string, actual: string) {
  const normalize = (value: string) =>
    new Set(
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .match(/[a-z0-9]{4,}/g) ?? [],
    );
  const wanted = normalize(expected);
  const got = normalize(actual);
  if (wanted.size === 0) return 100;
  const hits = [...wanted].filter((word) => got.has(word)).length;
  return Math.round((hits / wanted.size) * 100);
}

export function parseMarketingResourceDraft(
  text: string,
  kind: MarketingResourceKind,
): MarketingAiResourceDraft {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new ServiceUnavailableError(
      "A IA não conseguiu montar o rascunho. Tente descrever o item de outra forma.",
    );
  }
  try {
    const draft = MarketingAiResourceDraftSchema.parse(
      JSON.parse(text.slice(start, end + 1)),
    );
    const allowedStatuses = statusOptions(kind);
    const normalizedStatus = allowedStatuses.includes(draft.status)
      ? draft.status
      : initialStatus(kind);
    return {
      ...draft,
      status: normalizedStatus,
    };
  } catch {
    throw new ServiceUnavailableError(
      "A IA não conseguiu montar o rascunho. Tente descrever o item de outra forma.",
    );
  }
}

function statusOptions(kind: MarketingResourceKind) {
  return kind === "content"
    ? ["idea", "planned", "producing", "ready", "published", "archived"]
    : ["active", "planned", "archived"];
}

function initialStatus(kind: MarketingResourceKind) {
  return kind === "content" ? "idea" : "active";
}

function resourceKindLabel(kind: MarketingResourceKind) {
  switch (kind) {
    case "content":
      return "conteúdo";
    case "audience":
      return "público";
    case "feature":
      return "funcionalidade";
    case "topic":
      return "tema";
    case "outreach":
      return "canal de prospecção";
    case "campaign":
      return "campanha";
    case "performance":
      return "resultado";
  }
}

function buildInitialStrategyDocument() {
  return `# Estratégia de marketing e vendas — Lucro Caseiro

## Objetivo de negócio
Fazer a pessoa calcular corretamente o preço de um produto nos primeiros minutos, transformar esse produto em catálogo ou venda sem recadastramento e produzir conteúdo útil sobre precificação, lucro e organização.

## Proposta de valor
O Lucro Caseiro leva a empreendedora do custo ao preço, do preço ao catálogo e do catálogo à venda no mesmo fluxo. A comunicação deve vender primeiro a transformação — cobrar com segurança e enxergar o lucro — e usar a funcionalidade como prova.

## Jornada
1. Reconhecer a dor: vender e não ver o dinheiro.
2. Entender o erro: preço copiado ou custos esquecidos.
3. Experimentar: calcular o primeiro produto.
4. Ativar: publicar no catálogo ou registrar uma venda sem recadastro.
5. Criar hábito: acompanhar pedidos, custos, estoque e resultado.
6. Defender a marca: compartilhar resultado e indicar.

## Públicos e mensagens
- Confeiteiras iniciantes: “descubra o preço certo sem planilha complicada”.
- Artesãos e personalizados: “inclua material, tempo e margem sem esquecer custos pequenos”.
- Marmitas e alimentos: “proteja a margem mesmo quando ingredientes e rendimento variam”.
- Beleza e serviços: “pare de copiar a concorrência e cobre pelo seu tempo e capacidade”.
- Empreendedoras em organização: “saia das anotações espalhadas e veja o lucro real”.

## Distribuição semanal
- Segunda: erro ou dor.
- Terça: tutorial ou checklist.
- Quarta: demonstração do produto.
- Quinta: objeção ou mito.
- Sexta: transformação entre funcionalidades.
- Sábado: bastidores e prova.
- Domingo: planejamento leve e interação.

## Canais
TikTok e Reels para descoberta; carrossel para salvamento; Stories para relacionamento; YouTube para busca e profundidade; WhatsApp e parcerias para ativação; comunidades e comentários para pesquisa e distribuição orgânica.

## Princípios
Mostrar tela e exemplo real; falar de uma dor por peça; adaptar exemplos ao público; terminar com uma ação; não prometer renda; não inventar resultados; medir retenção, salvamentos, cliques e primeiro produto calculado — não apenas visualizações.

## Experimentos
Testar gancho de dor contra ganho, demonstração falada contra texto na tela, CTA “calcule” contra “organize”, nichos diferentes com o mesmo conceito e prova de fluxo completo contra prova de uma funcionalidade.`;
}

/* eslint-disable security/detect-non-literal-fs-filename -- every readable path is
   explicitly allowlisted below; fileName never reaches the filesystem directly. */
export async function loadInitialMarketingDocument(fileName: string) {
  if (fileName === "estrategia-marketing-vendas.md") {
    try {
      return await readFile(
        new URL(
          "../../../../../docs/marketing/estrategia-marketing-vendas.md",
          import.meta.url,
        ),
        "utf8",
      );
    } catch {
      return buildInitialStrategyDocument();
    }
  }
  switch (fileName) {
    case "guia-de-mensagens.md":
      return readFile(
        new URL("../../../../../docs/marketing/guia-de-mensagens.md", import.meta.url),
        "utf8",
      );
    case "publicos-e-contextos.md":
      return readFile(
        new URL("../../../../../docs/marketing/publicos-e-contextos.md", import.meta.url),
        "utf8",
      );
    case "objecoes-e-respostas.md":
      return readFile(
        new URL("../../../../../docs/marketing/objecoes-e-respostas.md", import.meta.url),
        "utf8",
      );
    case "playbook-de-conteudo.md":
      return readFile(
        new URL("../../../../../docs/marketing/playbook-de-conteudo.md", import.meta.url),
        "utf8",
      );
    case "experimentos-e-metricas.md":
      return readFile(
        new URL(
          "../../../../../docs/marketing/experimentos-e-metricas.md",
          import.meta.url,
        ),
        "utf8",
      );
    case "provas-e-alegacoes.md":
      return readFile(
        new URL("../../../../../docs/marketing/provas-e-alegacoes.md", import.meta.url),
        "utf8",
      );
    case "briefings-e-qualidade.md":
      return readFile(
        new URL(
          "../../../../../docs/marketing/briefings-e-qualidade.md",
          import.meta.url,
        ),
        "utf8",
      );
    default:
      throw new Error(`Documento inicial de marketing não permitido: ${fileName}`);
  }
}
/* eslint-enable security/detect-non-literal-fs-filename */
