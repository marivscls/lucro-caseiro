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

  it("aplica cores personalizadas ao título e à descrição do hero", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      titleColor: "#123456",
      descriptionColor: "#654321",
      tagline: "Feito com carinho",
    });

    expect(html).toContain('style="color:#123456"');
    expect(html).toContain('class="bio" style="color:#654321"');
  });

  it("usa o seletor visual do catálogo em vez de expor a lista nativa do Android", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      products: [product],
      totalProducts: 1,
    });

    expect(html).toContain('class="catalog-select-native" id="catalog-category" hidden');
    expect(html).toContain('trigger.className = "catalog-select-trigger"');
    expect(html).toContain('dialog.className = "catalog-select-dialog"');
    expect(html).toContain('dialog.setAttribute("role", "dialog")');
    expect(html).not.toContain("dialog.showModal()");
    expect(html).toContain("[category, sort].filter(Boolean).forEach(enhanceSelect)");
  });

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
    expect(html).toContain('class="card catalog-item service-card"');
    expect(html).toContain('<div class="info"><p class="category">Serviço</p>');
    expect(html).not.toContain('class="service-mark"');
    expect(html).toContain('<main id="catalog-content" class="services-only">');
    expect(html).not.toContain('class="service-placeholder"');
    expect(html).toContain('class="tagline">Serviços</p>');
    expect(html).toContain('id="service-booking-form"');
    expect(html).toContain('class="booking-header"');
    expect(html).toContain('class="booking-content"');
    expect(html).toContain('class="booking-footer"');
    expect(html).toContain('id="booking-date" type="text"');
    expect(html).not.toContain('id="booking-date" type="date"');
    expect(html).toContain('id="booking-calendar-dialog"');
    expect(html).toContain('class="booking-calendar-weekdays"');
    expect(html).toContain("Array.from({ length: 42 }");
    expect(html).toContain("dateInput.dataset.iso = iso");
    expect(html).toContain('id="booking-time" type="text"');
    expect(html).toContain('placeholder="Ex: 14:30"');
    expect(html).not.toContain('id="booking-time" type="time"');
    expect(html).toContain("timeInput.value = maskTime(timeInput.value)");
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
    expect(html).toContain('class="catalog-tools"');
    expect(html).toContain('placeholder="O que você procura?"');
    expect(html).toContain('class="tagline">Produtos e serviços</p>');
    expect(html).toContain("1 produto e 1 serviço");
  });

  it("link de serviços usa apresentação própria", () => {
    const html = renderCatalogHtml(
      {
        ...baseCatalog,
        coverUrl: "https://cdn.example.com/produtos.jpg",
        tagline: "Produtos artesanais",
        promoBanner: "Frete grátis",
        serviceCoverUrl: "https://cdn.example.com/servicos.jpg",
        serviceTagline: "Atendimento feito para você",
        servicePromoBanner: "Agenda aberta neste mês",
        services: [service],
      },
      "services",
    );

    expect(html).toContain("https://cdn.example.com/servicos.jpg");
    expect(html).toContain("Atendimento feito para você");
    expect(html).toContain("Agenda aberta neste mês");
    expect(html).not.toContain("https://cdn.example.com/produtos.jpg");
    expect(html).not.toContain("Produtos artesanais");
    expect(html).not.toContain("Frete grátis");
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
    expect(html).toContain('class="tagline">Produtos e serviços</p>');
  });

  it("catálogo completo oferece navegação entre produtos e serviços", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      products: [product],
      totalProducts: 1,
      services: [service],
    });

    expect(html).toContain('class="catalog-section-nav"');
    expect(html).toContain("?tipo=produtos#catalog-content");
    expect(html).toContain("?tipo=servicos#catalog-content");
    expect(html).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
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
    expect(html).toContain("M17.472 14.382");
    expect(html).not.toContain("M8.1 8.1c.2-.4.5-.5.8-.5");
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
    expect(html).not.toContain('class="order product-order"');
    expect(html).not.toContain('class="floating-whatsapp"');
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

  it("cria busca por nome, descricao e categoria sem acentos", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      products: [
        {
          ...product,
          name: "Açúcar mascavo",
          description: "Maçã e canela",
          category: "Bolos especiais",
        },
      ],
    });

    expect(html).toContain('data-search="acucar mascavo maca e canela bolos especiais"');
    expect(html).toContain('placeholder="O que você procura?"');
    expect(html).toContain("searchTimer = setTimeout(update, 140)");
    expect(html).toContain('id="catalog-no-results" hidden');
  });

  it("renderiza chips somente a partir das categorias reais", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      products: [
        { ...product, category: "Tortas" },
        { ...product, id: "55555555-5555-5555-5555-555555555555", category: "Kits" },
      ],
    });

    expect(html).toContain('data-category-filter="Tortas"');
    expect(html).toContain('data-category-filter="Kits"');
    expect(html).not.toContain('data-category-filter="Salgados"');
  });

  it("declara dimensoes e prioriza apenas as primeiras imagens", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      products: [
        { ...product, photoUrl: "https://cdn.x/primeira.jpg" },
        {
          ...product,
          id: "55555555-5555-5555-5555-555555555555",
          photoUrl: "https://cdn.x/segunda.jpg",
        },
        {
          ...product,
          id: "66666666-6666-6666-6666-666666666666",
          photoUrl: "https://cdn.x/terceira.jpg",
        },
      ],
    });

    expect(html).toContain(
      'width="640" height="480" loading="eager" fetchpriority="high"',
    );
    expect(html).toContain(
      'src="https://cdn.x/terceira.jpg" alt="Bolo de Pote" width="640" height="480" loading="lazy"',
    );
  });

  it("exige variacao antes de montar o pedido completo do WhatsApp", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      whatsapp: "11999998888",
      products: [
        {
          ...product,
          variations: [
            {
              id: "77777777-7777-7777-7777-777777777777",
              name: "Grande",
              inStock: true,
            },
          ],
        },
      ],
    });

    expect(html).toContain('<option value="">Selecionar variação</option>');
    expect(html).toContain("Escolha uma variação antes de pedir.");
    expect(html).toContain('itemUrl.searchParams.set("produto", link.dataset.productId)');
    expect(html).toContain('aria-label="Pedir Bolo de Pote pelo WhatsApp"');
  });

  it("adapta contraste e inclui os breakpoints responsivos pedidos", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      accentColor: "#ffff00",
      products: [product],
    });

    expect(html).toContain("--catalog-accent-text: #24181E");
    expect(html).toContain("@media (max-width: 359px)");
    expect(html).toContain("@media (min-width: 360px)");
    expect(html).toContain("@media (min-width: 680px)");
    expect(html).toContain("env(safe-area-inset-bottom)");
    expect(html).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("usa a capa real no hero e nos metadados de compartilhamento", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      coverUrl: "https://cdn.example.com/capa.jpg",
      products: [product],
    });

    expect(html).toContain('class="hero-cover"');
    expect(html).toContain('alt="Capa de Doces"');
    expect(html).toContain(
      '<meta property="og:image" content="https://cdn.example.com/capa.jpg">',
    );
  });

  it("usa fotos dos produtos e o cupcake da marca quando a vitrine nao tem capa", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      products: [
        { ...product, photoUrl: "https://cdn.x/primeira.jpg" },
        {
          ...product,
          id: "55555555-5555-5555-5555-555555555555",
          photoUrl: "https://cdn.x/segunda.jpg",
        },
      ],
    });

    expect(html).toContain('class="hero-showcase hero-showcase-2"');
    expect(html).toContain('class="hero-showcase-item hero-showcase-item-1"');
    expect(html).toContain('class="avatar default-avatar"');
    expect(html).toContain('class="hero-shell has-visual"');
    expect(html).not.toContain('class="hero-cover"');
  });

  it("renderiza a foto de perfil no avatar quando definida", () => {
    const html = renderCatalogHtml({
      ...baseCatalog,
      logoUrl: "https://cdn.example.com/logo.jpg",
    });
    expect(html).toContain("https://cdn.example.com/logo.jpg");
  });

  it("marca scripts funcionais com o nonce da resposta", () => {
    const html = renderCatalogHtml(
      { ...baseCatalog, products: [product] },
      "all",
      "nonce-seguro",
    );
    expect(html).toContain('<script nonce="nonce-seguro">');
    expect(html).not.toMatch(/<script>/);
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
