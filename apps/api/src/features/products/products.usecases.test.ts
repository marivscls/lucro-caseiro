import type { Product } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { ProductsUseCases } from "./products.usecases";
import type { CreateProductData, IProductsRepo } from "./products.types";

const USER_ID = "user-123";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    userId: USER_ID,
    name: "Brigadeiro",
    description: null,
    category: "doces",
    photoUrl: null,
    extraPhotos: [],
    code: null,
    salePrice: 3.5,
    saleUnit: "unit",
    costPrice: null,
    recipeId: null,
    stockQuantity: null,
    stockAlertThreshold: null,
    isComposite: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<IProductsRepo> = {}): IProductsRepo {
  return {
    create: (_userId: string, data: CreateProductData) =>
      Promise.resolve(makeProduct({ name: data.name, salePrice: data.salePrice })),
    findById: () => Promise.resolve(makeProduct()),
    findAll: () => Promise.resolve({ items: [makeProduct()], total: 1 }),
    update: (_userId: string, _id: string, data: Partial<CreateProductData>) => {
      // `components` tem shape de input (sem name/costPrice); nao se aplica ao Product.
      const patch: Partial<Product> = {};
      if (data.name !== undefined) patch.name = data.name;
      if (data.salePrice !== undefined) patch.salePrice = data.salePrice;
      if (data.isComposite !== undefined) patch.isComposite = data.isComposite;
      return Promise.resolve(makeProduct(patch));
    },
    delete: () => Promise.resolve(true),
    countByUser: () => Promise.resolve(1),
    decrementStock: () => Promise.resolve(),
    averageActivePrice: () => Promise.resolve(10),
    findComponentCandidates: (_userId: string, ids: string[]) =>
      Promise.resolve(ids.map((id) => ({ id, isComposite: false }))),
    ...overrides,
  };
}

function makeSut(repoOverrides: Partial<IProductsRepo> = {}) {
  const repo = makeRepo(repoOverrides);
  const sut = new ProductsUseCases(repo);
  return { sut, repo };
}

describe("ProductsUseCases", () => {
  describe("create", () => {
    it("creates a product with valid data", async () => {
      const { sut } = makeSut();
      const result = await sut.create(USER_ID, {
        name: "Brigadeiro",
        category: "doces",
        salePrice: 3.5,
      });

      expect(result.name).toBe("Brigadeiro");
      expect(result.salePrice).toBe(3.5);
    });

    it("throws ValidationError for invalid data", async () => {
      const { sut } = makeSut();
      await expect(
        sut.create(USER_ID, { name: "", category: "doces", salePrice: -1 }),
      ).rejects.toThrow(ValidationError);
    });

    it("repassa saleUnit 'kg' para o repo (venda por peso)", async () => {
      let captured: CreateProductData | undefined;
      const repo = makeRepo({
        create: (_userId: string, data: CreateProductData) => {
          captured = data;
          return Promise.resolve(makeProduct({ saleUnit: "kg" }));
        },
      });
      const sut = new ProductsUseCases(repo);

      const result = await sut.create(USER_ID, {
        name: "Bolo",
        category: "bolos",
        salePrice: 80,
        saleUnit: "kg",
      });

      expect(captured?.saleUnit).toBe("kg");
      expect(result.saleUnit).toBe("kg");
    });

    it("repassa o code para o repo (busca/scanner por código)", async () => {
      let captured: CreateProductData | undefined;
      const repo = makeRepo({
        create: (_userId: string, data: CreateProductData) => {
          captured = data;
          return Promise.resolve(makeProduct({ code: data.code ?? null }));
        },
      });
      const sut = new ProductsUseCases(repo);

      const result = await sut.create(USER_ID, {
        name: "Brigadeiro",
        category: "doces",
        salePrice: 3.5,
        code: "7891234567890",
      });

      expect(captured?.code).toBe("7891234567890");
      expect(result.code).toBe("7891234567890");
    });

    it("repassa as fotos extras (galeria) para o repo", async () => {
      let captured: CreateProductData | undefined;
      const repo = makeRepo({
        create: (_userId: string, data: CreateProductData) => {
          captured = data;
          return Promise.resolve(makeProduct({ extraPhotos: data.extraPhotos ?? [] }));
        },
      });
      const sut = new ProductsUseCases(repo);

      const extraPhotos = ["https://cdn.x/b.jpg", "https://cdn.x/c.jpg"];
      const result = await sut.create(USER_ID, {
        name: "Bolo",
        category: "bolos",
        salePrice: 50,
        extraPhotos,
      });

      expect(captured?.extraPhotos).toEqual(extraPhotos);
      expect(result.extraPhotos).toEqual(extraPhotos);
    });

    it("preenche o costPrice a partir da receita quando há recipeId", async () => {
      let captured: CreateProductData | undefined;
      const repo = makeRepo({
        create: (_userId: string, data: CreateProductData) => {
          captured = data;
          return Promise.resolve(makeProduct({ costPrice: data.costPrice ?? null }));
        },
      });
      const sut = new ProductsUseCases(repo, {
        getCostPerUnit: () => Promise.resolve(4.2),
      });

      await sut.create(USER_ID, {
        name: "Bolo",
        category: "bolos",
        salePrice: 20,
        recipeId: "11111111-1111-1111-1111-111111111111",
      });

      expect(captured?.costPrice).toBe(4.2);
    });

    it("mantém o costPrice informado quando não há receita", async () => {
      let captured: CreateProductData | undefined;
      const repo = makeRepo({
        create: (_userId: string, data: CreateProductData) => {
          captured = data;
          return Promise.resolve(makeProduct());
        },
      });
      const sut = new ProductsUseCases(repo, {
        getCostPerUnit: () => Promise.resolve(99),
      });

      await sut.create(USER_ID, {
        name: "Bolo",
        category: "bolos",
        salePrice: 20,
        costPrice: 7,
      });

      expect(captured?.costPrice).toBe(7);
    });

    it("creates a composite product with components", async () => {
      let captured: CreateProductData | undefined;
      const repo = makeRepo({
        create: (_userId: string, data: CreateProductData) => {
          captured = data;
          return Promise.resolve(makeProduct({ isComposite: true }));
        },
      });
      const sut = new ProductsUseCases(repo);

      const result = await sut.create(USER_ID, {
        name: "Caixinha de doces",
        category: "kits",
        salePrice: 50,
        isComposite: true,
        components: [
          { componentProductId: "11111111-1111-1111-1111-111111111111", quantity: 6 },
          { componentProductId: "22222222-2222-2222-2222-222222222222", quantity: 4 },
        ],
      });

      expect(result.isComposite).toBe(true);
      expect(captured?.isComposite).toBe(true);
      expect(captured?.components).toHaveLength(2);
      // Custo do kit nao e informado: vem do rollup no repo (na leitura).
      expect(captured?.costPrice).toBeUndefined();
    });

    it("rejects a composite product without components", async () => {
      const { sut } = makeSut();
      await expect(
        sut.create(USER_ID, {
          name: "Kit vazio",
          category: "kits",
          salePrice: 50,
          isComposite: true,
          components: [],
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects a composite whose component is itself composite (no nesting)", async () => {
      const { sut } = makeSut({
        findComponentCandidates: (_userId: string, ids: string[]) =>
          Promise.resolve(ids.map((id) => ({ id, isComposite: true }))),
      });
      await expect(
        sut.create(USER_ID, {
          name: "Kit de kits",
          category: "kits",
          salePrice: 50,
          isComposite: true,
          components: [
            { componentProductId: "11111111-1111-1111-1111-111111111111", quantity: 1 },
          ],
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects a composite whose component does not belong to the user", async () => {
      const { sut } = makeSut({
        // Nenhum candidato encontrado -> componente nao pertence ao usuario.
        findComponentCandidates: () => Promise.resolve([]),
      });
      await expect(
        sut.create(USER_ID, {
          name: "Kit alheio",
          category: "kits",
          salePrice: 50,
          isComposite: true,
          components: [
            { componentProductId: "11111111-1111-1111-1111-111111111111", quantity: 1 },
          ],
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("getById", () => {
    it("returns product when found", async () => {
      const { sut } = makeSut();
      const result = await sut.getById(USER_ID, "prod-1");
      expect(result.id).toBe("prod-1");
    });

    it("throws NotFoundError when not found", async () => {
      const { sut } = makeSut({
        findById: () => Promise.resolve(null),
      });
      await expect(sut.getById(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });
  });

  describe("list", () => {
    it("returns paginated results", async () => {
      const { sut } = makeSut();
      const result = await sut.list(USER_ID, {
        page: 1,
        limit: 20,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe("update", () => {
    it("updates a product with valid data", async () => {
      const { sut } = makeSut();
      const result = await sut.update(USER_ID, "prod-1", {
        name: "Brigadeiro Gourmet",
      });

      expect(result.name).toBe("Brigadeiro Gourmet");
    });

    it("throws NotFoundError when product does not exist", async () => {
      const { sut } = makeSut({
        findById: () => Promise.resolve(null),
      });
      await expect(sut.update(USER_ID, "nope", { name: "Teste" })).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws ValidationError for invalid update", async () => {
      const { sut } = makeSut();
      await expect(sut.update(USER_ID, "prod-1", { salePrice: -5 })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("remove", () => {
    it("removes an existing product", async () => {
      const { sut } = makeSut();
      await expect(sut.remove(USER_ID, "prod-1")).resolves.toBeUndefined();
    });

    it("throws NotFoundError when product does not exist", async () => {
      const { sut } = makeSut({
        delete: () => Promise.resolve(false),
      });
      await expect(sut.remove(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });
  });
});
