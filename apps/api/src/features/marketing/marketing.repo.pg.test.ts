import { describe, expect, it, vi } from "vitest";
import {
  marketingAiKnowledge,
  marketingDocumentVersions,
  marketingDocuments,
  marketingResources,
} from "@lucro-caseiro/database/schema";

import type { AppDatabase } from "../../shared/db";
import { MarketingRepoPg } from "./marketing.repo.pg";
import { CANONICAL_LOGO_GUARDRAIL } from "./marketing.system-prompt";

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

  it("persiste o contrato atual ao carregar carrosséis antigos", async () => {
    const originalSlidePrompts = [1, 2, 3].map(
      (slide) => `SLIDE ${slide}\nFAMÍLIA DE LAYOUT: foto-dominante\nPrompt ${slide}.`,
    );
    const campaign = campaignRow({
      adStrategy: {
        name: "Carrossel antigo",
        creativeStrategy: { format: "carrossel", carouselSlides: 3 },
        channels: ["instagram"],
        messages: {},
        creativeNeeds: [],
        kpis: [],
      },
      copyBundle: {
        variants: [
          {
            channel: "instagram",
            format: "carrossel",
            headline: "Não faça tudo de uma vez",
            body: "Comece pelo que move o negócio.",
            slidePrompts: originalSlidePrompts,
            productionNotes: "Contrato antigo.",
            cta: "Comece agora.",
          },
        ],
      },
    });
    const persist = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn(() => ({ where: persist }));
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn().mockResolvedValue([campaign]),
          })),
        })),
      })),
      update: vi.fn(() => ({ set })),
    } as unknown as AppDatabase;

    const [loaded] = await new MarketingRepoPg(db).listResources(
      "11111111-1111-4111-8111-111111111111",
      { kind: "campaign" },
    );
    const storedBundle = loaded?.data.copyBundle as {
      variants: Array<{ productionNotes: string; slidePrompts: string[] }>;
    };

    expect(storedBundle.variants[0]?.productionNotes).toContain(
      "roteiro para o ORQUESTRADOR",
    );
    expect(storedBundle.variants[0]?.productionNotes).toContain("SLIDE ATIVO = 2");
    const migratedSlidePrompts = storedBundle.variants[0]!.slidePrompts;
    migratedSlidePrompts.forEach((slidePrompt, index) => {
      expect(slidePrompt).toContain(`Prompt ${index + 1}.`);
      expect(slidePrompt).toContain("GESTO LIMA: forma=");
      expect(slidePrompt).toContain(CANONICAL_LOGO_GUARDRAIL);
    });
    expect(
      new Set(
        migratedSlidePrompts.map((slidePrompt) =>
          slidePrompt.split("\n").find((line) => line.startsWith("GESTO LIMA:")),
        ),
      ).size,
    ).toBe(3);
    expect(set).toHaveBeenCalledOnce();
    expect(persist).toHaveBeenCalledOnce();
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
      expect([marketingDocumentVersions, marketingAiKnowledge]).toContain(table);
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
    expect(insertedTables).toEqual([
      marketingDocuments,
      marketingDocumentVersions,
      marketingAiKnowledge,
    ]);
  });

  it("cria documento e conhecimento vivo na mesma transação", async () => {
    const document = {
      id: "33333333-3333-4333-8333-333333333333",
      userId: "11111111-1111-4111-8111-111111111111",
      title: "Briefing vivo",
      slug: "briefing-vivo",
      body: "Contexto atualizado",
      tags: ["briefing"],
      source: "manual",
    };
    const insertedTables: unknown[] = [];
    const knowledgeValues = vi.fn().mockResolvedValue(undefined);
    const tx = {
      insert: vi.fn((table) => {
        insertedTables.push(table);
        if (table === marketingDocuments)
          return {
            values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([document]) })),
          };
        return {
          values:
            table === marketingAiKnowledge
              ? knowledgeValues
              : vi.fn().mockResolvedValue(undefined),
        };
      }),
    };
    const db = {
      transaction: vi.fn((run) => run(tx)),
    } as unknown as AppDatabase;

    await new MarketingRepoPg(db).createDocument(document.userId, document);

    expect(insertedTables).toEqual([
      marketingDocuments,
      marketingDocumentVersions,
      marketingAiKnowledge,
    ]);
    expect(knowledgeValues).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "document",
        sourceId: document.id,
        body: document.body,
        active: true,
      }),
    );
  });

  it("desativa o conhecimento ao excluir seu documento", async () => {
    const deactivate = vi.fn().mockResolvedValue(undefined);
    const remove = vi.fn().mockResolvedValue([{ id: "document-id" }]);
    const tx = {
      update: vi.fn((table) => {
        expect(table).toBe(marketingAiKnowledge);
        return { set: vi.fn(() => ({ where: deactivate })) };
      }),
      delete: vi.fn((table) => {
        expect(table).toBe(marketingDocuments);
        return { where: vi.fn(() => ({ returning: remove })) };
      }),
    };
    const db = {
      transaction: vi.fn((run) => run(tx)),
    } as unknown as AppDatabase;

    const deleted = await new MarketingRepoPg(db).deleteDocument(
      "user-id",
      "document-id",
    );

    expect(deleted).toBe(true);
    expect(deactivate).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
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
