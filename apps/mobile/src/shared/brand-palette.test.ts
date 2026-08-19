import { describe, expect, it } from "vitest";

import { darkTheme, lightTheme } from "../../../../packages/ui/src/theme";

import { brandScreenPalette } from "./brand-palette";

describe("brandScreenPalette", () => {
  it("preserva a paleta editorial no modo claro", () => {
    const palette = brandScreenPalette(lightTheme);

    expect(palette).toMatchObject({
      wine: "#4A2332",
      wineFill: "#4A2332",
      rose: "#B65F72",
      offWhite: "#FAF8F6",
      ink: "#24181E",
      white: "#FFFFFF",
      onWine: "#FFFFFF",
      overlay: lightTheme.colors.overlay,
    });
  });

  it("troca superfícies e textos pelos tokens do tema no modo escuro", () => {
    const palette = brandScreenPalette(darkTheme);

    expect(palette.wine).toBe(darkTheme.colors.primaryLight);
    expect(palette.wineFill).toBe("#4A2332");
    expect(palette.onWine).toBe("#FFFFFF");
    expect(palette.rose).toBe(darkTheme.colors.primaryInteractive);
    expect(palette.offWhite).toBe(darkTheme.colors.background);
    expect(palette.background).toBe(darkTheme.colors.background);
    expect(palette.ink).toBe(darkTheme.colors.text);
    expect(palette.white).toBe(darkTheme.colors.surfaceElevated);
    expect(palette.softRose).toBe(darkTheme.colors.primaryBg);
    expect(palette.muted).toBe(darkTheme.colors.textSecondary);
    expect(palette.border).toBe(darkTheme.colors.border);
    expect(palette.overlay).toBe(darkTheme.colors.overlay);
  });
});
