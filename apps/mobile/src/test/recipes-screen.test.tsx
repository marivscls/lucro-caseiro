import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RecipesScreen from "../app/recipes";

const { push, recipe } = vi.hoisted(() => ({
  push: vi.fn(),
  recipe: {
    id: "recipe-1",
    userId: "user-1",
    name: "[massa] Bolo de chocolate",
    category: "Bolos",
    instructions: null,
    photoUrl: null,
    yieldQuantity: 10,
    yieldUnit: "fatias",
    totalCost: 25,
    costPerUnit: 2.5,
    createdAt: "2026-09-10T00:00:00Z",
    ingredients: [
      {
        materialId: "material-1",
        materialName: "Chocolate",
        materialCostPerUnit: 25,
        quantity: 1,
        unit: "kg",
        cost: 25,
      },
    ],
  },
}));

vi.mock("react-native", async () => vi.importActual("react-native-web"));
vi.mock("@lucro-caseiro/ui", async () =>
  vi.importActual("../../../../packages/ui/src/index"),
);
vi.mock("../../../../packages/ui/src/use-reduced-motion", () => ({
  useReducedMotion: () => true,
}));
vi.mock("expo-router", () => ({
  useRouter: () => ({ push }),
  Stack: { Screen: () => null },
}));
vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../features/recipes/hooks", () => ({
  useAllRecipes: () => ({ data: [recipe] }),
  useRecipe: () => ({ data: recipe, isLoading: false }),
  useScaleRecipe: (_id: string, multiplier: number) => ({
    data: {
      ...recipe,
      yieldQuantity: 10 * multiplier,
      ingredients: [{ ...recipe.ingredients[0], cost: 25 * multiplier }],
    },
  }),
  useDeleteRecipe: () => ({ isPending: false }),
  useDuplicateRecipe: () => ({ isPending: false }),
}));
vi.mock("../features/subscription/business-copy", () => ({
  useBusinessCopy: () => ({
    formulaNoun: "receita",
    formulaNounPlural: "receitas",
    materialNoun: "ingrediente",
    materialNounPlural: "ingredientes",
  }),
}));
vi.mock("../shared/components/feature-route-guard", () => ({
  FeatureRouteGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../shared/components/screen-header", () => ({ ScreenHeader: () => null }));
vi.mock("../features/subscription/components/limit-banner", () => ({
  LimitBanner: () => null,
}));
vi.mock("../features/recipes/components/create-recipe-form", () => ({
  CreateRecipeForm: () => null,
}));
vi.mock("../features/recipes/components/edit-recipe-form", () => ({
  EditRecipeForm: () => null,
}));
vi.mock("../features/recipes/components/recipe-statistics-modal", () => ({
  RecipeStatisticsModal: () => null,
}));
vi.mock("../features/recipes/components/recipe-list", () => ({
  RecipeList: ({ onRecipePress }: { onRecipePress: (id: string) => void }) => (
    <button onClick={() => onRecipePress(recipe.id)}>Abrir receita</button>
  ),
}));
vi.mock("../shared/ingredient-image/ingredient-avatar", () => ({
  IngredientAvatar: () => null,
}));
vi.mock("../features/recipes/recipe-pdf", () => ({ exportRecipePdf: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("precificar a partir dos detalhes da receita", () => {
  it.each([1, 2])(
    "fecha o detalhe e envia o custo por unidade na escala %sx",
    (scale) => {
      render(<RecipesScreen />);
      fireEvent.click(screen.getByRole("button", { name: "Abrir receita" }));
      if (scale !== 1) fireEvent.click(screen.getByText(`${scale}x`));
      fireEvent.click(
        screen.getByRole("button", { name: "Precificar com esta receita" }),
      );

      expect(push).toHaveBeenCalledExactlyOnceWith({
        pathname: "/pricing",
        params: { recipeCost: "2.5", name: "Bolo de chocolate", category: "Bolos" },
      });
      expect(
        screen.queryByRole("button", { name: "Precificar com esta receita" }),
      ).toBeNull();
      expect(screen.queryByRole("dialog")).toBeNull();
    },
  );
});
