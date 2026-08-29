import type { CatalogSettings } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  STOREFRONT_BRAND_COLORS,
  buildStorefrontChecklist,
  catalogImageValidationError,
  coverFocalNativeTranslate,
  coverFocalObjectPosition,
  createFeaturedItemTransforms,
  displayCatalogItemName,
  createStorefrontCustomization,
  formatCatalogWhatsapp,
  isStorefrontDraftDirty,
  isValidCatalogColor,
  normalizeFeaturedItemTransform,
  normalizeHeroContactAction,
  normalizeStorefrontCustomization,
  resolveCatalogItemAction,
  resolveFeaturedVisual,
  validateStorefrontCustomization,
} from "./catalog-customizer";

function settings(overrides: Partial<CatalogSettings> = {}): CatalogSettings {
  return {
    brandId: "lucro-caseiro",
    slug: "doces-da-maria",
    enabled: false,
    whatsapp: "5511987654321",
    coverUrl: null,
    logoUrl: null,
    accentColor: "rose",
    titleColor: null,
    descriptionColor: null,
    pattern: null,
    tagline: "Feito com cuidado",
    promoBanner: "Agenda aberta",
    promoBannerEnabled: true,
    serviceCoverUrl: null,
    serviceTitleColor: null,
    serviceDescriptionColor: null,
    serviceTagline: null,
    servicePromoBanner: null,
    servicePromoBannerEnabled: true,
    customization: null,
    updatedAt: "2026-08-18T12:00:00.000Z",
    ...overrides,
  };
}

describe("storefront customization", () => {
  it("deriva defaults seguros de um catálogo legado sem apagar campos antigos", () => {
    const draft = createStorefrontCustomization(settings(), "Doces da Maria", {
      products: 3,
      services: 0,
    });

    expect(draft.identity.displayName).toBe("Doces da Maria");
    expect(draft.identity.offeringMode).toBe("products");
    expect(draft.identity.actionColor).toBe("#B65F72");
    expect(draft.hero.style).toBe("classic");
    expect(draft.hero.introduction).toBe("Feito com cuidado");
    expect(draft.publication.status).toBe("draft");
  });

  it("restaura as três cores oficiais da marca", () => {
    expect(STOREFRONT_BRAND_COLORS).toEqual({
      primary: "#4A2332",
      action: "#B65F72",
      background: "#FAF8F6",
    });
  });

  it("valida cor hexadecimal, limites, slug e WhatsApp", () => {
    const draft = createStorefrontCustomization(settings(), "Maria");
    const errors = validateStorefrontCustomization({
      ...draft,
      identity: { ...draft.identity, displayName: "", actionColor: "vinho" },
      hero: { ...draft.hero, introduction: "a".repeat(121) },
      organization: {
        ...draft.organization,
        contact: { ...draft.organization.contact, destination: "123" },
      },
      publication: { ...draft.publication, slug: "Inválido" },
    });

    expect(isValidCatalogColor("#4A2332")).toBe(true);
    expect(isValidCatalogColor("#123")).toBe(false);
    expect(errors.displayName).toBeTruthy();
    expect(errors.actionColor).toBeTruthy();
    expect(errors.introduction).toBeTruthy();
    expect(errors.whatsapp).toBeTruthy();
    expect(errors.slug).toBeTruthy();
  });

  it("simplifica apresentação ao normalizar", () => {
    const draft = createStorefrontCustomization(settings(), "Maria");
    const normalized = normalizeStorefrontCustomization({
      ...draft,
      hero: {
        ...draft.hero,
        style: "editorial",
        shortSignature: "feito com cuidado",
        quickInfo: [
          {
            id: "quick-1",
            icon: "sparkles",
            label: "Sob medida",
            order: 0,
            enabled: true,
          },
        ],
      },
      organization: {
        ...draft.organization,
        discovery: {
          ...draft.organization.discovery,
          showSearch: true,
          allowSorting: true,
        },
        actions: { ...draft.organization.actions, mode: "perItem" },
      },
    });

    expect(normalized.hero.style).toBe("classic");
    expect(normalized.hero.shortSignature).toBe("");
    expect(normalized.hero.quickInfo).toEqual([]);
    expect(normalized.organization.discovery.showSearch).toBe(false);
    expect(normalized.organization.actions.mode).toBe("default");
    expect(normalized.organization.contact.channel).toBe("whatsapp");
  });

  it("mantém no máximo três destaques ao normalizar", () => {
    const draft = createStorefrontCustomization(settings(), "Maria");
    const featuredItems = Array.from({ length: 4 }, (_, index) => {
      const id = `media:${index}`;
      return {
        id,
        kind: "media" as const,
        assetUrl: `https://cdn.test/${index}.jpg`,
        altText: `Destaque ${index}`,
        transforms: createFeaturedItemTransforms(id),
      };
    });
    const normalized = normalizeStorefrontCustomization({
      ...draft,
      hero: { ...draft.hero, featuredItems },
    });

    expect(normalized.hero.featuredItems).toHaveLength(3);
  });

  it("normaliza transforms em coordenadas relativas", () => {
    expect(
      normalizeFeaturedItemTransform({
        featuredItemId: "x",
        breakpoint: "mobile",
        x: 4,
        y: -1,
        scale: 8,
        layer: 3.8,
      }),
    ).toMatchObject({ x: 1, y: 0, scale: 2.5, layer: 4 });
  });

  it("unifica a ação do topo em contato por WhatsApp", () => {
    expect(
      normalizeHeroContactAction(
        { type: "schedule", label: "Agendar", destination: "https://cal.com/x" },
        "11987654321",
      ),
    ).toEqual({
      type: "whatsapp",
      label: "Agendar",
      destination: "11987654321",
    });
    expect(normalizeHeroContactAction({ type: "quote", label: "   " }, "")).toEqual({
      type: "none",
      label: "",
    });
  });

  it("converte o ponto focal da capa em posição e deslocamento", () => {
    expect(coverFocalObjectPosition({ x: 0.2, y: 0.8 })).toBe("20% 80%");
    expect(
      coverFocalNativeTranslate({ x: 0, y: 1 }, { width: 200, height: 100 }),
    ).toEqual({ translateX: 50, translateY: -25 });
  });

  it("respeita prioridade da sobrescrita individual sobre o padrão", () => {
    const draft = createStorefrontCustomization(settings(), "Maria");
    const customized = {
      ...draft,
      organization: {
        ...draft.organization,
        actions: {
          ...draft.organization.actions,
          productDefault: { type: "order" as const, label: "Pedir" },
          itemOverrides: {
            "product:1": { type: "quote" as const, label: "Orçamento" },
          },
        },
      },
    };

    expect(resolveCatalogItemAction("product:1", "product", customized).type).toBe(
      "quote",
    );
    expect(resolveCatalogItemAction("product:2", "product", customized).type).toBe(
      "order",
    );
  });

  it("usa recorte só quando o toggle de remover fundo está ligado", () => {
    const item = {
      id: "product:1",
      kind: "product" as const,
      sourceId: "1",
      assetUrl: "https://cdn.example/original.jpg",
      processedUrl: "https://cdn.example/recorte.png",
      altText: "Caderno",
      transforms: createFeaturedItemTransforms("product:1"),
    };

    expect(resolveFeaturedVisual(item, true)).toEqual({
      source: "https://cdn.example/recorte.png",
      cutout: true,
    });
    expect(resolveFeaturedVisual(item, false)).toEqual({
      source: "https://cdn.example/original.jpg",
      cutout: false,
    });
    const saved = createStorefrontCustomization(settings(), "Maria");
    expect(
      isStorefrontDraftDirty(
        { ...saved, hero: { ...saved.hero, removeBackground: true } },
        saved,
      ),
    ).toBe(true);
  });

  it("detecta dirty state e preserva o rascunho original", () => {
    const saved = createStorefrontCustomization(settings(), "Maria");
    expect(isStorefrontDraftDirty(saved, saved)).toBe(false);
    expect(
      isStorefrontDraftDirty(
        { ...saved, hero: { ...saved.hero, style: "editorial" } },
        saved,
      ),
    ).toBe(true);
  });

  it("gera checklist dinâmico com contagens reais", () => {
    const draft = createStorefrontCustomization(settings(), "Maria", {
      products: 2,
      services: 1,
    });
    const checklist = buildStorefrontChecklist(draft, { products: 2, services: 1 }, true);

    expect(checklist.find((item) => item.id === "contact")?.label).toBe(
      "WhatsApp conectado",
    );
    expect(checklist.find((item) => item.id === "slug")?.valid).toBe(true);
    expect(checklist.find((item) => item.id === "content")).toBeUndefined();
  });

  it("não inclui checklist de conteúdo nem de ações por item", () => {
    const draft = createStorefrontCustomization(settings(), "Maria", {
      products: 2,
      services: 1,
    });
    const checklist = buildStorefrontChecklist(draft, { products: 2, services: 1 }, true);

    expect(draft.organization.actions.mode).toBe("default");
    expect(checklist.map((item) => item.id)).toEqual([
      "identity",
      "hero",
      "contact",
      "slug",
    ]);
  });

  it("remove prefixos técnicos do nome exibido", () => {
    expect(displayCatalogItemName("[massa] Bolo de pote morango")).toBe(
      "Bolo de pote morango",
    );
    expect(displayCatalogItemName("Caderno personalizado")).toBe("Caderno personalizado");
  });

  it("formata DDI 55 e valida uploads PNG/JPG de até 5 MB", () => {
    expect(formatCatalogWhatsapp("5511987654321")).toBe("(11) 98765-4321");
    expect(
      catalogImageValidationError({
        mimeType: "image/png",
        fileName: "logo.png",
        uri: "blob:logo",
        fileSize: 5 * 1024 * 1024,
      }),
    ).toBeNull();
    expect(
      catalogImageValidationError({
        mimeType: "image/gif",
        fileName: "logo.gif",
        uri: "blob:logo",
        fileSize: 100,
      }),
    ).toBe("Use uma imagem PNG ou JPG.");
  });
});
