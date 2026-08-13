import {
  VideoEditPlanSchema,
  VideoEditReviewSchema,
  type VideoEditPlan,
  type VideoEditReview,
} from "@lucro-caseiro/contracts";

type TranscriptWord = {
  text: string;
  startMs: number;
  endMs: number;
  confidence: number | null;
};

type EditorialAsset = {
  id: string;
  name: string;
  durationMs: number;
  width: number;
  height: number;
  transcript: TranscriptWord[];
  contactSheet?: string;
};

export class OpenAiVideoEditor {
  constructor(
    private apiKey: string,
    private model = "gpt-5.6-terra",
  ) {}

  async transcribe(file: Blob, filename: string): Promise<TranscriptWord[]> {
    const body = new FormData();
    body.set("file", file, filename);
    body.set("model", "whisper-1");
    body.set("response_format", "verbose_json");
    body.append("timestamp_granularities[]", "word");
    body.set("language", "pt");
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body,
    });
    if (!response.ok) throw new Error(`Transcrição OpenAI falhou (${response.status}).`);
    const result = (await response.json()) as {
      words?: Array<{ word: string; start: number; end: number }>;
    };
    if (!result.words?.length)
      throw new Error("A transcrição não devolveu timestamps por palavra.");
    return result.words.map((word) => ({
      text: word.word,
      startMs: Math.round(word.start * 1000),
      endMs: Math.round(word.end * 1000),
      confidence: null,
    }));
  }

  createPlan(input: {
    brief: string;
    aspectRatio: string;
    destinationChannel: string;
    targetDurationSeconds: number | null;
    assets: EditorialAsset[];
    refinement?: string | null;
  }) {
    return this.askForJson(
      VideoEditPlanSchema,
      "Você é a editora audiovisual autônoma da Selenita. Tome decisões editoriais reais e devolva somente JSON válido, sem markdown.",
      editorialPrompt(input),
      input.assets.map((asset) => asset.contactSheet).filter(Boolean) as string[],
    );
  }

  reviewPreview(input: {
    plan: VideoEditPlan;
    frames: string[];
    durationMs: number;
  }): Promise<VideoEditReview> {
    return this.askForJson(
      VideoEditReviewSchema,
      "Você é a revisora final de vídeo da Selenita. Seja rigorosa, mas marque passed=true quando não houver falha objetiva que justifique novo render. Devolva somente JSON válido.",
      `Revise o preview de ${input.durationMs} ms e o plano abaixo. Verifique saltos visuais, enquadramento, legibilidade, coerência narrativa, início e encerramento. Não invente problemas que não possam ser observados.\n\nPLANO:\n${JSON.stringify(input.plan)}`,
      input.frames,
    );
  }

  revisePlan(input: {
    brief: string;
    plan: VideoEditPlan;
    review: VideoEditReview;
    assets: EditorialAsset[];
  }) {
    return this.askForJson(
      VideoEditPlanSchema,
      "Você é a editora audiovisual autônoma da Selenita. Corrija somente os problemas apontados e devolva o plano completo em JSON válido.",
      `BRIEFING:\n${input.brief}\n\nPLANO ATUAL:\n${JSON.stringify(input.plan)}\n\nREVISÃO:\n${JSON.stringify(input.review)}\n\nFONTES:\n${transcriptInventory(input.assets)}`,
      [],
    );
  }

  private async askForJson<T>(
    schema: { parse(value: unknown): T },
    system: string,
    prompt: string,
    images: string[],
  ): Promise<T> {
    const input = [
      { role: "system", content: [{ type: "input_text", text: system }] },
      {
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          ...images.map((imageUrl) => ({ type: "input_image", image_url: imageUrl })),
        ],
      },
    ];
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: this.model, reasoning: { effort: "medium" }, input }),
    });
    if (!response.ok) throw new Error(`Editor GPT falhou (${response.status}).`);
    const json = (await response.json()) as {
      output?: Array<{ content?: Array<{ text?: string }> }>;
    };
    const text = json.output
      ?.flatMap((item) => item.content ?? [])
      .map((item) => item.text ?? "")
      .join("")
      .trim();
    if (!text) throw new Error("O editor GPT não devolveu um plano.");
    return schema.parse(JSON.parse(stripJsonFence(text)));
  }
}

function editorialPrompt(input: {
  brief: string;
  aspectRatio: string;
  destinationChannel: string;
  targetDurationSeconds: number | null;
  assets: EditorialAsset[];
  refinement?: string | null;
}) {
  return `Crie a montagem final usando SOMENTE intervalos existentes nas fontes. Remova falsos começos, repetições e falhas, preserve reações com função narrativa e selecione a fala mais segura. Nenhum segmento pode ultrapassar a duração da fonte. Não corte no meio de palavra. Use transição cut por padrão. Deixe captions vazio: o sistema as reconstruirá deterministicamente a partir dos segmentos.\n\nBriefing: ${input.brief}\nCanal: ${input.destinationChannel}\nProporção: ${input.aspectRatio}\nDuração desejada: ${input.targetDurationSeconds ?? "decida editorialmente"} segundos\nRefinamento: ${input.refinement ?? "nenhum"}\n\nFONTES:\n${transcriptInventory(input.assets)}\n\nFormato obrigatório: {editorialSummary,hook,estimatedDurationMs,aspectRatio,pacing,segments:[{assetId,sourceStartMs,sourceEndMs,narrativeRole,reason,transition}],captions:[],grade,audioTreatment,overlayInstructions,warnings}.`;
}

function transcriptInventory(assets: EditorialAsset[]) {
  return assets
    .map(
      (asset) =>
        `ASSET ${asset.id} — ${asset.name} — ${asset.durationMs} ms — ${asset.width}x${asset.height}\n${packTranscript(asset.transcript)}`,
    )
    .join("\n\n");
}

function packTranscript(words: TranscriptWord[]) {
  const lines: string[] = [];
  for (let index = 0; index < words.length; index += 14) {
    const group = words.slice(index, index + 14);
    if (!group.length) continue;
    lines.push(
      `[${group[0]!.startMs}-${group.at(-1)!.endMs}] ${group.map((word) => word.text).join(" ")}`,
    );
  }
  return lines.join("\n");
}

function stripJsonFence(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  const firstLineEnd = trimmed.indexOf("\n");
  if (firstLineEnd < 0) return trimmed;
  const body = trimmed.slice(firstLineEnd + 1);
  return body.endsWith("```") ? body.slice(0, -3).trimEnd() : body;
}

export type { EditorialAsset, TranscriptWord };
