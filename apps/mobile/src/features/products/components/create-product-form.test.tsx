import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@lucro-caseiro/ui", async (original) => ({
  ...(await original<object>()),
  Button: ({ title, onPress }: { title: string; onPress: () => void }) => (
    <button onClick={onPress}>{title}</button>
  ),
  CenteredTextInput: () => null,
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  useBrand: () => ({ id: "lucro-caseiro", copy: {} }),
  useFeature: () => false,
  fontSizes: { sm: 14, md: 16 },
  fonts: { regular: "System", semiBold: "System", bold: "System" },
}));
vi.mock("../../../shared/components/standard-modal", () => ({
  StandardModal: ({
    children,
    footer,
  }: {
    children: React.ReactNode;
    footer: React.ReactNode;
  }) => (
    <div>
      {children}
      {footer}
    </div>
  ),
}));
vi.mock("../../../shared/components/form-step-progress", () => ({
  FormStepProgress: ({ current }: { current: number }) => (
    <span data-testid="product-step">{current}</span>
  ),
}));
vi.mock("../../../shared/components/form-section", () => ({
  FormSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("../../../shared/components/responsive-modal-surface", () => ({
  ResponsiveOverlayModal: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("../../../shared/components/barcode-scanner", () => ({
  BarcodeScanner: () => null,
}));
vi.mock("../../../shared/hooks/use-image-picker", () => ({
  useImagePicker: () => ({
    imageUri: null,
    pickFromCamera: vi.fn(),
    pickFromGallery: vi.fn(),
    clear: vi.fn(),
  }),
}));
vi.mock("../../../shared/hooks/use-limit-check", () => ({
  useLimitCheck: () => ({ checkAndBlock: () => false }),
}));
vi.mock("../../../shared/hooks/use-paywall", () => ({
  usePaywall: () => vi.fn(),
}));
vi.mock("../../../shared/hooks/use-auth", () => ({
  useAuth: Object.assign(() => ({}), { getState: () => ({ token: null }) }),
}));
vi.mock("../../analytics/tracker", () => ({ trackAnalyticsAction: vi.fn() }));
vi.mock("../../subscription/hooks", () => ({
  useProfile: () => ({ data: null }),
}));
vi.mock("../../subscription/business-copy", () => ({
  businessCopyFor: () => ({
    productNoun: "produto",
    productExample: "Marmita executiva",
    categoryExample: "Doces, Salgados, Bolos",
    categoryPresets: [],
  }),
}));
vi.mock("../hooks", () => ({
  useCreateProduct: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useProducts: () => ({ data: { items: [] }, refetch: vi.fn() }),
}));
vi.mock("./component-picker", () => ({
  ComponentPicker: () => null,
  draftsToComponents: () => [],
}));
vi.mock("./composite-toggle", () => ({ CompositeToggle: () => null }));
vi.mock("./sale-unit-toggle", () => ({ SaleUnitToggle: () => null }));
vi.mock("./variation-editor", () => ({ VariationEditor: () => null }));

import { CreateProductForm } from "./create-product-form";

afterEach(cleanup);

describe("avanço do cadastro de produto", () => {
  it("mantém a etapa Essencial quando os campos obrigatórios estão vazios", () => {
    render(
      <CreateProductForm
        modal={{ visible: true, title: "Novo produto", onClose: () => {} }}
      />,
    );

    fireEvent.click(screen.getByText("Continuar"));

    expect(screen.getByTestId("product-step").textContent).toBe("1");
  });
});
