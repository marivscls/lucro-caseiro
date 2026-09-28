import { PaymentMethod } from "@lucro-caseiro/contracts";
import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";

import { ServiceUnavailableError } from "../../shared/errors";
import type { CatalogClient, CatalogProduct, IAssistantAi } from "./assistant.types";

// Modelos rápidos e baratos, com áudio e imagem nativos. O segundo é reserva.
const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"] as const;

const SaleSchema = z.object({
  transcript: z
    .string()
    .describe("O que a pessoa disse ou escreveu, em português, corrigido e sem inventar"),
  clientName: z
    .string()
    .nullable()
    .describe("Nome de quem comprou, como está na lista de clientes quando bater"),
  items: z.array(
    z.object({
      name: z.string().describe("Produto ou serviço, como está na lista quando bater"),
      quantity: z.number().describe("Quantidade; 1 quando não disser"),
      unitPrice: z
        .number()
        .nullable()
        .describe("Preço de UMA unidade em reais, só se a pessoa disse o valor"),
    }),
  ),
  paymentMethod: PaymentMethod.nullable().describe(
    "pix, cash (dinheiro), card (cartão), transfer, credit (fiado, pendura, paga depois, anota)",
  ),
  notes: z.string().nullable().describe("Recado extra, como horário de entrega"),
});

const NotebookSchema = z.object({
  rows: z.array(
    z.object({
      name: z.string().describe("Nome da pessoa que está devendo"),
      amount: z.number().describe("Valor devido em reais"),
      date: z
        .string()
        .nullable()
        .describe("Data da anotação em AAAA-MM-DD, se estiver escrita"),
      note: z.string().nullable().describe("O que foi comprado, se estiver escrito"),
    }),
  ),
});

function saleSystem(products: CatalogProduct[], clients: CatalogClient[], today: string) {
  const productList = products
    .slice(0, 200)
    .map((p) => {
      const price = p.price > 0 ? ` (R$ ${p.price.toFixed(2)})` : "";
      return `- ${p.name}${price}`;
    })
    .join("\n");
  const clientList = clients
    .slice(0, 400)
    .map((c) => `- ${c.name}`)
    .join("\n");
  return `Você anota vendas de um pequeno negócio caseiro brasileiro (doces, marmitas, manicure, costura, revenda, serviços).
Hoje é ${today}. A pessoa fala do jeito dela, às vezes com gíria ou erro. Extraia UMA venda.
Regras:
- Use o nome exato da lista quando o produto ou cliente bater, mesmo que a pessoa fale diferente ("brigadeiro" → "Brigadeiro gourmet").
- Se o produto não estiver na lista, use o nome que a pessoa falou.
- "fiado", "pendura", "anota", "paga depois", "fica devendo" = credit.
- Preço só quando a pessoa falar o valor. Se falar o total de vários itens iguais, divida pela quantidade.
- Nunca invente cliente, item ou valor. Se não entendeu, devolva items vazio.
Produtos cadastrados:
${productList || "(nenhum)"}
Clientes cadastrados:
${clientList || "(nenhum)"}`;
}

function notebookSystem(today: string) {
  return `Você lê a foto de uma página de caderno de fiado de um pequeno negócio brasileiro.
Hoje é ${today}. Liste quem está devendo e quanto.
Regras:
- Ignore linhas riscadas, marcadas como "pago", "ok" ou com um visto de quitado.
- Se a mesma pessoa aparece em várias linhas em aberto, devolva uma linha para cada anotação.
- Valores em reais: "15,50" = 15.5; "15" = 15.
- Datas sem ano são do ano de hoje; nunca devolva data no futuro.
- Se não conseguir ler um nome ou um valor com segurança, pule a linha. Nunca invente.`;
}

export class GeminiAssistantAi implements IAssistantAi {
  constructor(private model: (id: string) => LanguageModel) {}

  private async run<T>(
    schema: z.ZodType<T>,
    system: string,
    content: Array<
      { type: "text"; text: string } | { type: "file"; data: string; mediaType: string }
    >,
  ): Promise<T> {
    let lastError: unknown;
    for (const id of MODELS) {
      try {
        const result = await generateText({
          model: this.model(id),
          system,
          messages: [{ role: "user", content }],
          output: Output.object({ schema }),
          abortSignal: AbortSignal.timeout(40_000),
          maxRetries: 0,
        });
        return result.output;
      } catch (error) {
        lastError = error;
        console.warn(`Assistant AI model failed: ${id}`, error);
      }
    }
    console.error("Assistant AI failed:", lastError);
    throw new ServiceUnavailableError(
      "O assistente não conseguiu responder agora. Tente de novo em instantes.",
    );
  }

  async parseSale(input: Parameters<IAssistantAi["parseSale"]>[0]) {
    const content: Array<
      { type: "text"; text: string } | { type: "file"; data: string; mediaType: string }
    > = input.audio
      ? [
          { type: "text", text: "Anote a venda deste áudio." },
          { type: "file", data: input.audio.data, mediaType: input.audio.mimeType },
        ]
      : [{ type: "text", text: input.text ?? "" }];
    return this.run(
      SaleSchema,
      saleSystem(input.products, input.clients, input.today),
      content,
    );
  }

  async readNotebook(input: Parameters<IAssistantAi["readNotebook"]>[0]) {
    const result = await this.run(NotebookSchema, notebookSystem(input.today), [
      { type: "text", text: "Leia esta página do caderno de fiado." },
      { type: "file", data: input.image.data, mediaType: input.image.mimeType },
    ]);
    return result.rows;
  }
}

/** Sem chave da IA configurada: responde com um aviso claro em vez de derrubar a API. */
export class UnavailableAssistantAi implements IAssistantAi {
  parseSale(): never {
    throw new ServiceUnavailableError("O assistente ainda não está disponível.");
  }
  readNotebook(): never {
    throw new ServiceUnavailableError("O assistente ainda não está disponível.");
  }
}
