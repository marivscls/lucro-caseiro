import { describe, expect, it, vi } from "vitest";
import {
  marketingDocumentVersions,
  marketingDocuments,
  marketingResources,
} from "@lucro-caseiro/database/schema";

import type { AppDatabase } from "../../shared/db";
import { MarketingRepoPg } from "./marketing.repo.pg";

describe("MarketingRepoPg ownership", () => {
  it("recusa inserir mensagem quando a conversa não pertence à conta", async () => {
    const insert = vi.fn();
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })),
      })),
      insert,
    } as unknown as AppDatabase;
    const repo = new MarketingRepoPg(db);

    await expect(
      repo.addMessage("user-a", "session-de-user-b", "user", "mensagem"),
    ).rejects.toThrow("Conversa não encontrada");
    expect(insert).not.toHaveBeenCalled();
  });

  it("publica uma variante como conteúdo e registra o destino na mesma transação", async () => {
    const campaign = campaignRow();
    const content = { id: "22222222-2222-4222-8222-222222222222" };
    const updatedCampaign = {
      ...campaign,
      data: {
        ...campaign.data,
        savedVariants: {
          0: {
            destination: "content",
            targetId: content.id,
            publishedAt: "2026-08-10T13:00:00.000Z",
          },
        },
      },
    };
    const insert = vi.fn((table) => {
      expect(table).toBe(marketingResources);
      return {
        values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([content]) })),
      };
    });
    const update = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([updatedCampaign]) })),
      })),
    }));
    const db = transactionDb(campaign, { insert, update });

    const result = await new MarketingRepoPg(db).publishCampaignVariant(
      "11111111-1111-4111-8111-111111111111",
      campaign.id,
      0,
      "content",
    );

    expect(result?.created).toBe(true);
    expect(result?.publication.destination).toBe("content");
    expect(result?.publication.targetId).toBe(content.id);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("repetir a publicação devolve o vínculo existente sem duplicar o destino", async () => {
    const campaign = campaignRow({
      savedVariants: {
        0: {
          destination: "content",
          targetId: "22222222-2222-4222-8222-222222222222",
          publishedAt: "2026-08-10T13:00:00.000Z",
        },
      },
    });
    const insert = vi.fn();
    const update = vi.fn();
    const db = transactionDb(campaign, { insert, update });

    const result = await new MarketingRepoPg(db).publishCampaignVariant(
      "11111111-1111-4111-8111-111111111111",
      campaign.id,
      0,
      "content",
    );

    expect(result).toMatchObject({
      created: false,
      publication: {
        destination: "content",
        targetId: "22222222-2222-4222-8222-222222222222",
      },
    });
    expect(insert).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("publica documento e cria sua primeira versão dentro da transação", async () => {
    const campaign = campaignRow();
    const document = {
      id: "33333333-3333-4333-8333-333333333333",
      title: "Preço sem chute",
    };
    const insertedTables: unknown[] = [];
    const insert = vi.fn((table) => {
      insertedTables.push(table);
      if (table === marketingDocuments)
        return {
          values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([document]) })),
        };
      expect(table).toBe(marketingDocumentVersions);
      return { values: vi.fn().mockResolvedValue(undefined) };
    });
    const update = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([campaign]) })),
      })),
    }));
    const db = transactionDb(campaign, { insert, update });

    const result = await new MarketingRepoPg(db).publishCampaignVariant(
      "11111111-1111-4111-8111-111111111111",
      campaign.id,
      0,
      "document",
    );

    expect(result?.publication.destination).toBe("document");
    expect(insertedTables).toEqual([marketingDocuments, marketingDocumentVersions]);
  });
});

function campaignRow(data: Record<string, unknown> = {}) {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    userId: "11111111-1111-4111-8111-111111111111",
    kind: "campaign",
    slug: "campanha-teste",
    title: "Campanha teste",
    summary: null,
    status: "planned",
    scheduledFor: null,
    createdAt: new Date("2026-08-10T12:00:00.000Z"),
    updatedAt: new Date("2026-08-10T12:00:00.000Z"),
    data: {
      copyBundle: {
        variants: [
          {
            channel: "instagram",
            format: "post",
            headline: "Preço sem chute",
            hook: "Você sabe quanto sobra?",
            landing: "Faturamento não é lucro.",
            body: "Veja custos e margem antes de vender.",
            retentionBeats: ["Mostrar custo esquecido"],
            productionNotes: "Usar tela real.",
            evidence: "Demonstração do produto.",
            cta: "Calcule seu primeiro produto.",
          },
        ],
        reuseMap: [],
      },
      ...data,
    },
  };
}

function transactionDb(
  campaign: ReturnType<typeof campaignRow>,
  txMethods: { insert: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> },
) {
  const tx = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ for: vi.fn().mockResolvedValue([campaign]) })),
      })),
    })),
    ...txMethods,
  };
  return {
    transaction: vi.fn((run) => run(tx)),
  } as unknown as AppDatabase;
}
