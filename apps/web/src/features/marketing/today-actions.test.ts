import { describe, expect, it } from "vitest";

import type { MarketingResource, ResourceKind } from "../../shared/types";
import { buildTodayActions } from "./today-actions";

describe("buildTodayActions", () => {
  it("prioriza publicação vencida e campanha ainda sem peça", () => {
    const actions = buildTodayActions(
      [
        resource("post-pronto", "content", "ready", {
          scheduledFor: "2026-08-11T12:00:00.000Z",
        }),
        resource("campanha-sem-post", "campaign", "active"),
        resource("ideia", "content", "idea"),
      ],
      new Date("2026-08-12T12:00:00.000Z"),
    );

    expect(actions.map((item) => item.label)).toEqual([
      "Publicar agora",
      "Gerar primeira peça",
      "Revisar ideia",
    ]);
  });

  it("não recoloca no topo campanha que já originou conteúdo", () => {
    const actions = buildTodayActions([
      resource("campanha", "campaign", "active"),
      resource("post", "content", "planned", {
        data: { sourceCampaignId: "campanha" },
      }),
    ]);

    expect(actions.map((item) => item.label)).toEqual(["Continuar produção"]);
  });

  it("pede resultado apenas enquanto a publicação ainda não foi medida", () => {
    const post = resource("post", "content", "published");
    expect(buildTodayActions([post])).toHaveLength(1);
    expect(
      buildTodayActions([
        post,
        resource("resultado", "performance", "active", {
          data: { sourceContentId: post.id },
        }),
      ]),
    ).toHaveLength(0);
  });

  it("traz preview de vídeo revisado pela Selenita para a fila Hoje", () => {
    const actions = buildTodayActions([], new Date("2026-08-12T12:00:00.000Z"), [
      {
        id: "video-1",
        title: "Reels de precificação",
        status: "ready_for_review",
        error: null,
        updatedAt: "2026-08-12T11:00:00.000Z",
      },
    ]);

    expect(actions[0]).toMatchObject({
      label: "Revisar corte",
      href: "/video-editor?job=video-1",
    });
  });
});

function resource(
  id: string,
  kind: ResourceKind,
  status: string,
  overrides: Partial<MarketingResource> = {},
): MarketingResource {
  return {
    id,
    kind,
    slug: id,
    title: id,
    summary: null,
    status,
    scheduledFor: null,
    data: {},
    createdAt: "2026-08-10T12:00:00.000Z",
    updatedAt: "2026-08-10T12:00:00.000Z",
    ...overrides,
  };
}
