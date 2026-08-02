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

  it("renderiza galeria (scroll) quando o produto tem mais de uma foto", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      products: [
        {
          ...product,
          photoUrl: "https://cdn.x/a.jpg",
          extraPhotos: ["https://cdn.x/b.jpg", "https://cdn.x/c.jpg"],
        },
      ],
    });
    expect(html).toContain('class="gallery"');
    expect(html).toContain("https://cdn.x/b.jpg");
    expect(html).toContain("https://cdn.x/c.jpg");
  });

  it("sem foto extra usa imagem única (sem galeria)", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      products: [{ ...product, photoUrl: "https://cdn.x/a.jpg" }],
    });
    expect(html).not.toContain('class="gallery"');
  });
  const baseCatalog = {
    brandId: "lucro-caseiro",
    businessName: "Doces",
    whatsapp: null,
    coverUrl: null,
    logoUrl: null,
    accentColor: null,
    pattern: null,
    tagline: null,
    promoBanner: null,
    products: [] as (typeof product)[],
    totalProducts: 0,
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
    addOns: [
      {
        id: "33333333-3333-3333-3333-333333333333",
        name: "Retorno",
        durationMinutes: 30,
        price: 50,
      },
    ],
    packages: [
      {
        id: "44444444-4444-4444-4444-444444444444",
        name: "Acompanhamento",
        sessions: 4,
        price: 500,
        validityDays: 90,
        recurrenceDays: 14,
      },
    ],
  };

  it("renderiza serviço público e o formulário de solicitação de horário", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      services: [service],
    });

    expect(html).toContain("Consultoria");
    expect(html).toContain("Atendimento online");
    expect(html).toContain("Acompanhamento · 4 sessões");
    expect(html).toContain('class="card service-card"');
    expect(html).toContain('<div class="info"><p class="category">Serviço</p>');
    expect(html).not.toContain('class="service-mark"');
    expect(html).toContain('<main class="services-only">');
    expect(html).not.toContain('class="service-placeholder"');
    expect(html).toContain('class="tagline">Serviços</p>');
    expect(html).toContain('id="service-booking-form"');
    expect(html).toContain('class="booking-header"');
    expect(html).toContain('class="booking-content"');
    expect(html).toContain('class="booking-footer"');
    expect(html).toContain("#service-booking-dialog { inset: 0;");
    expect(html).toContain("margin: auto; background: #fffdfb;");
    expect(html).toContain("bookingContent.scrollTop = 0");
    expect(html).toContain('fetch(location.pathname + "/service-bookings"');
  });

  it("link de serviços renderiza somente serviços", () => {
    const html = renderCatalogHtml(
      {
        ...baseCatalog,
        products: [product],
        totalProducts: 1,
        services: [service],
      },
      "services",
    );

    expect(html).toContain("Consultoria");
    expect(html).not.toContain("Bolo de Pote");
    expect(html).not.toContain('class="products-section"');
    expect(html).not.toContain('class="catalog-tools"');
    expect(html).toContain('class="tagline">Serviços</p>');
    expect(html).toContain("1 serviço disponível");
  });

  it("link de produtos renderiza somente produtos", () => {
    const html = renderCatalogHtml(
      {
        ...baseCatalog,
        products: [product],
        totalProducts: 1,
        services: [service],
      },
      "products",
    );

    expect(html).toContain("Bolo de Pote");
    expect(html).not.toContain("Consultoria");
    expect(html).not.toContain('class="services-section"');
    expect(html).not.toContain('id="service-booking-form"');
    expect(html).toContain('class="tagline">Catálogo de produtos</p>');
  });

  it("catálogo completo oferece navegação entre produtos e serviços", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      products: [product],
      totalProducts: 1,
      services: [service],
    });

    expect(html).toContain('class="catalog-section-nav"');
    expect(html).toContain("?tipo=produtos#products-title");
    expect(html).toContain("?tipo=servicos#services-title");
    expect(html).toContain("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)");
  });

  it("renderiza a faixa promocional quando definida", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      promoBanner: "Frete grátis hoje 🚚",
    });
    expect(html).toContain('<div class="promo">Frete grátis hoje 🚚</div>');
  });

  it("omite a faixa promocional quando ausente", () => {
    const html = renderCatalogHtml(baseCatalog);
    expect(html).not.toContain('class="promo"');
  });

  it("mostra aviso quando ha mais produtos do que os exibidos (plano free)", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      products: [product],
      totalProducts: 8,
    });
    expect(html).toContain("Mostrando 1 de 8 produtos");
  });

  it("rodape inclui a marca e o link correto do app", () => {
    const html = renderCatalogHtml(baseCatalog);
    expect(html).toContain("Lucro Caseiro");
    expect(html).toContain("br.com.orionseven.lucrocaseiro");
  });

  it("renderiza variações e identifica as esgotadas", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      brandId: "lucro-papelaria",
      products: [
        {
          ...product,
          variations: [
            {
              id: "22222222-2222-2222-2222-222222222222",
              name: "Azul",
              inStock: true,
            },
            {
              id: "33333333-3333-3333-3333-333333333333",
              name: "Rosa",
              inStock: false,
            },
          ],
        },
      ],
    });
    expect(html).toContain("Azul");
    expect(html).toContain("Rosa · esgotado");
    expect(html).toContain("br.com.orionseven.lucropapelaria");
  });

  it("renderiza nome do negocio, produto e preco formatado", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      businessName: "Doces da Maria",
      whatsapp: "11999998888",
      products: [product],
    });
    expect(html).toContain("Doces da Maria");
    expect(html).toContain("Bolo de Pote");
    expect(html).toContain("R$ 12,50");
    expect(html).toContain("https://wa.me/5511999998888");
    expect(html).toContain(`id="produto-${product.id}"`);
  });

  it("mostra sufixo /kg para produtos por peso", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      products: [{ ...product, saleUnit: "kg", salePrice: 45 }],
    });
    expect(html).toContain("R$ 45,00");
    expect(html).toContain(">/kg</span>");
  });

  it("escapa HTML em campos do usuario", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      businessName: "<script>alert(1)</script>",
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("sem whatsapp, nao renderiza botao de pedido", () => {
    const html = renderCatalogHtml({ ...baseCatalog, products: [product] });
    expect(html).not.toContain("wa.me");
  });

  it("sem produtos, mostra estado vazio", () => {
    const html = renderCatalogHtml(baseCatalog);
    expect(html).toContain("Nada disponível no momento.");
  });

  it("usa a paleta rosa oficial no Lucro Caseiro sem personalizacao", () => {
    const html = renderCatalogHtml(baseCatalog);
    expect(html).toContain("#B65F72");
  });

  it("aplica preset de cor quando definido", () => {
    // com produto: o estado vazio (cesta SVG marrom) nao entra na pagina
    const html = renderCatalogHtml({
      ...baseCatalog,
      accentColor: "rose",
      products: [product],
    });
    expect(html).toContain("#B65F72");
    expect(html).not.toContain("#8c5a45");
  });

  it("aplica cor hexadecimal customizada com paleta derivada", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      accentColor: "#ff66aa",
      products: [product],
    });
    expect(html).toContain("#ff66aa");
    expect(html).not.toContain("#8c5a45");
  });

  it("cai no marrom padrao se a cor salva for invalida", () => {
    const html = renderCatalogHtml({ ...baseCatalog, accentColor: "vermelho" });
    expect(html).toContain("#8c5a45");
  });

  it("renderiza capa e tagline quando definidas", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      coverUrl: "https://cdn.example.com/capa.jpg",
      tagline: "Bolos artesanais feitos com amor",
    });
    expect(html).toContain("https://cdn.example.com/capa.jpg");
    expect(html).toContain("Bolos artesanais feitos com amor");
  });

  it("renderiza overlay de pattern quando definido", () => {
    const html = renderCatalogHtml({ ...baseCatalog, pattern: "dots" });
    expect(html).toContain('class="pattern"');
    expect(html).toContain("radial-gradient");
  });

  it("sem pattern, nao renderiza overlay", () => {
    const html = renderCatalogHtml(baseCatalog);
    expect(html).not.toContain('class="pattern"');
  });

  it("renderiza a foto de perfil no avatar quando definida", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      logoUrl: "https://cdn.example.com/logo.jpg",
    });
    expect(html).toContain("https://cdn.example.com/logo.jpg");
  });
});

describe("renderCatalogErrorHtml", () => {
  it("offers an explicit retry without exposing technical details", () => {
    const html = renderCatalogErrorHtml();
    expect(html).toContain("Não foi possível abrir o catálogo");
    expect(html).toContain("Tentar novamente");
    expect(html).toContain("location.reload()");
  });
});
