import { PaymentMethod } from "@lucro-caseiro/contracts";
import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";

import { ServiceUnavailableError } from "../../shared/errors";
import type { CatalogClient, CatalogProduct, IAssistantAi } from "./assistant.types";

// Modelos rápidos e baratos, com áudio nativo. O segundo é reserva.
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
          // Extrair uma venda não precisa de raciocínio; ele é cobrado como resposta.
          providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
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
}

/** Sem chave da IA configurada: responde com um aviso claro em vez de derrubar a API. */
export class UnavailableAssistantAi implements IAssistantAi {
  parseSale(): never {
    throw new ServiceUnavailableError("O assistente ainda não está disponível.");
  }
}
