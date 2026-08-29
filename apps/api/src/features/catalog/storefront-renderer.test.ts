import type { PublicCatalog, StorefrontCustomization } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  displayCatalogName,
  featuredTransformFor,
  formatCatalogPrice,
  productHasPriceRange,
  renderPublishedStorefrontHtml,
  resolveFeaturedVisual,
  resolveStorefrontAction,
  safeExternalUrl,
  serviceListedPrice,
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
      textColor: "#6D6266",
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

  it("marca faixa de preço só com variação ou valores distintos", () => {
    const data = catalog();
    const services = data.services ?? [];
    expect(productHasPriceRange(data.products[0]!)).toBe(false);
    expect(serviceListedPrice(services[0]!)).toEqual({
      amount: null,
      hasRange: false,
    });

    const rangedProduct = {
      ...data.products[0]!,
      variations: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          name: "P",
          inStock: true,
        },
        {
          id: "44444444-4444-4444-8444-444444444444",
          name: "M",
          inStock: true,
        },
      ],
    };
    expect(productHasPriceRange(rangedProduct)).toBe(true);
    expect(
      renderPublishedStorefrontHtml({
        ...data,
        products: [rangedProduct],
      }),
    ).toContain("a partir de R$");

    const rangedService = {
      ...services[0]!,
      defaultPrice: 280,
      variations: [
        {
          id: "55555555-5555-4555-8555-555555555555",
          name: "1h",
          durationMinutes: 60,
          price: 280,
        },
        {
          id: "66666666-6666-4666-8666-666666666666",
          name: "90 min",
          durationMinutes: 90,
          price: 350,
        },
      ],
    };
    expect(serviceListedPrice(rangedService)).toEqual({
      amount: 280,
      hasRange: true,
    });
    const html = renderPublishedStorefrontHtml({
      ...data,
      services: [rangedService],
    });
    expect(html).toContain('class="price-from"');
    expect(html).toContain("a partir de R$");
    expect(html).toContain("R$ 280,00");
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

  it("usa as cores de título e frase escolhidas", () => {
    const theme = storefrontTheme({
      ...customization(),
      identity: {
        ...customization().identity,
        primaryColor: "#1F4E79",
        textColor: "#3D2B1F",
      },
    });
    expect(theme.primary).toBe("#1F4E79");
    expect(theme.muted).toBe("#3D2B1F");
    const html = renderPublishedStorefrontHtml(
      catalog({
        ...customization(),
        identity: {
          ...customization().identity,
          primaryColor: "#1F4E79",
          textColor: "#3D2B1F",
        },
      }),
    );
    expect(html).toContain("--storefront-primary:#1F4E79");
    expect(html).toContain("--storefront-muted:#3D2B1F");
    expect(html).toContain(
      ".introduction{margin:8px auto 0;max-width:36ch;color:var(--storefront-muted)",
    );
    expect(html).toContain(
      ".signature{display:flex;align-items:center;justify-content:center;gap:6px;margin:8px 0 0;color:var(--storefront-muted)",
    );
  });
});

describe("renderPublishedStorefrontHtml", () => {
  it.each(["classic", "editorial", "compact"] as const)(
    "marca o hero %s e aplica altura compacta de capa",
    (style) => {
      const base = customization();
      const html = renderPublishedStorefrontHtml(
        catalog({ ...base, hero: { ...base.hero, style } }),
      );
      expect(html).toContain(`hero-${style}`);
      expect(html).toContain(`hero-mode-${style}`);
      expect(html).toContain(".hero-classic .hero-cover-wrap");
      expect(html).toContain(".hero-editorial .hero-cover-wrap");
      expect(html).toContain(".hero-compact .hero-cover-wrap");
      expect(html).toContain("Estúdio Horizonte");
    },
  );

  it("usa capa curta, card sobreposto e destaques fora do hero", () => {
    const html = renderPublishedStorefrontHtml(catalog());
    expect(html).toContain('class="store-card"');
    expect(html).toContain("--cover-height:196px");
    expect(html).toContain("Destaques");
    expect(html).toContain("data-compact-header");
    expect(html).toContain("Aceitando encomendas");
    expect(html).toContain('placeholder="Buscar no catálogo"');
    expect(html).not.toContain('class="hero-copy"');
  });

  it("renderiza descoberta, tipos, cards e fluxos reais", () => {
    const html = renderPublishedStorefrontHtml(catalog(), "all", "nonce-test");
    expect(html).toContain('id="storefront-search"');
    expect(html).toContain('role="tablist"');
    expect(html).toContain("Papelaria");
    expect(html).toContain("R$ 59,90");
    expect(html).not.toContain('class="type-badge"');
    expect(html).toContain('class="card-hit schedule-action"');
    expect(html).toContain('id="booking-form"');
    expect(html).toContain('nonce="nonce-test"');
    expect(html).toContain("https://wa.me/5511999998888?text=");
    expect(html).toContain("item-availability");
    expect(html).toContain("item-duration");
    expect(html).toContain("item-location");
    expect(html).toContain("m8.5 12 2.4 2.4L16 9");
    expect(html).toContain('class="item-placeholder-mark"');
  });

  it("abre o calendário do Lucro Caseiro no agendamento e não corta o campo", () => {
    const html = renderPublishedStorefrontHtml(catalog());
    expect(html).toContain('id="booking-calendar"');
    expect(html).toContain('id="booking-date-trigger"');
    expect(html).toContain("DD/MM/AAAA");
    expect(html).toContain('placeholder="Ex: 14:30"');
    expect(html).not.toContain('type="date"');
    expect(html).not.toContain('type="time"');
    expect(html).toContain(".lc-cal-day");
    expect(html).toContain(
      "dialog form,.dialog-panel{display:grid;gap:14px;padding:22px 24px;",
    );
    expect(html).toContain("overflow-x:visible");
    expect(html).toContain("Escolha a data desejada.");
  });

  it("esconde cards [hidden] no Safari e isola o clique das abas", () => {
    const html = renderPublishedStorefrontHtml(catalog());
    expect(html).toContain("[hidden]{display:none!important}");
    expect(html).toContain(".storefront-card[hidden]");
    expect(html).toContain("data-kind-filter=");
    expect(html).toContain(
      ".storefront-grid[data-kind-filter=products]>.storefront-card[data-kind=services]",
    );
    expect(html).toContain('data-kind="services"');
    expect(html).toMatch(/service-card is-hidden"[^>]* hidden /);
    expect(html).not.toMatch(/product-card is-hidden"/);
    expect(html).toContain(".type-tabs [data-type]");
    expect(html).toContain(".category-scroll [data-category]");
    expect(html).toContain("type==='services'||!category");
    expect(html).toContain("grid.dataset.kindFilter=type");
    expect(html).toContain("root.dataset.kindFilter=type");
    expect(html).toContain("IntersectionObserver");
    expect(html).toContain("[data-storefront][data-kind-filter=services] .category-rail");
  });

  it("abre o diálogo de detalhes mesmo sem descrição no card", () => {
    const base = customization();
    const storefront = {
      ...base,
      organization: {
        ...base.organization,
        cards: { ...base.organization.cards, showDetails: false },
        actions: {
          ...base.organization.actions,
          productDefault: { type: "details" as const, label: "Ver detalhes" },
        },
      },
    };
    const data = catalog(storefront);
    data.products = [{ ...data.products[0]!, description: "" }];
    const html = renderPublishedStorefrontHtml(data);
    expect(html).toContain('id="item-details-dialog"');
    expect(html).toContain("data-details");
    expect(html).toContain('data-detail-name="Caderno personalizado"');
    expect(html).toContain("details.showModal");
    expect(html).toContain("Este item ainda não tem uma descrição.");
    expect(html).toContain("clear?.addEventListener");
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

  it("usa a capa como identificação e mantém destaques reais na listagem", () => {
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
    expect(html).toContain("Destaques");
    expect(html).toContain('class="featured featured-1');
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

  it("reproduz o catálogo denso: grade, Manrope e capa do usuario", () => {
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
    expect(html).toContain("R$ 59,90");
    expect(html).not.toContain("a partir de R$");
    expect(html).toContain("item-availability");
    expect(html).toContain("item-placeholder-mark");
    expect(html).not.toContain("right:16%;bottom:12%");
    expect(html).toContain("Escolha o que deseja");
    expect(html).toContain(
      ".storefront-card .card-hit{display:flex;flex-direction:column",
    );
    expect(html).toContain('class="price-amount"');
    expect(html).toContain("white-space:nowrap");
    expect(html).toContain("M17.472 14.382");
    expect(html).not.toContain("M8.2 8.2c1 3.3 3.3 5.6 6.7 6.7");
    expect(html).toContain("object-fit:cover");
    expect(html).toContain("linear-gradient(180deg,rgba(36,24,30,.04)");
  });

  it("usa pílula de contato com rótulo legível e reserva espaço no grid", () => {
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
    expect(html).toContain('class="floating-label">Contato</span>');
    expect(html).not.toContain("<span>Entrar em</span>");
    expect(html).toContain("font-size:.92rem");
    expect(html).toContain("border-radius:var(--radius-chip)");
    expect(html).toContain("floating.classList.toggle('obscured'");
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

  it("usa o layout atual quando o catálogo não tem personalização", () => {
    const html = renderPublishedStorefrontHtml({ ...catalog(), customization: null });
    expect(html).toContain('class="store-card"');
    expect(html).toContain("Buscar no catálogo");
    expect(html).not.toContain('class="hero-bg"');
  });
});
