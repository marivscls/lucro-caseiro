import type { CatalogSettings, PublicCatalogProduct } from "@lucro-caseiro/contracts";
import { describe, expect, it, vi } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import type { CatalogOwner, ICatalogRepo } from "./catalog.types";
import { CatalogUseCases } from "./catalog.usecases";

const USER_ID = "user-123";

function makeSettings(overrides: Partial<CatalogSettings> = {}): CatalogSettings {
  return {
    slug: "doces-da-maria",
    enabled: true,
    whatsapp: "11999998888",
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeProduct(): PublicCatalogProduct {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Bolo de Pote",
    description: null,
    photoUrl: null,
    salePrice: 12.5,
    saleUnit: "unit",
  };
}

function makeRepo(overrides: Partial<ICatalogRepo> = {}): ICatalogRepo {
  return {
    findByUser: () => Promise.resolve(makeSettings()),
    findOwnerBySlug: () =>
      Promise.resolve({
        ...makeSettings(),
        userId: USER_ID,
        businessName: "Doces da Maria",
        phone: "11988887777",
      }),
    slugTaken: () => Promise.resolve(false),
    upsert: (_userId, data) => Promise.resolve(makeSettings({ ...data })),
    listPublicProducts: () => Promise.resolve([makeProduct()]),
    getOwnerDefaults: (): Promise<CatalogOwner | null> =>
      Promise.resolve({
        userId: USER_ID,
        businessName: "Doces da Maria",
        phone: "11988887777",
      }),
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
    const upsert = vi.fn(
      (
        _userId: string,
        data: { slug: string; enabled: boolean; whatsapp: string | null },
      ) => Promise.resolve(makeSettings(data)),
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
});

describe("CatalogUseCases.getPublicCatalog", () => {
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
          Promise.resolve({
            ...makeSettings({ whatsapp: null }),
            userId: USER_ID,
            businessName: "Doces da Maria",
            phone: "11988887777",
          }),
      }),
    );

    const catalog = await sut.getPublicCatalog("doces-da-maria");

    expect(catalog.whatsapp).toBe("11988887777");
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
          Promise.resolve({
            ...makeSettings({ enabled: false }),
            userId: USER_ID,
            businessName: "Doces da Maria",
            phone: null,
          }),
      }),
    );

    await expect(sut.getPublicCatalog("doces-da-maria")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
