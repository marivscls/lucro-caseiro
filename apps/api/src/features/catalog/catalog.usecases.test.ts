import type {
  CatalogSettings,
  PublicCatalogProduct,
  StorefrontCustomization,
} from "@lucro-caseiro/contracts";
import { describe, expect, it, vi } from "vitest";

import { LimitExceededError, NotFoundError, ValidationError } from "../../shared/errors";
import type { CatalogOwner, CatalogSettingsData, ICatalogRepo } from "./catalog.types";
import { CatalogUseCases } from "./catalog.usecases";

const USER_ID = "user-123";

function makeSettings(overrides: Partial<CatalogSettings> = {}): CatalogSettings {
  return {
    brandId: "lucro-caseiro",
    slug: "doces-da-maria",
    enabled: true,
    whatsapp: "11999998888",
    coverUrl: null,
    logoUrl: null,
    pattern: null,
    accentColor: null,
    titleColor: null,
    descriptionColor: null,
    tagline: null,
    promoBanner: null,
    promoBannerEnabled: true,
    serviceCoverUrl: null,
    serviceTitleColor: null,
    serviceDescriptionColor: null,
    serviceTagline: null,
    servicePromoBanner: null,
    servicePromoBannerEnabled: true,
    customization: null,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeOwner(overrides: Partial<CatalogOwner> = {}): CatalogOwner {
  return {
    userId: USER_ID,
    businessName: "Doces da Maria",
    phone: "11988887777",
    plan: "free",
    planExpiresAt: null,
    ...overrides,
  };
}

function makeProduct(): PublicCatalogProduct {
  return {
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
}

function makeRepo(overrides: Partial<ICatalogRepo> = {}): ICatalogRepo {
  return {
    findByUser: () => Promise.resolve(makeSettings()),
    findOwnerBySlug: () => Promise.resolve({ ...makeSettings(), ...makeOwner() }),
    slugTaken: () => Promise.resolve(false),
    upsert: (_userId, data) => Promise.resolve(makeSettings({ ...data })),
    listPublicProducts: () => Promise.resolve([makeProduct()]),
    getOwnerDefaults: () => Promise.resolve(makeOwner()),
    ...overrides,
  };
}

describe("CatalogUseCases.getSettings", () => {
  it("retorna settings existentes sem criar defaults", async () => {
    const upsert = vi.fn();
    const sut = new CatalogUseCases(makeRepo({ upsert }));

    const settings = await sut.getSettings(USER_ID);

    expect(settings.slug).toBe("doces-da-maria");
    expect(upsert).not.toHaveBeenCalled();
  });

  it("cria defaults desabilitados a partir do nome do negocio na primeira vez", async () => {
    const upsert = vi.fn((_userId: string, data: CatalogSettingsData) =>
      Promise.resolve(makeSettings(data)),
    );
    const sut = new CatalogUseCases(
      makeRepo({ findByUser: () => Promise.resolve(null), upsert }),
    );

    const settings = await sut.getSettings(USER_ID);

    expect(settings.enabled).toBe(false);
    expect(settings.slug).toBe("doces-da-maria");
    expect(settings.whatsapp).toBe("11988887777");
  });

  it("resolve conflito de slug com sufixo incremental", async () => {
    const slugTaken = vi.fn().mockResolvedValueOnce(true).mockResolvedValue(false);
    const sut = new CatalogUseCases(
      makeRepo({ findByUser: () => Promise.resolve(null), slugTaken }),
    );

    const settings = await sut.getSettings(USER_ID);

    expect(settings.slug).toBe("doces-da-maria-2");
  });
});

describe("CatalogUseCases.getSlugAvailability", () => {
  it("informa formato inválido sem consultar conflito", async () => {
    const slugTaken = vi.fn();
    const sut = new CatalogUseCases(makeRepo({ slugTaken }));

    await expect(sut.getSlugAvailability(USER_ID, "Endereço inválido")).resolves.toEqual({
      available: false,
      reason: expect.stringContaining("letras minúsculas"),
    });
    expect(slugTaken).not.toHaveBeenCalled();
  });

  it("informa disponibilidade sem persistir o endereço", async () => {
    const sut = new CatalogUseCases(
      makeRepo({ slugTaken: () => Promise.resolve(false) }),
    );

    await expect(sut.getSlugAvailability(USER_ID, "novo-endereco")).resolves.toEqual({
      available: true,
      reason: null,
    });
  });
});

describe("CatalogUseCases.updateSettings", () => {
  const draft = {
    version: 1,
    identity: { displayName: "Rascunho" },
    publication: { slug: "doces-da-maria", status: "draft", publishedAt: null },
  } as StorefrontCustomization;

  it("atualiza slug e enabled", async () => {
    const sut = new CatalogUseCases(makeRepo());

    const settings = await sut.updateSettings(USER_ID, {
      slug: "novo-endereco",
      enabled: true,
    });

    expect(settings.slug).toBe("novo-endereco");
    expect(settings.enabled).toBe(true);
  });

  it("salva rascunho sem substituir o snapshot publicado", async () => {
    const published = {
      ...draft,
      identity: { ...draft.identity, displayName: "Publicado" },
    } as StorefrontCustomization;
    const upsert = vi.fn((_userId: string, data: CatalogSettingsData) =>
      Promise.resolve(makeSettings(data)),
    );
    const sut = new CatalogUseCases(
      makeRepo({
        findByUser: () =>
          Promise.resolve(
            makeSettings({ customization: published, publishedCustomization: published }),
          ),
        getOwnerDefaults: () => Promise.resolve(makeOwner({ plan: "essential" })),
        upsert,
      }),
    );

    await sut.updateSettings(USER_ID, { customization: draft, publishStorefront: false });

    expect(upsert).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({
        customization: draft,
        publishedCustomization: published,
      }),
    );
  });

  it("publicar copia o rascunho para o snapshot publico", async () => {
    const upsert = vi.fn((_userId: string, data: CatalogSettingsData) =>
      Promise.resolve(makeSettings(data)),
    );
    const sut = new CatalogUseCases(
      makeRepo({
        upsert,
        getOwnerDefaults: () => Promise.resolve(makeOwner({ plan: "essential" })),
      }),
    );

    await sut.updateSettings(USER_ID, { customization: draft, publishStorefront: true });

    expect(upsert).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({
        customization: draft,
        publishedCustomization: draft,
        publishedProducts: [makeProduct()],
        publishedServices: [],
      }),
    );
  });

  it("rejeita slug invalido", async () => {
    const sut = new CatalogUseCases(makeRepo());

    await expect(
      sut.updateSettings(USER_ID, { slug: "Endereco Invalido" as never }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejeita slug ja usado por outro usuario", async () => {
    const sut = new CatalogUseCases(makeRepo({ slugTaken: () => Promise.resolve(true) }));

    await expect(
      sut.updateSettings(USER_ID, { slug: "ja-existe" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("mantem whatsapp atual quando nao enviado", async () => {
    const sut = new CatalogUseCases(makeRepo());

    const settings = await sut.updateSettings(USER_ID, { enabled: false });

    expect(settings.whatsapp).toBe("11999998888");
  });

  it("bloqueia personalizacao para plano free (LIMIT_EXCEEDED)", async () => {
    const sut = new CatalogUseCases(makeRepo());

    await expect(
      sut.updateSettings(USER_ID, { accentColor: "rose" }),
    ).rejects.toBeInstanceOf(LimitExceededError);
    await expect(
      sut.updateSettings(USER_ID, { coverUrl: "https://cdn.x/capa.jpg" }),
    ).rejects.toBeInstanceOf(LimitExceededError);
    await expect(
      sut.updateSettings(USER_ID, { tagline: "Feito com amor" }),
    ).rejects.toBeInstanceOf(LimitExceededError);
    await expect(
      sut.updateSettings(USER_ID, { promoBanner: "Frete grátis hoje" }),
    ).rejects.toBeInstanceOf(LimitExceededError);
    await expect(
      sut.updateSettings(USER_ID, { serviceTagline: "Agenda aberta" }),
    ).rejects.toBeInstanceOf(LimitExceededError);
  });

  it("permite personalizacao para plano essential", async () => {
    const sut = new CatalogUseCases(
      makeRepo({
        getOwnerDefaults: () => Promise.resolve(makeOwner({ plan: "essential" })),
      }),
    );

    const settings = await sut.updateSettings(USER_ID, {
      accentColor: "rose",
      titleColor: "#24181E",
      descriptionColor: "#4A2332",
      tagline: "Bolos artesanais",
    });

    expect(settings.accentColor).toBe("rose");
    expect(settings.titleColor).toBe("#24181E");
    expect(settings.descriptionColor).toBe("#4A2332");
    expect(settings.tagline).toBe("Bolos artesanais");
  });

  it("permite personalizacao para plano profissional", async () => {
    const sut = new CatalogUseCases(
      makeRepo({
        getOwnerDefaults: () => Promise.resolve(makeOwner({ plan: "professional" })),
      }),
    );

    const settings = await sut.updateSettings(USER_ID, {
      accentColor: "rose",
      titleColor: "#24181E",
      descriptionColor: "#4A2332",
      tagline: "Bolos artesanais",
      coverUrl: "https://cdn.x/capa.jpg",
      promoBanner: "Frete grátis hoje",
      promoBannerEnabled: false,
      serviceCoverUrl: "https://cdn.x/servicos.jpg",
      serviceTitleColor: "#FFFFFF",
      serviceDescriptionColor: "#F5E5E8",
      serviceTagline: "Atendimento personalizado",
      servicePromoBanner: "Agenda aberta",
      servicePromoBannerEnabled: false,
    });

    expect(settings.accentColor).toBe("rose");
    expect(settings.titleColor).toBe("#24181E");
    expect(settings.descriptionColor).toBe("#4A2332");
    expect(settings.tagline).toBe("Bolos artesanais");
    expect(settings.coverUrl).toBe("https://cdn.x/capa.jpg");
    expect(settings.promoBanner).toBe("Frete grátis hoje");
    expect(settings.promoBannerEnabled).toBe(false);
    expect(settings.serviceCoverUrl).toBe("https://cdn.x/servicos.jpg");
    expect(settings.serviceTitleColor).toBe("#FFFFFF");
    expect(settings.serviceDescriptionColor).toBe("#F5E5E8");
    expect(settings.serviceTagline).toBe("Atendimento personalizado");
    expect(settings.servicePromoBanner).toBe("Agenda aberta");
    expect(settings.servicePromoBannerEnabled).toBe(false);
  });

  it("campos basicos (slug/enabled/whatsapp) seguem livres no plano free", async () => {
    const sut = new CatalogUseCases(makeRepo());

    const settings = await sut.updateSettings(USER_ID, {
      slug: "novo",
      enabled: true,
      whatsapp: "11911112222",
    });

    expect(settings.slug).toBe("novo");
  });
});

describe("CatalogUseCases.getPublicCatalog", () => {
  it("plano free exibe no maximo 3 produtos, com totalProducts real", async () => {
    const many = Array.from({ length: 8 }, () => makeProduct());
    const sut = new CatalogUseCases(
      makeRepo({ listPublicProducts: () => Promise.resolve(many) }),
    );

    const catalog = await sut.getPublicCatalog("doces-da-maria");

    expect(catalog.products).toHaveLength(3);
    expect(catalog.totalProducts).toBe(8);
  });

  it("mantem o produto focado visivel no catalogo limitado", async () => {
    const many = Array.from({ length: 5 }, (_, index) => ({
      ...makeProduct(),
      id: `11111111-1111-1111-1111-11111111111${index}`,
      name: `Produto ${index}`,
    }));
    const focusedProduct = many[4]!;
    const sut = new CatalogUseCases(
      makeRepo({ listPublicProducts: () => Promise.resolve(many) }),
    );

    const catalog = await sut.getPublicCatalog("doces-da-maria", focusedProduct.id);

    expect(catalog.products).toHaveLength(3);
    expect(catalog.products[0]?.id).toBe(focusedProduct.id);
    expect(catalog.totalProducts).toBe(5);
  });

  it("plano profissional exibe todos os produtos", async () => {
    const many = Array.from({ length: 8 }, () => makeProduct());
    const sut = new CatalogUseCases(
      makeRepo({
        listPublicProducts: () => Promise.resolve(many),
        findOwnerBySlug: () =>
          Promise.resolve({ ...makeSettings(), ...makeOwner({ plan: "professional" }) }),
      }),
    );

    const catalog = await sut.getPublicCatalog("doces-da-maria");

    expect(catalog.products).toHaveLength(8);
    expect(catalog.totalProducts).toBe(8);
  });

  it("plano essential exibe todos os produtos", async () => {
    const many = Array.from({ length: 8 }, () => makeProduct());
    const sut = new CatalogUseCases(
      makeRepo({
        listPublicProducts: () => Promise.resolve(many),
        findOwnerBySlug: () =>
          Promise.resolve({ ...makeSettings(), ...makeOwner({ plan: "essential" }) }),
      }),
    );

    const catalog = await sut.getPublicCatalog("doces-da-maria");

    expect(catalog.products).toHaveLength(8);
    expect(catalog.totalProducts).toBe(8);
  });

  it("retorna catalogo com produtos quando habilitado", async () => {
    const sut = new CatalogUseCases(makeRepo());

    const catalog = await sut.getPublicCatalog("doces-da-maria");

    expect(catalog.businessName).toBe("Doces da Maria");
    expect(catalog.products).toHaveLength(1);
    expect(catalog.whatsapp).toBe("11999998888");
  });

  it("usa o telefone do usuario quando whatsapp do catalogo e null", async () => {
    const sut = new CatalogUseCases(
      makeRepo({
        findOwnerBySlug: () =>
          Promise.resolve({ ...makeSettings({ whatsapp: null }), ...makeOwner() }),
      }),
    );

    const catalog = await sut.getPublicCatalog("doces-da-maria");

    expect(catalog.whatsapp).toBe("11988887777");
  });

  it("oculta personalizacao quando o dono esta no plano gratuito", async () => {
    const sut = new CatalogUseCases(
      makeRepo({
        findOwnerBySlug: () =>
          Promise.resolve({
            ...makeSettings({
              coverUrl: "https://cdn.x/capa.jpg",
              accentColor: "rose",
              tagline: "Feito com amor",
              promoBanner: "Frete grátis hoje",
              serviceCoverUrl: "https://cdn.x/servicos.jpg",
              serviceTagline: "Agenda personalizada",
              servicePromoBanner: "Vagas abertas",
            }),
            ...makeOwner({ plan: "free" }),
          }),
      }),
    );

    const catalog = await sut.getPublicCatalog("doces-da-maria");

    expect(catalog.coverUrl).toBeNull();
    expect(catalog.accentColor).toBeNull();
    expect(catalog.tagline).toBeNull();
    expect(catalog.promoBanner).toBeNull();
    expect(catalog.serviceCoverUrl).toBeNull();
    expect(catalog.serviceTagline).toBeNull();
    expect(catalog.servicePromoBanner).toBeNull();
  });

  it("exibe personalizacao quando o dono e essential", async () => {
    const sut = new CatalogUseCases(
      makeRepo({
        findOwnerBySlug: () =>
          Promise.resolve({
            ...makeSettings({
              accentColor: "rose",
              tagline: "Feito com amor",
              promoBanner: "Frete grátis hoje",
              serviceCoverUrl: "https://cdn.x/servicos.jpg",
              serviceTagline: "Agenda personalizada",
              servicePromoBanner: "Vagas abertas",
            }),
            ...makeOwner({ plan: "essential" }),
          }),
      }),
    );

    const catalog = await sut.getPublicCatalog("doces-da-maria");

    expect(catalog.accentColor).toBe("rose");
    expect(catalog.tagline).toBe("Feito com amor");
    expect(catalog.promoBanner).toBe("Frete grátis hoje");
    expect(catalog.serviceCoverUrl).toBe("https://cdn.x/servicos.jpg");
    expect(catalog.serviceTagline).toBe("Agenda personalizada");
    expect(catalog.servicePromoBanner).toBe("Vagas abertas");
  });

  it("expõe somente o snapshot publicado, nunca o rascunho", async () => {
    const draft = {
      version: 1,
      identity: { displayName: "Rascunho" },
    } as StorefrontCustomization;
    const published = {
      version: 1,
      identity: { displayName: "Publicado" },
    } as StorefrontCustomization;
    const sut = new CatalogUseCases(
      makeRepo({
        listPublicProducts: () =>
          Promise.resolve([{ ...makeProduct(), name: "Produto atual não publicado" }]),
        findOwnerBySlug: () =>
          Promise.resolve({
            ...makeSettings({
              customization: draft,
              publishedCustomization: published,
            }),
            ...makeOwner({ plan: "essential" }),
            publishedProducts: [{ ...makeProduct(), name: "Produto publicado" }],
            publishedServices: [],
          }),
      }),
    );

    const catalog = await sut.getPublicCatalog("doces-da-maria");

    expect(catalog.customization).toBe(published);
    expect(catalog.customization).not.toBe(draft);
    expect(catalog.products[0]?.name).toBe("Produto publicado");
  });

  it("não vaza o rascunho quando ainda não há personalização publicada", async () => {
    const draft = {
      version: 1,
      identity: { displayName: "Rascunho" },
    } as StorefrontCustomization;
    const sut = new CatalogUseCases(
      makeRepo({
        findOwnerBySlug: () =>
          Promise.resolve({
            ...makeSettings({
              customization: draft,
              publishedCustomization: null,
            }),
            ...makeOwner({ plan: "essential" }),
          }),
      }),
    );

    const catalog = await sut.getPublicCatalog("doces-da-maria");

    expect(catalog.customization).toBeNull();
  });

  it("preserva a faixa salva, mas não a expõe quando sua exibição está desligada", async () => {
    const sut = new CatalogUseCases(
      makeRepo({
        findOwnerBySlug: () =>
          Promise.resolve({
            ...makeSettings({
              promoBanner: "Frete grátis hoje",
              promoBannerEnabled: false,
              servicePromoBanner: "Vagas abertas",
              servicePromoBannerEnabled: false,
            }),
            ...makeOwner({ plan: "essential" }),
          }),
      }),
    );

    const catalog = await sut.getPublicCatalog("doces-da-maria");

    expect(catalog.promoBanner).toBeNull();
    expect(catalog.servicePromoBanner).toBeNull();
  });

  it("404 quando slug nao existe", async () => {
    const sut = new CatalogUseCases(
      makeRepo({ findOwnerBySlug: () => Promise.resolve(null) }),
    );

    await expect(sut.getPublicCatalog("nao-existe")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("404 quando catalogo esta desativado", async () => {
    const sut = new CatalogUseCases(
      makeRepo({
        findOwnerBySlug: () =>
          Promise.resolve({ ...makeSettings({ enabled: false }), ...makeOwner() }),
      }),
    );

    await expect(sut.getPublicCatalog("doces-da-maria")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("CatalogUseCases.createPublicServiceBooking", () => {
  const booking = {
    id: "33333333-3333-4333-8333-333333333333",
    serviceId: "22222222-2222-4222-8222-222222222222",
    serviceName: "Teste de serviço 2",
    clientName: "Maria Cliente",
    phone: "11999998888",
    desiredDate: "2026-08-10",
    desiredTime: "14:30",
    locationMode: "business" as const,
    notes: null,
    status: "new" as const,
    createdAt: "2026-08-04T12:00:00.000Z",
  };
  const request = {
    serviceId: booking.serviceId,
    clientName: booking.clientName,
    phone: booking.phone,
    desiredDate: booking.desiredDate,
    desiredTime: booking.desiredTime,
    locationMode: booking.locationMode,
    notes: booking.notes,
  };

  it("avisa o dono do catálogo depois de persistir a solicitação", async () => {
    const notify = vi.fn(() => Promise.resolve());
    const sut = new CatalogUseCases(
      makeRepo({ createPublicServiceBooking: () => Promise.resolve(booking) }),
      notify,
    );

    await expect(
      sut.createPublicServiceBooking("doces-da-maria", request),
    ).resolves.toEqual(booking);
    expect(notify).toHaveBeenCalledWith(
      USER_ID,
      "lucro-caseiro",
      booking.serviceId,
      booking.serviceName,
      booking.id,
    );
  });

  it("mantém a solicitação criada quando o push falha", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const sut = new CatalogUseCases(
      makeRepo({ createPublicServiceBooking: () => Promise.resolve(booking) }),
      () => Promise.reject(new Error("Expo indisponível")),
    );

    await expect(
      sut.createPublicServiceBooking("doces-da-maria", request),
    ).resolves.toEqual(booking);
    expect(warn).toHaveBeenCalledWith(
      "Service booking push notification failed",
      expect.any(Error),
    );
    warn.mockRestore();
  });
});
