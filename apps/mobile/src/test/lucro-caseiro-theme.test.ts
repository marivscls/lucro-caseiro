import { describe, expect, it } from "vitest";

import { lucroCaseiroBrand } from "../../../../packages/brands/src/lucro-caseiro";
import { buildThemes, fonts } from "../../../../packages/ui/src/theme";

describe("paleta do Lucro Caseiro", () => {
  it("mantem vinho e rosa de marca sem substituir o verde semantico", () => {
    const themes = buildThemes(lucroCaseiroBrand.theme);

    expect(themes.light.colors).toMatchObject({
      primaryStrong: "#4A1427",
      primaryInteractive: "#A85A67",
      success: "#2F7A56",
      successBg: "#E8F5EE",
    });
    expect(themes.dark.colors).toMatchObject({
      primaryStrong: "#F0C7D1",
      primaryInteractive: "#D48392",
      success: "#8FD4B0",
      successBg: "#2D5A42",
    });
  });
});

describe("tipografia do app", () => {
  it("usa apenas pesos da Manrope no design system", () => {
    expect(Object.values(fonts)).toEqual([
      "Manrope_400Regular",
      "Manrope_600SemiBold",
      "Manrope_700Bold",
      "Manrope_800ExtraBold",
    ]);
  });
});
