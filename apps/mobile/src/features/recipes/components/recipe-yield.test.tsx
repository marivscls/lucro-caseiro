import React from "react";
import { cleanup, fireEvent, render as renderUI, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Recipe } from "@lucro-caseiro/contracts";
import { EditRecipeForm } from "./edit-recipe-form";

vi.mock("react-native", async () => vi.importActual("react-native-web"));
vi.mock("../../../../../../packages/ui/src/use-reduced-motion", () => ({
  useReducedMotion: () => true,
}));
vi.mock("@lucro-caseiro/ui", async () =>
  vi.importActual("../../../../../../packages/ui/src/index"),
);
vi.mock("../../../shared/hooks/use-image-picker", () => ({
  useImagePicker: () => ({ imageUri: null, showPicker: vi.fn(), setImageUri: vi.fn() }),
}));
vi.mock("../../../shared/utils/upload-image", () => ({ uploadRecipeImage: vi.fn() }));
vi.mock("../../../shared/components/standard-modal", () => ({
  StandardModal: ({
    children,
    footer,
  }: {
    children: React.ReactNode;
    footer: React.ReactNode;
  }) => (
    <>
      {children}
      {footer}
    </>
  ),
}));
vi.mock("../hooks", () => ({
  useUpdateRecipe: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useDeleteRecipe: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));
vi.mock("../../materials/hooks", () => ({
  useMaterials: () => ({ data: { items: [] } }),
}));
vi.mock("../../../shared/utils/alerts", () => ({
  alertValidation: vi.fn(),
  alertError: vi.fn(),
}));

const recipe: Recipe = {
  id: "00000000-0000-4000-8000-000000000001",
  userId: "00000000-0000-4000-8000-000000000002",
  name: "Bolo de fubá",
  category: "Bolos",
  instructions: null,
  yieldQuantity: 12,
  yieldUnit: "fatias",
  photoUrl: null,
  totalCost: 0,
  costPerUnit: 0,
  ingredients: [],
  createdAt: "2026-09-10T00:00:00Z",
};

afterEach(cleanup);

function render(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderUI(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("recipe yield step", () => {
  it("blocks words in the actual recipe field", () => {
    render(<EditRecipeForm recipe={recipe} visible onClose={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    const input = screen.getByLabelText<HTMLInputElement>("Ex: 30 ou 1,5");
    fireEvent.change(input, { target: { value: "sadasd" } });
    expect(input.value).toBe("12");
  });

  it.each(["", "0", ",", "."])(
    "cannot advance with incomplete or zero yield %s",
    (value) => {
      render(<EditRecipeForm recipe={recipe} visible onClose={() => undefined} />);
      fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
      fireEvent.change(screen.getByLabelText("Ex: 30 ou 1,5"), { target: { value } });
      fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
      expect(screen.queryByRole("button", { name: "Continuar" })).not.toBeNull();
      expect(screen.queryByText("Salvar alterações")).toBeNull();
    },
  );

  it("allows advancing with fractional yield", () => {
    render(<EditRecipeForm recipe={recipe} visible onClose={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByLabelText("Ex: 30 ou 1,5"), {
      target: { value: "1,5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByText("Salvar alterações")).toBeTruthy();
  });
});
