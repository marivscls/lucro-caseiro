import type { CatalogSettings, PublicCatalogProduct } from "@lucro-caseiro/contracts";
import { describe, expect, it, vi } from "vitest";

import { LimitExceededError, NotFoundError, ValidationError } from "../../shared/errors";
import type { CatalogOwner, CatalogSettingsData, ICatalogRepo } from "./catalog.types";
import { CatalogUseCases } from "./catalog.usecases";

const USER_ID = "user-123";

function makeSettings(overrides: Partial<CatalogSettings> = {}): CatalogSettings {
  return {
    slug: "doces-da-maria",
    enabled: true,
    whatsapp: "11999998888",
    coverUrl: null,
    logoUrl: null,
    pattern: null,
    accentColor: null,
    tagline: null,
    promoBanner: null,
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
    description: null,
    photoUrl: null,
    extraPhotos: [],
    salePrice: 12.5,
    saleUnit: "unit",
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

describe("CatalogUseCases.updateSettings", () => {
  it("atualiza slug e enabled", async () => {
    const sut = new CatalogUseCases(makeRepo());

    const settings = await sut.updateSettings(USER_ID, {
      slug: "novo-endereco",
      enabled: true,
    });

    expect(settings.slug).toBe("novo-endereco");
    expect(settings.enabled).toBe(true);
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
  });

  it("bloqueia personalizacao para plano essential (personalizacao e do profissional)", async () => {
    const sut = new CatalogUseCases(
      makeRepo({
        getOwnerDefaults: () => Promise.resolve(makeOwner({ plan: "essential" })),
      }),
    );

    await expect(
      sut.updateSettings(USER_ID, { accentColor: "rose" }),
    ).rejects.toBeInstanceOf(LimitExceededError);
  });

  it("permite personalizacao para plano profissional", async () => {
    const sut = new CatalogUseCases(
      makeRepo({
        getOwnerDefaults: () => Promise.resolve(makeOwner({ plan: "professional" })),
      }),
    );

    const settings = await sut.updateSettings(USER_ID, {
      accentColor: "rose",
      tagline: "Bolos artesanais",
      coverUrl: "https://cdn.x/capa.jpg",
      promoBanner: "Frete grátis hoje",
    });

    expect(settings.accentColor).toBe("rose");
    expect(settings.tagline).toBe("Bolos artesanais");
    expect(settings.coverUrl).toBe("https://cdn.x/capa.jpg");
    expect(settings.promoBanner).toBe("Frete grátis hoje");
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

  it("plano essential ainda limita a vitrine a 3 produtos (catalogo completo e do profissional)", async () => {
    const many = Array.from({ length: 8 }, () => makeProduct());
    const sut = new CatalogUseCases(
      makeRepo({
        listPublicProducts: () => Promise.resolve(many),
        findOwnerBySlug: () =>
          Promise.resolve({ ...makeSettings(), ...makeOwner({ plan: "essential" }) }),
      }),
    );

    const catalog = await sut.getPublicCatalog("doces-da-maria");

    expect(catalog.products).toHaveLength(3);
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

  it("oculta personalizacao quando o dono nao e profissional", async () => {
    const sut = new CatalogUseCases(
      makeRepo({
        findOwnerBySlug: () =>
          Promise.resolve({
            ...makeSettings({
              coverUrl: "https://cdn.x/capa.jpg",
              accentColor: "rose",
              tagline: "Feito com amor",
              promoBanner: "Frete grátis hoje",
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
  });

  it("exibe personalizacao quando o dono e profissional", async () => {
    const sut = new CatalogUseCases(
      makeRepo({
        findOwnerBySlug: () =>
          Promise.resolve({
            ...makeSettings({
              accentColor: "rose",
              tagline: "Feito com amor",
              promoBanner: "Frete grátis hoje",
            }),
            ...makeOwner({ plan: "professional" }),
          }),
      }),
    );

    const catalog = await sut.getPublicCatalog("doces-da-maria");

    expect(catalog.accentColor).toBe("rose");
    expect(catalog.tagline).toBe("Feito com amor");
    expect(catalog.promoBanner).toBe("Frete grátis hoje");
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
