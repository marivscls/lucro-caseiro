import { describe, expect, it } from "vitest";

import {
  buildCatalogOrder,
  isoDateInTimeZone,
  isValidSlug,
  nationalPhoneDigits,
  renderCatalogErrorHtml,
  renderCatalogHtml,
  slugify,
} from "./catalog.domain";

describe("slugify", () => {
  it("converte nome do negocio em slug com acentos removidos", () => {
    expect(slugify("Doces da Má")).toBe("doces-da-ma");
  });

  it("remove caracteres especiais e espacos duplicados", () => {
    expect(slugify("  Bolos & Cia!  ")).toBe("bolos-cia");
  });

  it("cai no fallback quando o nome nao gera slug valido", () => {
    expect(slugify("!!!")).toBe("meu-catalogo");
  });

  it("limita o tamanho a 40 caracteres", () => {
    expect(slugify("a".repeat(60)).length).toBeLessThanOrEqual(40);
  });
});

describe("isValidSlug", () => {
  it("aceita minusculas, numeros e hifens", () => {
    expect(isValidSlug("doces-da-maria-2")).toBe(true);
  });

  it("rejeita maiusculas, espacos e hifens nas pontas", () => {
    expect(isValidSlug("Doces")).toBe(false);
    expect(isValidSlug("doces da maria")).toBe(false);
    expect(isValidSlug("-doces")).toBe(false);
    expect(isValidSlug("doces-")).toBe(false);
  });

  it("exige pelo menos 1 caractere e no maximo 40", () => {
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("a".repeat(41))).toBe(false);
  });
});

describe("renderCatalogHtml", () => {
  const product = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Bolo de Pote",
    category: "Doces",
    description: "Chocolate com morango",
    photoUrl: null,
    extraPhotos: [] as string[],
    salePrice: 12.5,
    saleUnit: "unit",
    variations: [],
  };
  const service = {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Consultoria",
    description: "Encontro individual",
    durationMinutes: 60,
    defaultPrice: 150,
    locationMode: "online" as const,
    bookingInstructions: null,
    variations: [],
    addOns: [],
    packages: [],
  };
  const baseCatalog = {
    brandId: "lucro-caseiro",
    businessName: "Doces",
    whatsapp: null,
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
    products: [] as (typeof product)[],
    totalProducts: 0,
  };

  it("usa o layout atual mesmo sem personalização publicada", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      products: [product],
      totalProducts: 1,
    });

    expect(html).toContain('class="store-card"');
    expect(html).toContain("Buscar no catálogo");
    expect(html).toContain("family=Manrope");
    expect(html).not.toContain('class="hero-bg"');
    expect(html).not.toContain("Nunito Sans");
  });

  it("renderiza nome, produto, preço e WhatsApp", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      businessName: "Doces da Maria",
      whatsapp: "11999998888",
      products: [product],
      totalProducts: 1,
    });

    expect(html).toContain("Doces da Maria");
    expect(html).toContain("Bolo de Pote");
    expect(html).toContain("12,50");
    expect(html).toContain("https://wa.me/5511999998888");
    expect(html).toContain("M17.472 14.382");
  });

  it("escapa HTML em campos do usuario", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      businessName: "<script>alert(1)</script>",
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("mostra capa, logo, tagline e faixa promocional", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      coverUrl: "https://cdn.example.com/capa.jpg",
      logoUrl: "https://cdn.example.com/logo.jpg",
      tagline: "Bolos artesanais feitos com amor",
      promoBanner: "Frete grátis hoje",
    });

    expect(html).toContain("https://cdn.example.com/capa.jpg");
    expect(html).toContain("https://cdn.example.com/logo.jpg");
    expect(html).toContain("Bolos artesanais feitos com amor");
    expect(html).toContain("Frete grátis hoje");
    expect(html).toContain('class="announcement"');
    expect(html).toContain('property="og:image"');
  });

  it("filtra produtos e serviços pelo tipo da URL", () => {
    const mixed = {
      ...baseCatalog,
      products: [product],
      totalProducts: 1,
      services: [service],
    };
    const productsHtml = renderCatalogHtml(mixed, "products");
    const servicesHtml = renderCatalogHtml(mixed, "services");

    expect(productsHtml).toContain('data-kind-filter="products"');
    expect(productsHtml).toContain("Bolo de Pote");
    expect(servicesHtml).toContain('data-kind-filter="services"');
    expect(servicesHtml).toContain("Consultoria");
  });

  it("marca scripts com o nonce da resposta", () => {
    const html = renderCatalogHtml(
      { ...baseCatalog, products: [product], totalProducts: 1 },
      "all",
      "nonce-seguro",
    );
    expect(html).toContain('<script nonce="nonce-seguro">');
    expect(html).not.toMatch(/<script>/);
  });

  it("usa a paleta rosa oficial no Lucro Caseiro sem personalizacao", () => {
    const html = renderCatalogHtml(baseCatalog);
    expect(html).toContain("#B65F72");
  });
});

describe("renderCatalogErrorHtml", () => {
  it("offers an explicit retry without exposing technical details", () => {
    const html = renderCatalogErrorHtml();
    expect(html).toContain("Não foi possível abrir o catálogo");
    expect(html).toContain("Tentar novamente");
    expect(html).toContain('<a href="">Tentar novamente</a>');
    expect(html).not.toContain("onclick=");
  });
});

describe("buildCatalogOrder", () => {
  const cake = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Bolo de Pote",
    category: "Doces",
    description: null,
    photoUrl: null,
    extraPhotos: [],
    salePrice: 12.5,
    saleUnit: "unit",
    variations: [],
  };
  const brigadeiro = {
    ...cake,
    id: "22222222-2222-2222-2222-222222222222",
    name: "Brigadeiro",
    salePrice: 2.3,
    variations: [
      { id: "33333333-3333-3333-3333-333333333333", name: "Ao leite", inStock: true },
      { id: "44444444-4444-4444-4444-444444444444", name: "Branco", inStock: false },
    ],
  };
  const today = "2026-11-15";

  it("soma itens repetidos e usa o preço da vitrine", () => {
    // Arrange
    const items = [
      { productId: cake.id, quantity: 1 },
      { productId: cake.id, quantity: 2 },
      {
        productId: brigadeiro.id,
        variationId: "33333333-3333-3333-3333-333333333333",
        quantity: 10,
      },
    ];
    // Act
    const draft = buildCatalogOrder(
      [cake, brigadeiro],
      { items, desiredDate: today, notes: null },
      today,
    );
    // Assert
    expect(draft).toMatchObject({
      ok: true,
      title: "3× Bolo de Pote, 10× Brigadeiro (Ao leite)",
      amount: 60.5,
    });
  });

  it("exige uma opção em estoque quando o produto tem variações", () => {
    const draft = buildCatalogOrder(
      [brigadeiro],
      {
        items: [
          {
            productId: brigadeiro.id,
            variationId: "44444444-4444-4444-4444-444444444444",
            quantity: 1,
          },
        ],
        desiredDate: today,
      },
      today,
    );
    expect(draft).toEqual({
      ok: false,
      error: "Escolha uma opção disponível de Brigadeiro.",
    });
  });

  it("corta o título longo em 200 caracteres", () => {
    const long = { ...cake, name: "Torta ".repeat(60).trim() };
    const draft = buildCatalogOrder(
      [long],
      { items: [{ productId: cake.id, quantity: 1 }], desiredDate: today },
      today,
    );
    expect(draft.ok && draft.title.length).toBe(200);
    expect(draft.ok && draft.title.endsWith("…")).toBe(true);
  });
});

describe("isoDateInTimeZone", () => {
  it("usa a data do fuso (madrugada UTC ainda é ontem em Brasília)", () => {
    expect(isoDateInTimeZone(new Date("2026-11-16T02:00:00Z"), "America/Sao_Paulo")).toBe(
      "2026-11-15",
    );
  });
});

describe("nationalPhoneDigits", () => {
  it("tira o 55 do país e a pontuação", () => {
    expect(nationalPhoneDigits("+55 (11) 97777-6666")).toBe("11977776666");
    expect(nationalPhoneDigits("(11) 97777-6666")).toBe("11977776666");
  });
});
