import {
  DEFAULT_LABEL_LAYOUT,
  type Label,
  type LabelData,
} from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  LABEL_LIST_FILTERS,
  displayLabelName,
  formatLabelEditedAt,
  labelCategory,
  labelThumbnailShape,
  labelUsageScore,
  labelsHeroIllustrationWidth,
  labelsHeroPanelHeight,
  matchesLabelSearch,
  mostUsedLabelId,
  sortLabels,
  visibleLabels,
} from "./domain";

function makeLabel(
  overrides: Partial<Label> & { data?: Partial<LabelData> } = {},
): Label {
  const { data, ...rest } = overrides;
  return {
    id: "11111111-1111-1111-1111-111111111111",
    userId: "22222222-2222-2222-2222-222222222222",
    productId: "33333333-3333-3333-3333-333333333333",
    templateId: "classico",
    name: "Rótulo 1",
    data: {
      productName: "Massa caseira",
      ...data,
    },
    logoUrl: null,
    qrCodeUrl: null,
    createdAt: "2026-08-12T10:00:00.000Z",
    ...rest,
  };
}

describe("displayLabelName", () => {
  it("remove prefixos técnicos do nome", () => {
    expect(displayLabelName("[massa etiquetas] Bolo de chocolate")).toBe(
      "Bolo de chocolate",
    );
  });

  it("mantém o nome quando não há prefixo", () => {
    expect(displayLabelName("Rótulo 1")).toBe("Rótulo 1");
  });
});

describe("labelCategory", () => {
  it("usa a categoria do produto vinculado", () => {
    const categories = new Map([["33333333-3333-3333-3333-333333333333", "Massa"]]);
    expect(labelCategory(makeLabel(), categories)).toBe("Massa");
  });

  it("cai no modelo visual quando o produto não tem categoria", () => {
    expect(labelCategory(makeLabel({ templateId: "gourmet" }), new Map())).toBe(
      "gourmet",
    );
  });
});

describe("labelUsageScore", () => {
  it("usa a quantidade por folha salva", () => {
    expect(
      labelUsageScore(
        makeLabel({
          data: {
            productName: "X",
            layout: { ...DEFAULT_LABEL_LAYOUT, copiesPerSheet: 12 },
          },
        }),
      ),
    ).toBe(12);
  });

  it("usa o padrão da folha quando o formato não foi personalizado", () => {
    expect(labelUsageScore(makeLabel())).toBe(DEFAULT_LABEL_LAYOUT.copiesPerSheet);
  });
});

describe("mostUsedLabelId", () => {
  it("marca só a etiqueta de maior volume", () => {
    const low = makeLabel({
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      data: { productName: "A", layout: { ...DEFAULT_LABEL_LAYOUT, copiesPerSheet: 4 } },
    });
    const high = makeLabel({
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      data: { productName: "B", layout: { ...DEFAULT_LABEL_LAYOUT, copiesPerSheet: 10 } },
    });
    expect(mostUsedLabelId([low, high])).toBe(high.id);
  });

  it("no empate escolhe a mais antiga", () => {
    const newer = makeLabel({
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      createdAt: "2026-08-20T00:00:00.000Z",
    });
    const older = makeLabel({
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      createdAt: "2026-08-01T00:00:00.000Z",
    });
    expect(mostUsedLabelId([newer, older])).toBe(older.id);
  });

  it("é nulo quando a lista está vazia", () => {
    expect(mostUsedLabelId([])).toBeNull();
  });
});

describe("search and sort", () => {
  const categories = new Map([["33333333-3333-3333-3333-333333333333", "massa"]]);
  const older = makeLabel({
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    name: "Rótulo 1",
    createdAt: "2026-08-01T00:00:00.000Z",
    data: {
      productName: "Massa caseira",
      layout: { ...DEFAULT_LABEL_LAYOUT, copiesPerSheet: 4 },
    },
  });
  const newer = makeLabel({
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    name: "Rótulo 2",
    createdAt: "2026-08-20T00:00:00.000Z",
    data: {
      productName: "Brownie",
      layout: { ...DEFAULT_LABEL_LAYOUT, copiesPerSheet: 12 },
    },
  });

  it("filtra pelo nome e pela categoria", () => {
    expect(matchesLabelSearch(older, "rótulo 1", categories)).toBe(true);
    expect(matchesLabelSearch(older, "massa", categories)).toBe(true);
    expect(matchesLabelSearch(newer, "massa", categories)).toBe(true);
    expect(matchesLabelSearch(newer, "brownie", categories)).toBe(true);
    expect(matchesLabelSearch(newer, "etiqueta", categories)).toBe(false);
  });

  it("Recentes ordena pelas mais novas", () => {
    expect(sortLabels([older, newer], "recent").map((item) => item.id)).toEqual([
      newer.id,
      older.id,
    ]);
  });

  it("Mais usadas ordena pelo volume de impressão", () => {
    expect(sortLabels([older, newer], "mostUsed").map((item) => item.id)).toEqual([
      newer.id,
      older.id,
    ]);
  });

  it("combina busca e filtro", () => {
    const visible = visibleLabels([older, newer], "rótulo 1", "all", categories);
    expect(visible.map((item) => item.id)).toEqual([older.id]);
  });
});

describe("formatLabelEditedAt", () => {
  it("formata a data em português", () => {
    expect(formatLabelEditedAt("2026-08-12T10:00:00.000Z")).toBe("Editada em 12/08/2026");
  });
});

describe("labelThumbnailShape", () => {
  it("varia o recorte conforme o modelo", () => {
    expect(labelThumbnailShape("minimalista")).toBe("circle");
    expect(labelThumbnailShape("gourmet")).toBe("oval");
    expect(labelThumbnailShape("artesanal")).toBe("scalloped");
    expect(labelThumbnailShape("classico")).toBe("rounded");
    expect(labelThumbnailShape("moderno")).toBe("rounded");
  });
});

describe("list filters", () => {
  it("expõe as três chips da referência", () => {
    expect(LABEL_LIST_FILTERS.map((filter) => filter.label)).toEqual([
      "Todas",
      "Recentes",
      "Mais usadas",
    ]);
  });
});

describe("labels hero metrics", () => {
  it("mantém o PNG entre 46% e 50% da largura do painel", () => {
    expect(labelsHeroIllustrationWidth(328)).toBe(Math.round(328 * 0.46));
    expect(labelsHeroIllustrationWidth(358)).toBe(Math.round(358 * 0.48));
    expect(labelsHeroIllustrationWidth(398)).toBe(Math.round(398 * 0.5));
  });

  it("encolhe o painel abaixo de 360px", () => {
    expect(labelsHeroPanelHeight(320)).toBe(148);
    expect(labelsHeroPanelHeight(360)).toBe(160);
    expect(labelsHeroPanelHeight(430)).toBe(160);
  });
});
