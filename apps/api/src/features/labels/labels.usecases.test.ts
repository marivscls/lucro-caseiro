import type { Label } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { LimitExceededError, NotFoundError, ValidationError } from "../../shared/errors";
import { LabelsUseCases } from "./labels.usecases";
import type { CreateLabelData, FindAllOpts, ILabelsRepo } from "./labels.types";

const USER_ID = "user-123";

function makeLabel(overrides: Partial<Label> = {}): Label {
  return {
    id: "label-1",
    userId: USER_ID,
    productId: null,
    templateId: "classico",
    name: "Rótulo Brigadeiro",
    data: { productName: "Brigadeiro" },
    logoUrl: null,
    qrCodeUrl: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<ILabelsRepo> = {}): ILabelsRepo {
  return {
    create: (_userId: string, data: CreateLabelData) =>
      Promise.resolve(makeLabel({ name: data.name, templateId: data.templateId })),
    findById: () => Promise.resolve(makeLabel()),
    findAll: () => Promise.resolve({ items: [makeLabel()], total: 1 }),
    update: (_userId: string, _id: string, data: Partial<CreateLabelData>) =>
      Promise.resolve(makeLabel({ ...data })),
    delete: () => Promise.resolve(true),
    countByUser: () => Promise.resolve(1),
    ...overrides,
  };
}

function makeSut(repoOverrides: Partial<ILabelsRepo> = {}, premium = false) {
  const repo = makeRepo(repoOverrides);
  const sut = new LabelsUseCases(repo, () => Promise.resolve(premium));
  return { sut, repo };
}

describe("LabelsUseCases", () => {
  describe("estilo customizado (Premium)", () => {
    const styledData: CreateLabelData = {
      name: "Rótulo",
      templateId: "classico",
      data: { productName: "Brigadeiro", style: { accentColor: "#ff66aa" } },
    };

    it("bloqueia estilo customizado no plano free (create)", async () => {
      const { sut } = makeSut({}, false);
      await expect(sut.create(USER_ID, styledData)).rejects.toBeInstanceOf(
        LimitExceededError,
      );
    });

    it("bloqueia estilo customizado no plano free (update)", async () => {
      const { sut } = makeSut({}, false);
      await expect(
        sut.update(USER_ID, "label-1", { data: styledData.data }),
      ).rejects.toBeInstanceOf(LimitExceededError);
    });

    it("permite estilo customizado no premium", async () => {
      const { sut } = makeSut({}, true);
      const label = await sut.create(USER_ID, styledData);
      expect(label.name).toBe("Rótulo");
    });

    it("sem estilo, plano free segue criando normalmente", async () => {
      const { sut } = makeSut({}, false);
      const label = await sut.create(USER_ID, {
        name: "Rótulo",
        templateId: "classico",
        data: { productName: "Brigadeiro" },
      });
      expect(label.name).toBe("Rótulo");
    });

    it("style vazio ({}) nao exige premium", async () => {
      const { sut } = makeSut({}, false);
      const label = await sut.create(USER_ID, {
        name: "Rótulo",
        templateId: "classico",
        data: { productName: "Brigadeiro", style: {} },
      });
      expect(label.name).toBe("Rótulo");
    });
  });

  describe("create", () => {
    it("creates a label with valid data", async () => {
      const { sut } = makeSut();
      const result = await sut.create(USER_ID, {
        name: "Rótulo Brigadeiro",
        templateId: "classico",
        data: { productName: "Brigadeiro" },
      });

      expect(result.name).toBe("Rótulo Brigadeiro");
      expect(result.templateId).toBe("classico");
    });

    it("throws ValidationError for invalid data", async () => {
      const { sut } = makeSut();
      await expect(
        sut.create(USER_ID, {
          name: "",
          templateId: "invalido",
          data: { productName: "Brigadeiro" },
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("getById", () => {
    it("returns label when found", async () => {
      const { sut } = makeSut();
      const result = await sut.getById(USER_ID, "label-1");
      expect(result.id).toBe("label-1");
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

    it("passes productId filter to repo", async () => {
      let capturedOpts: FindAllOpts | undefined;
      const { sut } = makeSut({
        findAll: (_userId: string, opts: FindAllOpts) => {
          capturedOpts = opts;
          return Promise.resolve({ items: [], total: 0 });
        },
      });

      await sut.list(USER_ID, { page: 1, limit: 20, productId: "prod-1" });
      expect(capturedOpts?.productId).toBe("prod-1");
    });
  });

  describe("update", () => {
    it("updates a label with valid data", async () => {
      const { sut } = makeSut();
      const result = await sut.update(USER_ID, "label-1", {
        name: "Rótulo Gourmet",
      });

      expect(result.name).toBe("Rótulo Gourmet");
    });

    it("throws NotFoundError when label does not exist", async () => {
      const { sut } = makeSut({
        findById: () => Promise.resolve(null),
      });
      await expect(sut.update(USER_ID, "nope", { name: "Teste" })).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws ValidationError for invalid update", async () => {
      const { sut } = makeSut();
      await expect(
        sut.update(USER_ID, "label-1", { templateId: "invalido" }),
      ).rejects.toThrow(ValidationError);
    });

    it("passes logoUrl: null to repo to clear an existing logo", async () => {
      let received: Partial<CreateLabelData> | undefined;
      const { sut } = makeSut({
        findById: () => Promise.resolve(makeLabel({ logoUrl: "https://x/logo.png" })),
        update: (_userId, _id, data) => {
          received = data;
          return Promise.resolve(makeLabel({ ...data }));
        },
      });

      await sut.update(USER_ID, "label-1", { logoUrl: null });

      expect(received?.logoUrl).toBeNull();
    });
  });

  describe("remove", () => {
    it("removes an existing label", async () => {
      const { sut } = makeSut();
      await expect(sut.remove(USER_ID, "label-1")).resolves.toBeUndefined();
    });

    it("throws NotFoundError when label does not exist", async () => {
      const { sut } = makeSut({
        delete: () => Promise.resolve(false),
      });
      await expect(sut.remove(USER_ID, "nope")).rejects.toThrow(NotFoundError);
    });
  });

  describe("getTemplates", () => {
    it("returns available templates", () => {
      const { sut } = makeSut();
      const templates = sut.getTemplates();
      expect(templates).toHaveLength(5);
      expect(templates[0]).toHaveProperty("id");
      expect(templates[0]).toHaveProperty("name");
    });
  });
});
