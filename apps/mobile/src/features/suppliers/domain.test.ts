import type { SupplierOverviewItem } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  filterAndSortSuppliers,
  supplierCategoryCounts,
  supplierHeroIllustrationWidth,
  supplierImageValidationError,
  supplierInitials,
  supplierInitialsBackground,
  supplierMatchesSearch,
  supplierPurchasePrefill,
  validateSupplierForm,
} from "./domain";
import {
  supplierPresetAfterCategoryChange,
  supplierPresets,
} from "./illustration-presets";

function makeSupplier(
  overrides: Partial<SupplierOverviewItem> = {},
): SupplierOverviewItem {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    userId: "22222222-2222-4222-8222-222222222222",
    name: "Casa do Confeiteiro",
    category: "supplies",
    phone: "11999998888",
    hasWhatsApp: true,
    email: null,
    address: null,
    purchaseDescription: "Farinha, chocolate e confeitos",
    notes: null,
    isPreferred: true,
    avatarType: "initials",
    avatarPresetId: null,
    avatarUrl: null,
    needsFollowUp: false,
    restockSoon: false,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastPurchase: {
      id: "33333333-3333-4333-8333-333333333333",
      description: "Reposição semanal",
      amount: 486.2,
      category: "material",
      purchasedAt: "2026-08-12",
      items: [
        {
          id: "44444444-4444-4444-8444-444444444444",
          productId: "55555555-5555-4555-8555-555555555555",
          productName: "Chocolate 70%",
          variationId: null,
          variationName: null,
          quantity: 2,
          unitCost: 20,
          subtotal: 40,
        },
      ],
    },
    totalPurchaseCount: 5,
    totalPurchaseAmount: 1842.6,
    hasOpenOrder: true,
    ...overrides,
  };
}

describe("supplier list domain", () => {
  it("counts active categories from real items", () => {
    const counts = supplierCategoryCounts([
      makeSupplier(),
      makeSupplier({ id: "2", category: "packaging" }),
      makeSupplier({ id: "3", category: "food" }),
    ]);
    expect(counts).toEqual({ all: 3, supplies: 1, packaging: 1, food: 1, other: 0 });
  });

  it("searches names and purchase descriptions without accents or case", () => {
    expect(
      supplierMatchesSearch(makeSupplier({ name: "Empório São José" }), "emporio sao"),
    ).toBe(true);
    expect(supplierMatchesSearch(makeSupplier(), "CHOCOLATE")).toBe(true);
    expect(supplierMatchesSearch(makeSupplier(), "confeitos")).toBe(true);
  });

  it("combines category and advanced filters", () => {
    const result = filterAndSortSuppliers(
      [makeSupplier(), makeSupplier({ id: "2", category: "food", isPreferred: false })],
      {
        search: "",
        category: "supplies",
        advanced: new Set(["preferred", "openOrder"]),
        sort: "recent",
      },
    );
    expect(result.map((supplier) => supplier.id)).toEqual([
      "11111111-1111-4111-8111-111111111111",
    ]);
  });

  it("sorts recent suppliers first and leaves suppliers without purchases last", () => {
    const result = filterAndSortSuppliers(
      [
        makeSupplier({ id: "none", name: "Sem compra", lastPurchase: null }),
        makeSupplier(),
      ],
      { search: "", category: "all", advanced: new Set(), sort: "recent" },
    );
    expect(result[0]?.name).toBe("Casa do Confeiteiro");
    expect(result[1]?.name).toBe("Sem compra");
  });

  it("supports highest value, most purchased and A–Z sorting", () => {
    const a = makeSupplier({
      id: "a",
      name: "Alfa",
      totalPurchaseCount: 1,
      totalPurchaseAmount: 10,
    });
    const z = makeSupplier({
      id: "z",
      name: "Zeta",
      totalPurchaseCount: 8,
      totalPurchaseAmount: 300,
    });
    const base = { search: "", category: "all" as const, advanced: new Set<never>() };
    expect(
      filterAndSortSuppliers([a, z], { ...base, sort: "mostPurchased" })[0]?.id,
    ).toBe("z");
    expect(filterAndSortSuppliers([a, z], { ...base, sort: "highestValue" })[0]?.id).toBe(
      "z",
    );
    expect(filterAndSortSuppliers([z, a], { ...base, sort: "az" })[0]?.id).toBe("a");
  });

  it("returns an empty collection without manufacturing demo data", () => {
    expect(
      filterAndSortSuppliers([], {
        search: "",
        category: "all",
        advanced: new Set(),
        sort: "recent",
      }),
    ).toEqual([]);
  });
});

describe("supplier form domain", () => {
  it("validates name, email and WhatsApp without phone", () => {
    const errors = validateSupplierForm({
      name: "",
      category: "supplies",
      phone: "",
      hasWhatsApp: true,
      email: "invalido",
    });
    expect(errors.name).toBeTruthy();
    expect(errors.phone).toContain("telefone");
    expect(errors.email).toBeTruthy();
  });

  it("accepts a valid optional contact", () => {
    expect(
      validateSupplierForm({
        name: "Bella",
        category: "packaging",
        phone: "(11) 99999-9999",
        hasWhatsApp: true,
        email: "oi@bella.com",
      }),
    ).toEqual({});
  });

  it("updates preset with category while preserving an upload", () => {
    const suppliesPreset = supplierPresets("supplies")[0]?.id ?? "";
    const foodPreset = supplierPresets("food")[0]?.id ?? "";
    expect(supplierPresetAfterCategoryChange("food", suppliesPreset, false)).toBe(
      foodPreset,
    );
    expect(supplierPresetAfterCategoryChange("food", null, true)).toBeNull();
  });

  it("validates upload type and size", () => {
    expect(
      supplierImageValidationError({ uri: "foto.gif", mimeType: "image/gif" }),
    ).toContain("PNG");
    expect(
      supplierImageValidationError({ uri: "foto.webp", fileSize: 6 * 1024 * 1024 }),
    ).toContain("5 MB");
    expect(
      supplierImageValidationError({
        uri: "foto.webp",
        mimeType: "image/webp",
        fileSize: 1024,
      }),
    ).toBeNull();
  });

  it("uses two initials as avatar fallback", () => {
    expect(supplierInitials("Casa do Confeiteiro")).toBe("CD");
    expect(supplierInitialsBackground("Casa do Confeiteiro")).toBe(
      supplierInitialsBackground("Casa do Confeiteiro"),
    );
    expect(supplierInitialsBackground("Casa do Confeiteiro")).toMatch(/^#/);
  });

  it("keeps six local illustration presets for every category", () => {
    for (const category of ["supplies", "packaging", "food", "other"] as const) {
      const presets = supplierPresets(category);
      expect(presets).toHaveLength(6);
      expect(new Set(presets.map((preset) => preset.id)).size).toBe(6);
      expect(presets.every((preset) => preset.category === category)).toBe(true);
    }
  });
});

describe("supplier actions and responsive hero", () => {
  it("builds a reviewable purchase prefill without creating a purchase", () => {
    const prefill = supplierPurchasePrefill(makeSupplier());
    expect(prefill?.supplierId).toBe("11111111-1111-4111-8111-111111111111");
    expect(prefill?.items[0]?.productName).toBe("Chocolate 70%");
  });

  it("keeps the official PNG fluid and bounded at critical widths", () => {
    const at320 = supplierHeroIllustrationWidth(320);
    const at768 = supplierHeroIllustrationWidth(768);
    expect(at320).toBeGreaterThanOrEqual(108);
    expect(at320).toBeLessThanOrEqual(320 * 0.42);
    expect(at768).toBe(190);
  });
});
