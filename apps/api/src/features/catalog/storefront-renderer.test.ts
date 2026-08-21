import type { PublicCatalog, StorefrontCustomization } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  displayCatalogName,
  featuredTransformFor,
  formatCatalogPrice,
  renderPublishedStorefrontHtml,
  resolveFeaturedVisual,
  resolveStorefrontAction,
  safeExternalUrl,
  splitFloatingContactLines,
  storefrontTheme,
} from "./storefront-renderer";

function customization(
  overrides: Partial<StorefrontCustomization> = {},
): StorefrontCustomization {
  const value: StorefrontCustomization = {
    version: 1,
    identity: {
      displayName: "Estúdio Horizonte",
      logoUrl: null,
      offeringMode: "both",
      primaryColor: "#4A2332",
      actionColor: "#B65F72",
      backgroundColor: "#FAF8F6",
    },
    hero: {
      style: "editorial",
      featuredItems: [
        {
          id: "product:11111111-1111-4111-8111-111111111111",
          kind: "product",
          sourceId: "11111111-1111-4111-8111-111111111111",
          assetUrl: "https://cdn.example/caderno.webp",
          altText: "Caderno personalizado",
          transforms: [
            {
              featuredItemId: "product:11111111-1111-4111-8111-111111111111",
              breakpoint: "mobile",
              x: 0.6,
              y: 0.55,
              scale: 1.1,
              layer: 2,
            },
          ],
        },
      ],
      removeBackground: true,
      smallScreenAlternativeUrl: null,
      introduction: "Criações e atendimentos feitos para cada história.",
      shortSignature: "feito com cuidado",
      action: { type: "whatsapp", label: "Conhecer opções", destination: "11999998888" },
      promotionalText: "Agenda aberta",
      showPromotionalBar: true,
      quickInfo: [
        { id: "quick-1", icon: "sparkles", label: "Sob medida", order: 0, enabled: true },
      ],
    },
    organization: {
      content: {
        showProducts: true,
        showServices: true,
        showCategories: true,
        sectionOrder: ["products", "services", "categories"],
        initialSection: "products",
      },
      discovery: {
        showSearch: true,
        showCategories: true,
        allowFilters: true,
        allowSorting: true,
        defaultSort: "featured",
        visibleCategoryIds: [],
        categoryOrder: [],
      },
      cards: {
        style: "editorial",
        showPrice: true,
        showDetails: true,
        showAvailability: true,
        missingPriceBehavior: "consult",
        missingPriceText: "Consultar",
      },
      actions: {
        mode: "perItem",
        productDefault: { type: "order", label: "Pedir", channel: "whatsapp" },
        serviceDefault: { type: "schedule", label: "Agendar", channel: "internal" },
        itemOverrides: {},
      },
      contact: {
        floatingEnabled: true,
        channel: "whatsapp",
        destination: "11999998888",
        defaultActionLabel: "Contato",
        keepVisibleOnScroll: true,
        initialMessage: "Olá! Vim pela vitrine.",
      },
    },
    publication: {
      slug: "estudio-horizonte",
      status: "published",
      publishedAt: "2026-08-18T20:00:00.000Z",
    },
  };
  return { ...value, ...overrides };
}

function catalog(storefront = customization()): PublicCatalog {
  return {
    brandId: "lucro-caseiro",
    slug: "estudio-horizonte",
    businessName: "Nome interno não publicado",
    whatsapp: "11999998888",
    coverUrl: null,
    logoUrl: null,
    accentColor: null,
    titleColor: null,
    descriptionColor: null,
    pattern: null,
    tagline: null,
    promoBanner: null,
    serviceCoverUrl: null,
    serviceTitleColor: null,
    serviceDescriptionColor: null,
    serviceTagline: null,
    servicePromoBanner: null,
    customization: storefront,
    products: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Caderno personalizado",
        category: "Papelaria",
        description: "Com sua arte e seu nome",
        photoUrl: "https://cdn.example/caderno.webp",
        extraPhotos: [],
        salePrice: 59.9,
        saleUnit: "unit",
        variations: [],
      },
    ],
    services: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: "Consultoria criativa",
        description: "Projeto sob medida",
        durationMinutes: 60,
        defaultPrice: null,
        locationMode: "online",
        bookingInstructions: null,
        variations: [],
        addOns: [],
        packages: [],
      },
    ],
    totalProducts: 1,
  };
}

describe("storefront helpers", () => {
  it("remove prefixos técnicos do nome público", () => {
    expect(displayCatalogName("[massa] Bolo de pote morango")).toBe(
      "Bolo de pote morango",
    );
    const html = renderPublishedStorefrontHtml(
      catalog({
        ...customization(),
      }),
    );
    const prefixed = catalog();
    prefixed.products = [
      {
        ...prefixed.products[0]!,
        name: "[massa] Caderno personalizado",
      },
    ];
    expect(renderPublishedStorefrontHtml(prefixed)).toContain("Caderno personalizado");
    expect(renderPublishedStorefrontHtml(prefixed)).not.toContain("[massa]");
    expect(html).toContain("Caderno personalizado");
  });

  it("formata moeda brasileira com Intl", () => {
    expect(formatCatalogPrice(59.9)).toBe("R$ 59,90");
  });

  it("bloqueia esquemas inseguros e aceita http/https", () => {
    expect(safeExternalUrl(["java", "script:alert(1)"].join(""))).toBeNull();
    expect(safeExternalUrl("https://example.com/agendar")).toBe(
      "https://example.com/agendar",
    );
  });

  it("resolve override antes do padrão e respeita ação oculta", () => {
    const base = customization();
    const withOverride = {
      ...base,
      organization: {
        ...base.organization,
        actions: {
          ...base.organization.actions,
          itemOverrides: {
            "product:item-1": { type: "quote" as const, label: "Orçamento" },
          },
        },
      },
    };
    expect(resolveStorefrontAction(withOverride, "product", "item-1").type).toBe("quote");
    expect(
      resolveStorefrontAction(
        {
          ...base,
          organization: {
            ...base.organization,
            actions: { ...base.organization.actions, mode: "hidden" },
          },
        },
        "product",
        "item-1",
      ).type,
    ).toBe("none");
  });

  it("resolve transform específico por breakpoint", () => {
    expect(
      featuredTransformFor(
        customization(),
        "product:11111111-1111-4111-8111-111111111111",
        "mobile",
      ),
    ).toEqual(expect.objectContaining({ x: 0.6, y: 0.55, scale: 1.1, layer: 2 }));
  });

  it("gera tokens sem reutilizar cor inválida", () => {
    const base = customization();
    const theme = storefrontTheme({
      ...base,
      identity: { ...base.identity, primaryColor: "red" },
    });
    expect(theme.primary).toBe("#4A2332");
    expect(theme.onAction).toBe("#FFFFFF");
  });
});

describe("renderPublishedStorefrontHtml", () => {
  it.each(["classic", "editorial", "compact"] as const)(
    "renderiza o hero %s com a mesma base",
    (style) => {
      const base = customization();
      const html = renderPublishedStorefrontHtml(
        catalog({ ...base, hero: { ...base.hero, style } }),
      );
      expect(html).toContain(`hero-${style}`);
      expect(html).toContain("Estúdio Horizonte");
      expect(html).not.toContain("Nome interno não publicado");
    },
  );

  it("renderiza descoberta, tipos, cards e fluxos reais", () => {
    const html = renderPublishedStorefrontHtml(catalog(), "all", "nonce-test");
    expect(html).toContain('id="storefront-search"');
    expect(html).toContain('role="tablist"');
    expect(html).toContain("Papelaria");
    expect(html).toContain("R$ 59,90");
    expect(html).not.toContain('class="type-badge"');
    expect(html).toContain('class="card-action schedule-action"');
    expect(html).toContain('id="booking-form"');
    expect(html).toContain('nonce="nonce-test"');
    expect(html).toContain("https://wa.me/5511999998888?text=");
  });

  it("prioriza o recorte processado no hero e preserva a foto original como fallback", () => {
    const base = customization();
    const [featured] = base.hero.featuredItems;
    const withCutout = {
      ...base,
      hero: {
        ...base.hero,
        featuredItems: [
          {
            ...featured!,
            assetUrl: "https://cdn.example/original.jpg",
            processedUrl: "https://cdn.example/recorte.png",
          },
        ],
      },
    };
    const cutoutHtml = renderPublishedStorefrontHtml(catalog(withCutout));
    expect(cutoutHtml).toContain(
      'class="featured featured-1 featured-cutout" src="https://cdn.example/recorte.png"',
    );

    const originalHtml = renderPublishedStorefrontHtml(catalog(base));
    expect(originalHtml).toContain(
      'class="featured featured-1 featured-cutout" src="https://cdn.example/caderno.webp"',
    );

    const withOriginalPhoto = {
      ...withCutout,
      hero: { ...withCutout.hero, removeBackground: false },
    };
    expect(renderPublishedStorefrontHtml(catalog(withOriginalPhoto))).toContain(
      'class="featured featured-1 featured-photo" src="https://cdn.example/original.jpg"',
    );
    expect(resolveFeaturedVisual(withCutout.hero.featuredItems[0]!, true).source).toBe(
      "https://cdn.example/recorte.png",
    );
  });

  it("dá prioridade absoluta à capa e não monta destaques ou fundo vinho em paralelo", () => {
    const base = customization();
    const html = renderPublishedStorefrontHtml({
      ...catalog(base),
      coverUrl: "https://cdn.example/capa-editorial.jpg",
      customization: {
        ...base,
        hero: {
          ...base.hero,
          smallScreenAlternativeUrl: "https://cdn.example/capa-mobile.jpg",
        },
      },
    });

    expect(html).toContain('class="hero-cover"');
    expect(html).toContain('src="https://cdn.example/capa-editorial.jpg"');
    expect(html).toContain('media="(max-width: 767px)"');
    expect(html).toContain('srcset="https://cdn.example/capa-mobile.jpg"');
    expect(html).toContain("has-cover");
    expect(html).not.toContain('class="featured featured-1');
    expect(html).not.toContain('class="organic"');
  });

  it("usa a logo configurada e mantém o ícone genérico apenas como fallback", () => {
    const base = customization();
    const withLogo = {
      ...base,
      identity: { ...base.identity, logoUrl: "https://cdn.example/logo.png" },
    };
    const html = renderPublishedStorefrontHtml(catalog(withLogo));
    expect(html).toContain(
      'src="https://cdn.example/logo.png" alt="Logo de Estúdio Horizonte"',
    );
    expect(html).not.toContain('class="logo-placeholder"');

    expect(renderPublishedStorefrontHtml(catalog(base))).toContain(
      'class="logo-placeholder"',
    );
  });

  it("reproduz o catalogo editorial: grade, Manrope e capa do usuario", () => {
    const html = renderPublishedStorefrontHtml(catalog());
    expect(html).toContain("grid-template-columns:repeat(2,minmax(0,1fr))");
    expect(html).toContain("family=Manrope");
    expect(html).not.toContain("Fraunces");
    expect(html).not.toContain("Playfair Display");
    expect(html).not.toContain("Caveat");
    expect(html).toContain(
      'class="announcement" aria-label="Aviso"><span>Agenda aberta</span>',
    );
    expect(html).toContain('class="quick-item"><span>Sob medida</span>');
    expect(html).not.toContain("M12 2l1.7 5.1L19 9");
    expect(html).toContain("PAPELARIA");
    expect(html).toContain("a partir de R$");
    expect(html).toContain("Produzido com carinho, escolhido por você.");
    expect(html).toContain("M17.472 14.382");
    expect(html).not.toContain("M8.2 8.2c1 3.3 3.3 5.6 6.7 6.7");
    expect(html).toContain("object-fit:cover");
    expect(html).toContain("linear-gradient(90deg,#FAF8F6 0%,rgba(250,248,246,.94) 22%");
  });

  it("quebra o rótulo do contato flutuante em duas linhas centradas", () => {
    expect(splitFloatingContactLines("Entrar em contato")).toEqual([
      "Entrar em",
      "contato",
    ]);
    const base = customization();
    const html = renderPublishedStorefrontHtml(
      catalog({
        ...base,
        organization: {
          ...base.organization,
          contact: {
            ...base.organization.contact,
            defaultActionLabel: "Entrar em contato",
          },
        },
      }),
    );
    expect(html).toContain('class="floating-label"');
    expect(html).toContain("<span>Entrar em</span><span>contato</span>");
  });

  it("omite a faixa e o contato quando desativados", () => {
    const base = customization();
    const value = {
      ...base,
      hero: { ...base.hero, showPromotionalBar: false },
      organization: {
        ...base.organization,
        contact: { ...base.organization.contact, floatingEnabled: false },
      },
    };
    const html = renderPublishedStorefrontHtml(catalog(value));
    expect(html).not.toContain('class="announcement"');
    expect(html).not.toContain('class="floating-contact"');
  });

  it("marca a prévia como noindex e mantém SEO publicado no catálogo", () => {
    const preview = renderPublishedStorefrontHtml(catalog(), "all", "", true);
    const published = renderPublishedStorefrontHtml(catalog());
    expect(preview).toContain('content="noindex,nofollow"');
    expect(published).toContain('rel="canonical"');
    expect(published).toContain('type="application/ld+json"');
    expect(published).toContain('content="index,follow"');
  });
});
