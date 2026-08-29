import { describe, expect, it } from "vitest";

import { lucroCaseiroBrand } from "../../../../packages/brands/src/lucro-caseiro";
import {
  buildThemes,
  fonts,
  homeTypography,
  moneyTypography,
} from "../../../../packages/ui/src/theme";

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
      "Manrope_500Medium",
      "Manrope_600SemiBold",
      "Manrope_700Bold",
      "Manrope_800ExtraBold",
    ]);
  });

  it("mantem a escala semantica compacta da Home", () => {
    expect(homeTypography).toMatchObject({
      title: { fontSize: 20, fontFamily: fonts.bold, lineHeight: 26 },
      body: { fontSize: 14, fontFamily: fonts.regular, lineHeight: 20 },
      avatar: { fontSize: 17, fontFamily: fonts.semiBold },
      eyebrow: { fontSize: 11, fontFamily: fonts.bold, lineHeight: 15 },
      cardLead: { fontSize: 17, fontFamily: fonts.bold, lineHeight: 22 },
      description: {
        fontSize: 14,
        fontFamily: fonts.regular,
        lineHeight: 19,
      },
      action: { fontSize: 14, fontFamily: fonts.bold },
      link: { fontSize: 14, fontFamily: fonts.semiBold, lineHeight: 20 },
      financialLabel: {
        fontSize: 14,
        fontFamily: fonts.medium,
        lineHeight: 20,
      },
      financialValue: {
        fontSize: 22,
        fontFamily: fonts.bold,
        lineHeight: 28,
      },
      metricLabel: { fontSize: 12, fontFamily: fonts.medium, lineHeight: 16 },
      metricValue: { fontSize: 16, fontFamily: fonts.bold, lineHeight: 22 },
      goalTitle: { fontSize: 16, fontFamily: fonts.bold, lineHeight: 22 },
      goalValue: { fontSize: 18, fontFamily: fonts.bold, lineHeight: 24 },
      progress: { fontSize: 12, fontFamily: fonts.semiBold, lineHeight: 16 },
      progressStrong: { fontSize: 12, fontFamily: fonts.bold, lineHeight: 16 },
      shortcut: { fontSize: 13, fontFamily: fonts.semiBold, lineHeight: 18 },
      navigation: { fontSize: 12, fontFamily: fonts.medium, lineHeight: 16 },
      navigationActive: {
        fontSize: 12,
        fontFamily: fonts.bold,
        lineHeight: 16,
      },
    });
  });

  it("mantem a escala compacta de valores monetarios", () => {
    expect(moneyTypography).toMatchObject({
      money: { fontSize: 16, fontFamily: fonts.extraBold, lineHeight: 22 },
      moneyLg: { fontSize: 22, fontFamily: fonts.extraBold, lineHeight: 28 },
      moneyHero: { fontSize: 28, fontFamily: fonts.extraBold, lineHeight: 34 },
    });
  });
});
