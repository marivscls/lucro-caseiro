import React from "react";
import {
  cleanup,
  fireEvent,
  render as renderUI,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Recipe } from "@lucro-caseiro/contracts";
import { EditRecipeForm } from "./edit-recipe-form";
import { RecipeDetail } from "./recipe-detail";

const photoFixture = vi.hoisted(() => ({
  selected: null as string | null,
  upload: vi.fn(),
  save: vi.fn(),
}));
import { alertError } from "../../../shared/utils/alerts";

vi.mock("react-native", async () => vi.importActual("react-native-web"));
vi.mock("../../../../../../packages/ui/src/use-reduced-motion", () => ({
  useReducedMotion: () => true,
}));
vi.mock("@lucro-caseiro/ui", async () =>
  vi.importActual("../../../../../../packages/ui/src/index"),
);
vi.mock("../../../shared/hooks/use-image-picker", () => ({
  useImagePicker: () => ({
    imageUri: photoFixture.selected,
    showPicker: vi.fn(),
    setImageUri: vi.fn(),
  }),
}));
vi.mock("../../../shared/utils/upload-image", () => ({
  uploadRecipeImage: photoFixture.upload,
}));
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
  useUpdateRecipe: () => ({ isPending: false, mutateAsync: photoFixture.save }),
  useDeleteRecipe: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useRecipe: () => ({ data: fractionalRecipe, isLoading: false }),
  useDuplicateRecipe: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useScaleRecipe: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));
vi.mock("../../materials/hooks", () => ({
  useMaterials: () => ({
    data: {
      items: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          name: "Farinha",
          unit: "kg",
          costPerUnit: 4.5,
          stockQuantity: 1,
        },
      ],
    },
  }),
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
beforeEach(() => {
  photoFixture.selected = null;
  photoFixture.upload.mockReset();
  photoFixture.save.mockReset();
  vi.mocked(alertError).mockClear();
});
const fractionalRecipe: Recipe = {
  ...recipe,
  yieldQuantity: 1.5,
  yieldUnit: "kg",
  totalCost: 2.25,
  costPerUnit: 1.5,
  ingredients: [
    {
      materialId: recipe.id,
      materialName: "Farinha",
      materialCostPerUnit: 4.5,
      quantity: 0.5,
      unit: "kg",
      cost: 2.25,
    },
  ],
};

function render(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderUI(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("recipe yield step", () => {
  it("reopens fractional yield and ingredient quantities with Brazilian decimals", () => {
    render(
      <EditRecipeForm recipe={fractionalRecipe} visible onClose={() => undefined} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByPlaceholderText<HTMLInputElement>("Ex: 30 ou 1,5").value).toBe(
      "1,5",
    );
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByPlaceholderText<HTMLInputElement>("Ex: 2").value).toBe("0,5");
  });
  it("shows fractional yield and ingredients with commas in the recipe detail", () => {
    render(<RecipeDetail recipeId={recipe.id} />);
    expect(screen.getByText("Rende: 1,5 kg")).toBeTruthy();
    expect(screen.getByText("0,5 kg")).toBeTruthy();
  });
  it("blocks words in the actual recipe field", () => {
    render(<EditRecipeForm recipe={recipe} visible onClose={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    const input = screen.getByPlaceholderText<HTMLInputElement>("Ex: 30 ou 1,5");
    fireEvent.change(input, { target: { value: "sadasd" } });
    expect(input.value).toBe("12");
  });

  it.each(["", "0", ",", "."])(
    "cannot advance with incomplete or zero yield %s",
    (value) => {
      render(<EditRecipeForm recipe={recipe} visible onClose={() => undefined} />);
      fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
      fireEvent.change(screen.getByPlaceholderText("Ex: 30 ou 1,5"), {
        target: { value },
      });
      fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
      expect(screen.queryByRole("button", { name: "Continuar" })).not.toBeNull();
      expect(screen.queryByText("Salvar alterações")).toBeNull();
    },
  );

  it("allows advancing with fractional yield", () => {
    render(<EditRecipeForm recipe={recipe} visible onClose={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByPlaceholderText("Ex: 30 ou 1,5"), {
      target: { value: "1,5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByText("Salvar alterações")).toBeTruthy();
  });
});

it("keeps actual recipe edit open on failed photo upload, retries and reopens saved URL in fixture", async () => {
  photoFixture.selected = "file:///fixture-selection.png";
  photoFixture.upload
    .mockRejectedValueOnce(Error("Storage fixture refused"))
    .mockResolvedValueOnce("https://cdn.test/recipe-persisted.png");
  photoFixture.save.mockImplementation((input: { data: { photoUrl?: string } }) => {
    fractionalRecipe.photoUrl = input.data.photoUrl ?? null;
    return Promise.resolve({ ...fractionalRecipe });
  });
  const first = render(
    <EditRecipeForm recipe={fractionalRecipe} visible onClose={() => undefined} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  fireEvent.click(screen.getByText("Salvar alterações"));
  await waitFor(() => expect(alertError).toHaveBeenCalledWith("Storage fixture refused"));
  expect(photoFixture.save).not.toHaveBeenCalled();
  expect(screen.getByText("Salvar alterações")).toBeTruthy();
  fireEvent.click(screen.getByText("Salvar alterações"));
  await waitFor(() => expect(photoFixture.save).toHaveBeenCalledOnce());
  expect(photoFixture.save).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        photoUrl: "https://cdn.test/recipe-persisted.png",
      }),
    }),
  );
  first.unmount();
  photoFixture.selected = null;
  const reopened = render(<RecipeDetail recipeId={fractionalRecipe.id} />);
  expect(reopened.container.innerHTML).toContain("https://cdn.test/recipe-persisted.png");
  fractionalRecipe.photoUrl = null;
});
