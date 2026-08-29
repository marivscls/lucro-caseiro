import { describe, expect, it } from "vitest";

import {
  isValidSlug,
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
