import { describe, expect, it } from "vitest";
import { resolveBrand } from "@lucro-caseiro/brands";

import { buildThemes, darkTheme, lightTheme } from "../../../../packages/ui/src/theme";

import { brandScreenPalette } from "./brand-palette";

function contrast(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const rgb = [1, 3, 5].map((offset) => {
      const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe("brandScreenPalette", () => {
  it("mantém contraste AA nos textos sobre cartões e destaques do modo escuro", () => {
    const { dark } = buildThemes(resolveBrand("lucro-caseiro").theme);
    const palette = brandScreenPalette(dark);
    for (const [text, background] of [
      [palette.wine, palette.white],
      [palette.wine, palette.softRose],
      [palette.onRose, palette.rose],
      [palette.onLime, palette.lime],
      [palette.onWine, palette.wineFill],
    ]) {
      expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("usa o tom de texto de alto contraste da marca nas superfícies escuras", () => {
    const { dark } = buildThemes(resolveBrand("lucro-caseiro").theme);
    const palette = brandScreenPalette(dark);
    expect(palette.wine).toBe("#F0C7D1");
    expect(palette.onLime).toBe("#4A2332");
  });
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
      onRose: "#FFFFFF",
      overlay: lightTheme.colors.overlay,
    });
  });

  it("troca superfícies e textos pelos tokens do tema no modo escuro", () => {
    const palette = brandScreenPalette(darkTheme);

    expect(palette.wine).toBe(darkTheme.colors.primaryStrong);
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
