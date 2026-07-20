import type { ProductLookupSuggestion } from "@lucro-caseiro/contracts";
import { z } from "zod";

import type { IProductCatalogLookup } from "./products.types";

const CosmosProductDto = z.object({
  description: z.string().min(1),
  gtin: z.union([z.string(), z.number()]),
  thumbnail: z.string().url().optional().nullable(),
  brand: z
    .object({ name: z.string().min(1) })
    .optional()
    .nullable(),
  gpc: z
    .object({ description: z.string().min(1) })
    .optional()
    .nullable(),
});

export class CosmosProductCatalog implements IProductCatalogLookup {
  constructor(
    private readonly token: string,
    private readonly userAgent: string,
    private readonly request: typeof fetch = fetch,
  ) {}

  async lookupByCode(code: string): Promise<ProductLookupSuggestion | null> {
    const normalizedCode = code.trim();
    if (!this.token || !this.userAgent || !/^\d{8,14}$/.test(normalizedCode)) {
      return null;
    }

    const response = await this.request(
      `https://api.cosmos.bluesoft.com.br/gtins/${encodeURIComponent(normalizedCode)}.json`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": this.userAgent,
          "X-Cosmos-Token": this.token,
        },
        signal: AbortSignal.timeout(5_000),
      },
    );

    if (response.status === 404 || response.status === 422) return null;
    if (!response.ok) throw new Error(`Cosmos respondeu HTTP ${response.status}`);

    const parsed = CosmosProductDto.safeParse(await response.json());
    if (!parsed.success) return null;

    return {
      code: normalizedCode,
      name: parsed.data.description.slice(0, 200),
      category: parsed.data.gpc?.description.slice(0, 100) ?? null,
      photoUrl: parsed.data.thumbnail ?? null,
      brand: parsed.data.brand?.name ?? null,
      source: "cosmos",
    };
  }
}
