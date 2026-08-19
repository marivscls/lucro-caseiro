import type { CatalogSettings, Product } from "@lucro-caseiro/contracts";
import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { createStorefrontCustomization } from "../catalog-customizer";
import {
  StorefrontContentPreview,
  StorefrontIdentityPreview,
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
});
