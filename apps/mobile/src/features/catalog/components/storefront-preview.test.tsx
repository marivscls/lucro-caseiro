import type { CatalogSettings, Product, Service } from "@lucro-caseiro/contracts";
import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { createStorefrontCustomization } from "../catalog-customizer";
import {
  StorefrontContentPreview,
  StorefrontFinalPreview,
  StorefrontIdentityPreview,
  StorefrontItemCard,
} from "./storefront-preview";

const settings: CatalogSettings = {
  brandId: "lucro-caseiro",
  slug: "atelier-lua",
  enabled: false,
  whatsapp: "11987654321",
  coverUrl: null,
  logoUrl: null,
  accentColor: "rose",
  titleColor: null,
  descriptionColor: null,
  pattern: null,
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
  updatedAt: "2026-08-18T12:00:00.000Z",
};

describe("storefront previews", () => {
  it("renderiza a identidade do rascunho sem conteúdo demonstrativo fixo", () => {
    const customization = createStorefrontCustomization(settings, "Ateliê Lua");
    const rendered = render(
      <StorefrontIdentityPreview
        customization={customization}
        products={[]}
        services={[]}
        status="dirty"
      />,
    );

    expect(rendered.container.textContent).toContain("Ateliê Lua");
    expect(rendered.container.textContent).toContain("Alterações não salvas");
    expect(rendered.container.textContent).not.toContain("Ateliê Aurora");
    expect(rendered.container.textContent).not.toContain("[massa]");
  });

  it("oculta prefixos técnicos nos cards da prévia", () => {
    const customization = createStorefrontCustomization(settings, "Ateliê Lua");
    const product: Product = {
      id: "11111111-1111-4111-8111-111111111111",
      userId: "22222222-2222-4222-8222-222222222222",
      name: "[massa] Bolo de pote morango",
      description: "Pote de 250 ml",
      category: "Doces",
      photoUrl: null,
      extraPhotos: [],
      code: null,
      salePrice: 16,
      saleUnit: "unit",
      costPrice: 8,
      recipeId: null,
      stockQuantity: 4,
      stockAlertThreshold: null,
      isComposite: false,
      isActive: true,
      publicEnabled: true,
      createdAt: "2026-08-18T12:00:00.000Z",
    };
    const rendered = render(
      <StorefrontContentPreview
        customization={customization}
        products={[product]}
        services={[]}
        status="saved"
      />,
    );

    expect(rendered.container.textContent).toContain("Bolo de pote morango");
    expect(rendered.container.textContent).not.toContain("[massa]");
    expect(rendered.container.textContent).toContain("Disponível");
    expect(rendered.container.textContent).not.toContain("a partir de");
    expect(rendered.container.textContent).toContain("Doces");
  });

  it("mostra Ver detalhes sem colocar a descrição no card", () => {
    const base = createStorefrontCustomization(settings, "Ateliê Lua");
    const customization = {
      ...base,
      organization: {
        ...base.organization,
        actions: {
          ...base.organization.actions,
          productDefault: { type: "details" as const, label: "Ver detalhes" },
        },
      },
    };
    const product: Product = {
      id: "11111111-1111-4111-8111-111111111111",
      userId: "22222222-2222-4222-8222-222222222222",
      name: "Bolo de pote morango",
      description: "Pote de 250 ml com morango e chocolate",
      category: "Doces",
      photoUrl: null,
      extraPhotos: [],
      code: null,
      salePrice: 16,
      saleUnit: "unit",
      costPrice: 8,
      recipeId: null,
      stockQuantity: 4,
      stockAlertThreshold: null,
      isComposite: false,
      isActive: true,
      publicEnabled: true,
      createdAt: "2026-08-18T12:00:00.000Z",
    };
    const rendered = render(
      <StorefrontItemCard item={product} kind="product" customization={customization} />,
    );

    expect(rendered.container.textContent).toContain("Ver detalhes");
    expect(rendered.container.textContent).not.toContain(
      "Pote de 250 ml com morango e chocolate",
    );
  });

  it("mostra estado vazio real quando o catálogo não possui itens", () => {
    const customization = createStorefrontCustomization(settings, "Ateliê Lua");
    const rendered = render(
      <StorefrontContentPreview
        customization={customization}
        products={[]}
        services={[]}
        status="saved"
      />,
    );

    expect(rendered.container.textContent).toContain("Seu conteúdo aparecerá aqui.");
  });

  it("no modal da prévia omite o chrome de editor", () => {
    const customization = createStorefrontCustomization(settings, "Ateliê Lua");
    const rendered = render(
      <StorefrontFinalPreview
        customization={customization}
        products={[]}
        services={[]}
        status="saved"
        chrome={false}
      />,
    );

    expect(rendered.container.textContent).not.toContain("PRÉVIA FINAL");
    expect(rendered.container.textContent).toContain("0 produtos • 0 serviços");
  });

  it("mostra só produtos ou só serviços conforme a aba", () => {
    const customization = createStorefrontCustomization(settings, "Ateliê Lua", {
      products: 1,
      services: 1,
    });
    const product: Product = {
      id: "11111111-1111-4111-8111-111111111111",
      userId: "22222222-2222-4222-8222-222222222222",
      name: "Bolo de chocolate",
      description: null,
      category: "Bolos",
      photoUrl: null,
      extraPhotos: [],
      code: null,
      salePrice: 74.9,
      saleUnit: "unit",
      costPrice: 20,
      recipeId: null,
      stockQuantity: 4,
      stockAlertThreshold: null,
      isComposite: false,
      isActive: true,
      publicEnabled: true,
      createdAt: "2026-08-18T12:00:00.000Z",
    };
    const service: Service = {
      id: "33333333-3333-4333-8333-333333333333",
      userId: "22222222-2222-4222-8222-222222222222",
      name: "Bolo personalizado",
      description: null,
      durationMinutes: 180,
      defaultPrice: 240,
      materialCost: 0,
      hourlyRate: 50,
      otherCost: 0,
      fixedCostShare: 0,
      markupPercent: 0,
      feesPercent: 0,
      locationMode: "business",
      bufferMinutes: 0,
      publicEnabled: true,
      bookingInstructions: null,
      variations: [],
      addOns: [],
      packages: [],
      active: true,
      createdAt: "2026-08-18T12:00:00.000Z",
    };
    const rendered = render(
      <StorefrontContentPreview
        customization={customization}
        products={[product]}
        services={[service]}
        status="saved"
        listing
      />,
    );

    expect(rendered.container.textContent).toContain("Produtos (1)");
    expect(rendered.container.textContent).toContain("Serviços (1)");
    expect(rendered.container.textContent).toContain("Bolo de chocolate");
    expect(rendered.container.textContent).not.toContain("Bolo personalizado");
  });

  it("na grade da listagem mostra nome e preço inteiros", () => {
    const customization = createStorefrontCustomization(settings, "Ateliê Lua");
    const product: Product = {
      id: "11111111-1111-4111-8111-111111111111",
      userId: "22222222-2222-4222-8222-222222222222",
      name: "Bolo de pote morango",
      description: "Pote de 250 ml",
      category: "Doces",
      photoUrl: null,
      extraPhotos: [],
      code: null,
      salePrice: 16,
      saleUnit: "unit",
      costPrice: 8,
      recipeId: null,
      stockQuantity: 4,
      stockAlertThreshold: null,
      isComposite: false,
      isActive: true,
      publicEnabled: true,
      createdAt: "2026-08-18T12:00:00.000Z",
    };
    const rendered = render(
      <StorefrontContentPreview
        customization={customization}
        products={[product]}
        services={[]}
        status="saved"
        listing
      />,
    );

    expect(rendered.container.textContent).toContain("Escolha o que deseja");
    expect(rendered.container.textContent).toContain("Bolo de pote morango");
    expect(rendered.container.textContent).toMatch(/R\$\s*16,00/);
    expect(rendered.container.textContent).toContain("Pedir");
  });
});
